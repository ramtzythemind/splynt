/**
 * Flight data providers.
 *
 * Splynt never calls a provider during a page render — free tiers are far too
 * small for that. Providers are polled by the import job, which normalises
 * their output into the `schedules` table. The departure board then reads only
 * from Postgres, so it stays fast and keeps working when a provider is down or
 * out of quota.
 */

/** A departure as the provider describes it, before normalisation. */
export interface ProviderFlight {
  /** Compact flight number, e.g. "AZ610". */
  flightNumber: string;
  /** ICAO code of the operating airline, e.g. "ITY". */
  airlineIcao: string;
  depIcao: string;
  arrIcao: string;
  /** Scheduled departure, UTC wall clock "HH:MM". */
  stdUtc: string;
  /** Block time in minutes, when the provider reports an arrival time. */
  blockMinutes?: number;
  /** ICAO type code, e.g. "A339". Absent on providers that only give a model name. */
  aircraftIcao?: string;
  /** Raw model text, kept so the importer can attempt its own mapping. */
  aircraftModel?: string;
  /** Passengers, when known. Otherwise the importer estimates from the type. */
  pax?: number;
  /** ISO weekdays this flight operates, 1 = Monday. Defaults to daily. */
  daysOfWeek?: number[];
  /** Stable provider-side identifier, used for reconciliation. */
  sourceRef?: string;
}

/**
 * An airport the provider mentioned that we may not have in the reference set.
 * The importer inserts these so imported flights are never orphaned.
 */
export interface AirportHint {
  icao: string;
  iata?: string | null;
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  timezone: string;
  elevationFt?: number;
}

export interface FetchOptions {
  /** Origin to pull departures for. */
  airportIcao: string;
  /** Keep only flights operated by this airline (ICAO). */
  airlineIcao: string;
  /** UTC day to fetch. */
  date: Date;
}

export interface FetchResult {
  flights: ProviderFlight[];
  airports: AirportHint[];
  /** Free-form notes surfaced in the import log (quota warnings, gaps, …). */
  notes: string[];
}

export interface FlightProvider {
  readonly id: string;
  readonly label: string;
  /** Human-readable description of what this provider can and cannot supply. */
  readonly caveats: string;
  /** False when the required credentials are missing from the environment. */
  isConfigured(): boolean;
  fetchDepartures(options: FetchOptions): Promise<FetchResult>;
}

export class ProviderError extends Error {
  constructor(
    readonly provider: string,
    message: string,
    readonly status?: number,
  ) {
    super(`[${provider}] ${message}`);
  }
}

/** "AZ 610" / "AZ610 " / "ITY610" → "AZ610" */
export function normaliseFlightNumber(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase();
}

/** Formats a Date as the UTC wall clock "HH:MM". */
export function utcHHMM(date: Date): string {
  return date.toISOString().slice(11, 16);
}
