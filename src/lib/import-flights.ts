import type { SupabaseClient } from "@supabase/supabase-js";
import { distanceNm } from "@/lib/utils";
import {
  estimatePax,
  inferAircraftForLeg,
  matchAircraft,
} from "@/lib/providers/aircraft-match";
import type { FlightProvider, ProviderFlight } from "@/lib/providers/types";

export interface ImportOptions {
  airlineIcao: string;
  /** Origin airport. Defaults to the airline's hub. */
  airportIcao?: string;
  /** UTC day to import. Defaults to today. */
  date?: Date;
  /** Parse and report without writing anything. */
  dryRun?: boolean;
}

export interface ImportReport {
  provider: string;
  airlineIcao: string;
  airportIcao: string;
  date: string;
  found: number;
  saved: number;
  airportsAdded: number;
  skipped: { flight: string; reason: string }[];
  notes: string[];
  dryRun: boolean;
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
  source: string;
  source_ref: string | null;
  last_seen_at: string;
  is_active: boolean;
}

/**
 * Pulls one airline-day from a provider and folds it into `schedules`.
 *
 * Everything the provider cannot supply is derived here rather than guessed at
 * read time: distance from airport coordinates, block time from cruise speed,
 * aircraft from the airline's fleet, passengers from seat count × load factor.
 * A flight that still cannot be resolved is skipped with a reason instead of
 * being written with invented data.
 */
export async function importDepartures(
  db: SupabaseClient,
  provider: FlightProvider,
  options: ImportOptions,
): Promise<ImportReport> {
  const airlineIcao = options.airlineIcao.toUpperCase();
  const date = options.date ?? new Date();
  const skipped: ImportReport["skipped"] = [];

  const { data: airline, error: airlineError } = await db
    .from("airlines")
    .select("id, icao, hub_icao")
    .eq("icao", airlineIcao)
    .maybeSingle();

  if (airlineError) throw airlineError;
  if (!airline) {
    throw new Error(
      `Compagnia ${airlineIcao} non presente. Esegui prima "npm run db:seed".`,
    );
  }

  const airportIcao = (options.airportIcao ?? airline.hub_icao).toUpperCase();

  const started = new Date().toISOString();
  const { flights, airports, notes } = await provider.fetchDepartures({
    airportIcao,
    airlineIcao,
    date,
  });

  // 1. Add airports the provider mentioned that we do not already know.
  //    `ignoreDuplicates` protects the curated reference rows from being
  //    overwritten by lower-quality provider data.
  let airportsAdded = 0;
  if (airports.length > 0 && !options.dryRun) {
    const { data, error } = await db
      .from("airports")
      .upsert(
        airports.map((a) => ({
          icao: a.icao,
          iata: a.iata ?? null,
          name: a.name,
          city: a.city,
          country: a.country,
          lat: a.lat,
          lon: a.lon,
          elevation_ft: a.elevationFt ?? 0,
          timezone: a.timezone,
          source: provider.id,
        })),
        { onConflict: "icao", ignoreDuplicates: true },
      )
      .select("icao");
    if (error) throw error;
    airportsAdded = data?.length ?? 0;
  }

  // 2. Reference data needed to fill the gaps.
  const [{ data: knownAirports }, { data: fleet }, { data: types }] =
    await Promise.all([
      db.from("airports").select("icao, lat, lon"),
      db
        .from("airline_fleet")
        .select("aircraft_icao")
        .eq("airline_id", airline.id),
      db.from("aircraft_types").select("icao, cruise_speed_kt, range_nm, pax_capacity"),
    ]);

  const coords = new Map(
    (knownAirports ?? []).map((a) => [a.icao, { lat: a.lat, lon: a.lon }]),
  );
  const fleetIcaos = (fleet ?? []).map((f) => f.aircraft_icao);
  const typeByIcao = new Map((types ?? []).map((t) => [t.icao, t]));

  if (typeByIcao.size === 0) {
    throw new Error(
      'Nessun tipo aeromobile nel database. Esegui prima "npm run db:seed".',
    );
  }

  // 3. Normalise each flight, dropping anything that cannot be resolved.
  const rows = new Map<string, ScheduleRow>();
  const now = new Date().toISOString();

  for (const flight of flights) {
    const resolved = resolve(flight, {
      coords,
      fleetIcaos,
      typeByIcao,
      airlineId: airline.id,
      providerId: provider.id,
      now,
    });

    if ("reason" in resolved) {
      skipped.push({ flight: flight.flightNumber, reason: resolved.reason });
      continue;
    }
    // Later duplicates of the same number from the same field win.
    rows.set(`${resolved.row.flight_number}|${resolved.row.dep_icao}`, resolved.row);
  }

  const toSave = [...rows.values()];

  // 4. Write.
  let saved = 0;
  if (!options.dryRun && toSave.length > 0) {
    const { error } = await db
      .from("schedules")
      .upsert(toSave, { onConflict: "airline_id,flight_number,dep_icao" });
    if (error) throw error;
    saved = toSave.length;
  }

  const report: ImportReport = {
    provider: provider.id,
    airlineIcao,
    airportIcao,
    date: date.toISOString().slice(0, 10),
    found: flights.length,
    saved: options.dryRun ? 0 : saved,
    airportsAdded,
    skipped,
    notes,
    dryRun: !!options.dryRun,
  };

  if (!options.dryRun) {
    await db.from("import_runs").insert({
      provider: provider.id,
      airline_icao: airlineIcao,
      airport_icao: airportIcao,
      target_date: report.date,
      flights_found: report.found,
      flights_saved: report.saved,
      airports_added: report.airportsAdded,
      skipped: skipped.length ? skipped : null,
      started_at: started,
      finished_at: new Date().toISOString(),
    });
  }

  return report;
}

