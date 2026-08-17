import { z } from "zod";
import { acarsError, authenticateAcars } from "@/lib/acars-auth";
import { scoreFlight } from "@/lib/career";
import { isNightAt } from "@/lib/flights";
import { distanceNm } from "@/lib/utils";
import type { AircraftClass } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

const FinalizeSchema = z.object({
  pirepId: z.string().uuid(),
  landingRateFpm: z.number().int().min(-6000).max(1000),
  fuelUsedKg: z.number().int().min(0).max(400_000),
  maxAltitudeFt: z.number().int().min(0).max(60_000),
  maxG: z.number().min(0).max(10).optional(),
  overspeedEvents: z.number().int().min(0).max(999).default(0),
  stallEvents: z.number().int().min(0).max(999).default(0),
  pauseEvents: z.number().int().min(0).max(999).default(0),
  /** Where the aircraft actually shut down, as detected by the client. */
  arrivalIcao: z.string().length(4).optional(),
  actualOut: z.string().datetime().nullable().optional(),
  actualOff: z.string().datetime().nullable().optional(),
  actualOn: z.string().datetime().nullable().optional(),
  actualIn: z.string().datetime().nullable().optional(),
  remarks: z.string().max(500).optional(),
});

/** Total track length flown, from the recorded position reports. */
function trackLength(points: { lat: number; lon: number }[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += distanceNm(
      points[i - 1].lat,
      points[i - 1].lon,
      points[i].lat,
      points[i].lon,
    );
  }
  return Math.round(total);
}

export async function POST(request: Request) {
  try {
    const { pilot, db } = await authenticateAcars(request);
    const body = FinalizeSchema.parse(await request.json());

    const { data: pirep } = await db
      .from("pireps")
      .select("*")
      .eq("id", body.pirepId)
      .maybeSingle();

    if (!pirep) return Response.json({ error: "PIREP non trovato" }, { status: 404 });
    if (pirep.pilot_id !== pilot.id) {
      return Response.json({ error: "PIREP di un altro pilota" }, { status: 403 });
    }
    if (pirep.status !== "in_progress") {
      return Response.json({ error: "PIREP già chiuso" }, { status: 409 });
    }

    const { data: booking } = await db
      .from("bookings")
      .select(
        `id, pax, flight_date, aircraft_icao,
         schedules ( std_utc, block_minutes, distance_nm, airlines ( difficulty ) )`,
      )
      .eq("id", pirep.booking_id)
      .single();

    if (!booking) {
      return Response.json({ error: "Prenotazione non trovata" }, { status: 404 });
    }

    const schedule = booking.schedules as unknown as {
      std_utc: string;
      block_minutes: number;
      distance_nm: number;
      airlines: { difficulty: number };
    };

    const [{ data: aircraft }, { data: arrAirport }, { data: points }] =
      await Promise.all([
        db
          .from("aircraft_types")
          .select("class")
          .eq("icao", pirep.aircraft_icao)
          .single(),
        db
          .from("airports")
          .select("icao, lat, lon, timezone")
          .eq("icao", pirep.arr_icao)
          .single(),
        db
          .from("telemetry")
          .select("lat, lon, ts")
          .eq("pirep_id", pirep.id)
          .order("ts", { ascending: true }),
      ]);

    const actualOut = body.actualOut ?? pirep.actual_out;
    const actualIn = body.actualIn ?? pirep.actual_in ?? new Date().toISOString();
    const actualOn = body.actualOn ?? pirep.actual_on ?? actualIn;

    // Delay against the published STD for the booked date.
    const std = new Date(`${booking.flight_date}T${schedule.std_utc}Z`);
    const departureDelayMin = actualOut
      ? Math.round((new Date(actualOut).getTime() - std.getTime()) / 60_000)
      : null;

    const blockMinutes = actualOut
      ? Math.max(
          1,
          Math.round(
            (new Date(actualIn).getTime() - new Date(actualOut).getTime()) / 60_000,
          ),
        )
      : schedule.block_minutes;

    // Off-target if the client reported a different field, or the last fix is
    // more than 10 NM from the filed destination.
    const last = points?.at(-1);
    const farFromField =
      !!last &&
      !!arrAirport &&
      distanceNm(last.lat, last.lon, arrAirport.lat, arrAirport.lon) > 10;
    const landedOffTarget =
      (!!body.arrivalIcao && body.arrivalIcao !== pirep.arr_icao) || farFromField;

    const scored = scoreFlight({
      distanceNm: schedule.distance_nm,
      pax: booking.pax,
      blockMinutes,
      aircraftClass: (aircraft?.class ?? "narrowbody") as AircraftClass,
      airlineDifficulty: schedule.airlines?.difficulty ?? 2,
      landingRateFpm: body.landingRateFpm,
      departureDelayMin,
      trackDistanceNm: points && points.length > 2 ? trackLength(points) : null,
      overspeedEvents: body.overspeedEvents,
      stallEvents: body.stallEvents,
      pauseEvents: body.pauseEvents,
      landedOffTarget,
      nightLanding: arrAirport
        ? isNightAt(new Date(actualOn), arrAirport.timezone)
        : false,
    });

    // Flipping to 'accepted' fires apply_pirep(), which awards the XP,
    // recomputes the rank and moves the pilot to the destination.
    const { error } = await db
      .from("pireps")
      .update({
        status: "accepted",
        actual_out: actualOut,
        actual_off: body.actualOff ?? pirep.actual_off,
        actual_on: actualOn,
        actual_in: actualIn,
        block_minutes: blockMinutes,
        landing_rate_fpm: body.landingRateFpm,
        fuel_used_kg: body.fuelUsedKg,
        max_altitude_ft: body.maxAltitudeFt,
        max_g: body.maxG ?? null,
        overspeed_events: body.overspeedEvents,
        stall_events: body.stallEvents,
        pause_events: body.pauseEvents,
        landed_off_target: landedOffTarget,
        score: scored.score,
        xp_awarded: scored.total,
        breakdown: scored,
        remarks: body.remarks ?? null,
        filed_at: new Date().toISOString(),
      })
      .eq("id", pirep.id);

    if (error) throw error;

    return Response.json({
      pirepId: pirep.id,
      score: scored.score,
      grade: scored.grade,
      xpAwarded: scored.total,
      landingQuality: scored.landingQuality,
      breakdown: scored.lines,
    });
  } catch (err) {
    return acarsError(err);
  }
}
