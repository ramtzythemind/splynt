"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canFly, rankForXp } from "@/lib/career";
import { isoWeekday } from "@/lib/flights";
import { distanceNm } from "@/lib/utils";
import type { AircraftClass } from "@/lib/supabase/types";

type Result = { ok: true } | { ok: false; error: string };

async function requirePilot() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: pilot } = await supabase
    .from("pilots")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!pilot) redirect("/login");
  return { supabase, pilot };
}

/** Signs the pilot to an airline and puts them at its hub. */
export async function joinAirline(airlineId: string): Promise<Result> {
  const { supabase, pilot } = await requirePilot();

  const { data: airline } = await supabase
    .from("airlines")
    .select("id, hub_icao")
    .eq("id", airlineId)
    .single();

  if (!airline) return { ok: false, error: "Compagnia non trovata" };

  const { error } = await supabase
    .from("pilots")
    .update({
      airline_id: airline.id,
      home_base_icao: airline.hub_icao,
      current_icao: pilot.current_icao ?? airline.hub_icao,
      onboarded_at: pilot.onboarded_at ?? new Date().toISOString(),
    })
    .eq("id", pilot.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/hub");
  revalidatePath("/board");
  return { ok: true };
}

export async function updateCallsign(callsign: string): Promise<Result> {
  const clean = callsign.trim().toUpperCase();
  if (!/^[A-Z0-9]{3,12}$/.test(clean)) {
    return { ok: false, error: "Il callsign deve avere 3-12 caratteri alfanumerici" };
  }

  const { supabase, pilot } = await requirePilot();
  const { error } = await supabase
    .from("pilots")
    .update({ callsign: clean })
    .eq("id", pilot.id);

  if (error) {
    return {
      ok: false,
      error: error.code === "23505" ? "Callsign già in uso" : error.message,
    };
  }

  revalidatePath("/pilot");
  return { ok: true };
}

/**
 * Books a dated instance of a scheduled flight. Enforces the career rules:
 * right airline, right rank for the aircraft, and the pilot must actually be
 * at the departure airport.
 */
export async function bookFlight(
  scheduleId: string,
  flightDate: string,
): Promise<Result> {
  const { supabase, pilot } = await requirePilot();

  if (!pilot.airline_id) {
    return { ok: false, error: "Scegli prima una compagnia" };
  }

  const { data: schedule } = await supabase
    .from("schedules")
    .select(
      `id, airline_id, dep_icao, arr_icao, std_utc, pax_typical, cargo_kg,
       aircraft_icao, days_of_week, is_active,
       aircraft_types ( class )`,
    )
    .eq("id", scheduleId)
    .single();

  if (!schedule || !schedule.is_active) {
    return { ok: false, error: "Volo non disponibile" };
  }
  if (schedule.airline_id !== pilot.airline_id) {
    return { ok: false, error: "Questo volo appartiene a un'altra compagnia" };
  }

  const date = new Date(`${flightDate}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return { ok: false, error: "Data non valida" };
  }
  if (!schedule.days_of_week.includes(isoWeekday(date))) {
    return { ok: false, error: "Il volo non opera in questa data" };
  }

  const klass = (schedule.aircraft_types as unknown as { class: AircraftClass } | null)
    ?.class;
  if (klass && !canFly(pilot.rank_level, klass)) {
    const rank = rankForXp(pilot.xp);
    return {
      ok: false,
      error: `${schedule.aircraft_icao} richiede un grado superiore a ${rank.name}`,
    };
  }

  if (pilot.current_icao && pilot.current_icao !== schedule.dep_icao) {
    return {
      ok: false,
      error: `Sei a ${pilot.current_icao}. Riposizionati a ${schedule.dep_icao} per prendere questo volo.`,
    };
  }

  const { count } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("pilot_id", pilot.id)
    .in("status", ["booked", "in_progress"]);

  if ((count ?? 0) >= 5) {
    return { ok: false, error: "Hai già 5 voli in dispatch. Completane o annullane uno." };
  }

  const { error } = await supabase.from("bookings").insert({
    pilot_id: pilot.id,
    schedule_id: schedule.id,
    flight_date: flightDate,
    aircraft_icao: schedule.aircraft_icao,
    pax: schedule.pax_typical,
    cargo_kg: schedule.cargo_kg,
  });

  if (error) {
    return {
      ok: false,
      error: error.code === "23505" ? "Volo già prenotato" : error.message,
    };
  }

  revalidatePath("/hub");
  revalidatePath("/board");
  return { ok: true };
}

export async function cancelBooking(bookingId: string): Promise<Result> {
  const { supabase, pilot } = await requirePilot();

  const { error } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId)
    .eq("pilot_id", pilot.id)
    .eq("status", "booked");

  if (error) return { ok: false, error: error.message };

  revalidatePath("/hub");
  revalidatePath("/board");
  return { ok: true };
}

/**
 * Repositions the pilot as a passenger. Costs XP proportional to the distance —
 * the career equivalent of deadheading on someone else's metal.
 */
export async function deadhead(icao: string): Promise<Result> {
  const { supabase, pilot } = await requirePilot();

  if (pilot.current_icao === icao) return { ok: true };

  const { data: airports } = await supabase
    .from("airports")
    .select("icao, lat, lon")
    .in("icao", [icao, pilot.current_icao ?? icao]);

  const target = airports?.find((a) => a.icao === icao);
  const from = airports?.find((a) => a.icao === pilot.current_icao);
  if (!target) return { ok: false, error: "Aeroporto sconosciuto" };

  const nm = from ? distanceNm(from.lat, from.lon, target.lat, target.lon) : 0;
  const cost = Math.min(pilot.xp, Math.max(100, Math.round(nm * 0.15)));

  const { error } = await supabase
    .from("pilots")
    .update({ current_icao: icao, xp: pilot.xp - cost })
    .eq("id", pilot.id);

  if (error) return { ok: false, error: error.message };

  await supabase.from("xp_events").insert({
    pilot_id: pilot.id,
    amount: -cost,
    reason: `Deadhead ${pilot.current_icao ?? "—"} → ${icao}`,
  });

  revalidatePath("/hub");
  revalidatePath("/board");
  return { ok: true };
}
