import { acarsError, authenticateAcars } from "@/lib/acars-auth";
import { rankForXp } from "@/lib/career";

export const dynamic = "force-dynamic";

/**
 * First call from the desktop client. Confirms the token and hands back the
 * pilot's identity plus every flight currently booked, so the client can
 * show a dispatch list without a second round trip.
 */
export async function GET(request: Request) {
  try {
    const { pilot, db } = await authenticateAcars(request);

    const { data: bookings, error } = await db
      .from("bookings")
      .select(
        `id, flight_date, status, aircraft_icao, pax, cargo_kg,
         schedules ( flight_number, dep_icao, arr_icao, std_utc, block_minutes, distance_nm,
                     airlines ( icao, iata, name, callsign ) )`,
      )
      .eq("pilot_id", pilot.id)
      .in("status", ["booked", "in_progress"])
      .order("flight_date", { ascending: true });

    if (error) throw error;

    return Response.json({
      pilot: {
        id: pilot.id,
        callsign: pilot.callsign,
        displayName: pilot.display_name,
        xp: pilot.xp,
        rank: rankForXp(pilot.xp).name,
        rankLevel: pilot.rank_level,
        currentIcao: pilot.current_icao,
      },
      bookings,
      serverTime: new Date().toISOString(),
    });
  } catch (err) {
    return acarsError(err);
  }
}