interface ResolveContext {
  coords: Map<string, { lat: number; lon: number }>;
  fleetIcaos: string[];
  typeByIcao: Map<
    string,
    { icao: string; cruise_speed_kt: number; range_nm: number; pax_capacity: number }
  >;
  airlineId: string;
  providerId: string;
  now: string;
}

function resolve(
  flight: ProviderFlight,
  ctx: ResolveContext,
): { row: ScheduleRow } | { reason: string } {
  const dep = ctx.coords.get(flight.depIcao);
  const arr = ctx.coords.get(flight.arrIcao);

  if (!dep) return { reason: `aeroporto di partenza ${flight.depIcao} sconosciuto` };
  if (!arr) return { reason: `aeroporto di arrivo ${flight.arrIcao} sconosciuto` };

  const distance = distanceNm(dep.lat, dep.lon, arr.lat, arr.lon);
  if (distance < 25) return { reason: `tratta troppo corta (${distance} NM)` };

  // Aircraft: what the provider said → what its model text implies → what the
  // airline could plausibly have used on a leg this long.
  const aircraftIcao =
    (flight.aircraftIcao && ctx.typeByIcao.has(flight.aircraftIcao)
      ? flight.aircraftIcao
      : null) ??
    matchAircraft(flight.aircraftModel) ??
    inferAircraftForLeg(ctx.fleetIcaos, distance);

  if (!aircraftIcao) {
    return {
      reason: flight.aircraftModel
        ? `aeromobile "${flight.aircraftModel}" non riconosciuto`
        : "nessun aeromobile in flotta con raggio sufficiente",
    };
  }

  const type = ctx.typeByIcao.get(aircraftIcao);
  if (!type) return { reason: `tipo ${aircraftIcao} assente dal database` };
  if (distance > type.range_nm) {
    return { reason: `${distance} NM oltre il raggio di ${aircraftIcao}` };
  }

  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(flight.stdUtc)) {
    return { reason: `orario "${flight.stdUtc}" non valido` };
  }

  const factor = distance > 1500 ? 1.08 : 1.05;
  const blockMinutes =
    flight.blockMinutes ??
    Math.max(
      35,
      Math.round((30 + (distance / type.cruise_speed_kt) * 60 * factor) / 5) * 5,
    );

  const pax = flight.pax ?? estimatePax(aircraftIcao);

  return {
    row: {
      airline_id: ctx.airlineId,
      flight_number: flight.flightNumber,
      dep_icao: flight.depIcao,
      arr_icao: flight.arrIcao,
      std_utc: `${flight.stdUtc}:00`,
      block_minutes: blockMinutes,
      aircraft_icao: aircraftIcao,
      pax_typical: Math.min(pax, type.pax_capacity),
      cargo_kg: Math.round(pax * 18 + distance * 1.5),
      distance_nm: distance,
      source: ctx.providerId,
      source_ref: flight.sourceRef ?? null,
      last_seen_at: ctx.now,
      is_active: true,
    },
  };
}
