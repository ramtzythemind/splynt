import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Airline, Airport, Pilot } from "@/lib/supabase/types";

export interface PilotContext {
  pilot: Pilot;
  airline: Airline | null;
  position: Airport | null;
}

/** Loads the signed-in pilot with their airline and current position. */
export async function getPilotContext(): Promise<PilotContext> {
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

  const [airlineRes, positionRes] = await Promise.all([
    pilot.airline_id
      ? supabase.from("airlines").select("*").eq("id", pilot.airline_id).single()
      : Promise.resolve({ data: null }),
    pilot.current_icao
      ? supabase.from("airports").select("*").eq("icao", pilot.current_icao).single()
      : Promise.resolve({ data: null }),
  ]);

  return {
    pilot: pilot as Pilot,
    airline: (airlineRes.data as Airline) ?? null,
    position: (positionRes.data as Airport) ?? null,
  };
}
