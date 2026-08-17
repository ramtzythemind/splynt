import { z } from "zod";
import { acarsError, authenticateAcars } from "@/lib/acars-auth";

export const dynamic = "force-dynamic";

const StartSchema = z.object({
  bookingId: z.string().uuid(),
  sim: z.enum(["MSFS2020", "MSFS2024"]),
  clientVersion: z.string().max(32),
});

/**
 * Opens a flight. Creates the PIREP shell that telemetry will attach to and
 * flips the booking to in_progress. Idempotent: reconnecting mid-flight
 * returns the PIREP already open for that booking.
 */
export async function POST(request: Request) {
  try {
    const { pilot, db } = await authenticateAcars(request);
    const body = StartSchema.parse(await request.json());

    const { data: booking, error: bookingError } = await db
      .from("bookings")
      .select(
        `id, pilot_id, status, aircraft_icao, pax,
         schedules ( flight_number, dep_icao, arr_icao, std_utc, block_minutes, distance_nm )`,
      )
      .eq("id", body.bookingId)
      .single();

    if (bookingError || !booking) {
      return Response.json({ error: "Prenotazione non trovata" }, { status: 404 });
    }
    if (booking.pilot_id !== pilot.id) {
      return Response.json({ error: "Prenotazione di un altro pilota" }, { status: 403 });
    }
    if (booking.status === "completed") {
      return Response.json({ error: "Volo già completato" }, { status: 409 });
    }

    const schedule = booking.schedules as unknown as {
      flight_number: string;
      dep_icao: string;
      arr_icao: string;
      std_utc: string;
      block_minutes: number;
      distance_nm: number;
    };

    // The client needs the field coordinates to detect off/on blocks locally.
    const { data: fields } = await db
      .from("airports")
      .select("icao, lat, lon, elevation_ft, name, city")
      .in("icao", [schedule.dep_icao, schedule.arr_icao]);

    const airports = {
      dep: fields?.find((f) => f.icao === schedule.dep_icao) ?? null,
      arr: fields?.find((f) => f.icao === schedule.arr_icao) ?? null,
    };

    const { data: existing } = await db
      .from("pireps")
      .select("id, status")
      .eq("booking_id", booking.id)
      .maybeSingle();

    if (existing && existing.status === "in_progress") {
      return Response.json({
        pirepId: existing.id,
        resumed: true,
        schedule,
        airports,
      });
    }
    if (existing) {
      return Response.json({ error: "PIREP già archiviato" }, { status: 409 });
    }

    const { data: pirep, error } = await db
      .from("pireps")
      .insert({
        booking_id: booking.id,
        pilot_id: pilot.id,
        status: "in_progress",
        aircraft_icao: booking.aircraft_icao,
        dep_icao: schedule.dep_icao,
        arr_icao: schedule.arr_icao,
        distance_nm: schedule.distance_nm,
        sim: body.sim,
        client_version: body.clientVersion,
      })
      .select("id")
      .single();

    if (error) throw error;

    await db
      .from("bookings")
      .update({ status: "in_progress" })
      .eq("id", booking.id);

    return Response.json({
      pirepId: pirep.id,
      resumed: false,
      schedule,
      airports,
    });
  } catch (err) {
    return acarsError(err);
  }
}
