/**
 * Loads the reference world into Supabase: airports, aircraft, ranks,
 * airlines, fleets and the full timetable (outbound + generated returns).
 *
 *   npm run db:seed
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { AIRPORTS } from "../src/data/airports";
import { AIRCRAFT, RANKS } from "../src/data/aircraft";
import { AIRLINES, type Route } from "../src/data/airlines";
import { distanceNm } from "../src/lib/utils";

// --- minimal .env.local loader (no dependency needed) ---------------------
try {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = (m[2] ?? "").replace(/^["']|["']$/g, "");
    }
  }
} catch {
  // no .env.local — rely on the ambient environment
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(
    "✗ Servono NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const db = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const airportByIcao = new Map(AIRPORTS.map((a) => [a[0], a]));
const aircraftByIcao = new Map(AIRCRAFT.map((a) => [a.icao, a]));

/** Realistic block time: taxi + climb/descent overhead + cruise, rounded to 5'. */
function blockMinutes(distance: number, cruiseKt: number): number {
  const factor = distance > 1500 ? 1.08 : 1.05;
  const raw = 30 + (distance / cruiseKt) * 60 * factor;
  return Math.max(35, Math.round(raw / 5) * 5);
}

/** Ground time before the aircraft flies back. */
function turnaround(klass: string): number {
  if (klass === "heavy") return 120;
  if (klass === "widebody") return 90;
  return 50;
}

function addMinutes(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(":").map(Number);
  const total = (h * 60 + m + minutes) % 1440;
  const norm = (total + 1440) % 1440;
  return `${String(Math.floor(norm / 60)).padStart(2, "0")}:${String(norm % 60).padStart(2, "0")}`;
}

/** AZ610 -> AZ611, BA5 -> BA6, FR112 -> FR113 */
function nextFlightNumber(fn: string): string {
  const m = fn.match(/^([A-Z0-9]*?)(\d+)$/);
  if (!m) return `${fn}R`;
  return m[1] + String(Number(m[2]) + 1);
}

interface ScheduleRow {
  airline_id: string;
  flight_number: string;
  dep_icao: string;
  arr_icao: string;
  std_utc: string;
  block_minutes: number;
  aircraft_icao: string;
  pax_typical: number;
  cargo_kg: number;
  distance_nm: number;
}

function buildLegs(airlineId: string, route: Route): ScheduleRow[] {
  const [fn, dep, arr, std, ac, pax, retFn, retStd] = route;
  const depAp = airportByIcao.get(dep);
  const arrAp = airportByIcao.get(arr);
  const type = aircraftByIcao.get(ac);

  if (!depAp) throw new Error(`${fn}: aeroporto di partenza sconosciuto ${dep}`);
  if (!arrAp) throw new Error(`${fn}: aeroporto di arrivo sconosciuto ${arr}`);
  if (!type) throw new Error(`${fn}: tipo aeromobile sconosciuto ${ac}`);

  const distance = distanceNm(depAp[5], depAp[6], arrAp[5], arrAp[6]);
  if (distance > type.rangeNm) {
    throw new Error(
      `${fn}: ${dep}-${arr} è ${distance} NM, fuori raggio per ${ac} (${type.rangeNm} NM)`,
    );
  }

  const block = blockMinutes(distance, type.cruiseKt);
  const cargo = Math.round(pax * 18 + distance * 1.5);

  const out: ScheduleRow = {
    airline_id: airlineId,
    flight_number: fn,
    dep_icao: dep,
    arr_icao: arr,
    std_utc: `${std}:00`,
    block_minutes: block,
    aircraft_icao: ac,
    pax_typical: pax,
    cargo_kg: cargo,
    distance_nm: distance,
  };

  const back: ScheduleRow = {
    ...out,
    flight_number: retFn ?? nextFlightNumber(fn),
    dep_icao: arr,
    arr_icao: dep,
    std_utc: `${retStd ?? addMinutes(std, block + turnaround(type.klass))}:00`,
    pax_typical: Math.round(pax * 0.94),
  };

  return [out, back];
}

async function main() {
  console.log("→ Aeroporti…");
  const airports = AIRPORTS.map((a) => ({
    icao: a[0],
    iata: a[1],
    name: a[2],
    city: a[3],
    country: a[4],
    lat: a[5],
    lon: a[6],
    elevation_ft: a[7],
    timezone: a[8],
  }));
  let r = await db.from("airports").upsert(airports, { onConflict: "icao" });
  if (r.error) throw r.error;
  console.log(`  ${airports.length} aeroporti`);

  console.log("→ Aeromobili…");
  r = await db.from("aircraft_types").upsert(
    AIRCRAFT.map((a) => ({
      icao: a.icao,
      name: a.name,
      manufacturer: a.manufacturer,
      class: a.klass,
      pax_capacity: a.pax,
      cruise_speed_kt: a.cruiseKt,
      range_nm: a.rangeNm,
      mtow_kg: a.mtowKg,
      min_rank_level: a.minRank,
    })),
    { onConflict: "icao" },
  );
  if (r.error) throw r.error;
  console.log(`  ${AIRCRAFT.length} tipi`);

  console.log("→ Gradi…");
  r = await db.from("ranks").upsert(
    RANKS.map((k) => ({
      level: k.level,
      name: k.name,
      min_xp: k.minXp,
      max_class: k.maxClass,
      perk: k.perk,
    })),
    { onConflict: "level" },
  );
  if (r.error) throw r.error;

  console.log("→ Compagnie, flotte e orari…");
  let totalLegs = 0;

  for (const al of AIRLINES) {
    const { data: airline, error } = await db
      .from("airlines")
      .upsert(
        {
          icao: al.icao,
          iata: al.iata,
          name: al.name,
          callsign: al.callsign,
          country: al.country,
          hub_icao: al.hub,
          accent: al.accent,
          tagline: al.tagline,
          description: al.description,
          difficulty: al.difficulty,
        },
        { onConflict: "icao" },
      )
      .select("id")
      .single();
    if (error) throw error;

    const fleetRes = await db.from("airline_fleet").upsert(
      al.fleet.map(([icao, count]) => ({
        airline_id: airline.id,
        aircraft_icao: icao,
        tail_count: count,
      })),
      { onConflict: "airline_id,aircraft_icao" },
    );
    if (fleetRes.error) throw fleetRes.error;

    const legs = al.routes.flatMap((route) => buildLegs(airline.id, route));

    // De-duplicate: a generated return can collide with an explicit route.
    const seen = new Set<string>();
    const unique = legs.filter((l) => {
      const k = `${l.flight_number}|${l.dep_icao}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    const schedRes = await db
      .from("schedules")
      .upsert(unique, { onConflict: "airline_id,flight_number,dep_icao" });
    if (schedRes.error) throw schedRes.error;

    totalLegs += unique.length;
    console.log(`  ${al.iata} ${al.name.padEnd(28)} ${unique.length} tratte`);
  }

  console.log(`\n✓ Seed completato — ${totalLegs} voli schedulati totali.`);
}

main().catch((err) => {
  console.error("\n✗ Seed fallito:", err.message ?? err);
  process.exit(1);
});
