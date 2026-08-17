/**
 * Hand-maintained mirror of supabase/migrations/0001_schema.sql.
 * Regenerate with `supabase gen types typescript` once the CLI is linked.
 */

export type AircraftClass =
  | "turboprop"
  | "regional"
  | "narrowbody"
  | "widebody"
  | "heavy";

export type BookingStatus = "booked" | "in_progress" | "completed" | "cancelled";
export type PirepStatus = "in_progress" | "filed" | "accepted" | "rejected";

export interface Airport {
  icao: string;
  iata: string | null;
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  elevation_ft: number;
  timezone: string;
  longest_rwy_ft: number | null;
}

export interface AircraftTypeRow {
  icao: string;
  name: string;
  manufacturer: string;
  class: AircraftClass;
  pax_capacity: number;
  cruise_speed_kt: number;
  range_nm: number;
  mtow_kg: number;
  min_rank_level: number;
}

export interface Airline {
  id: string;
  icao: string;
  iata: string | null;
  name: string;
  callsign: string;
  country: string;
  hub_icao: string;
  accent: string;
  tagline: string | null;
  description: string | null;
  difficulty: number;
}

export interface AirlineFleet {
  airline_id: string;
  aircraft_icao: string;
  tail_count: number;
}

export interface Schedule {
  id: string;
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
  days_of_week: number[];
  is_active: boolean;
}

export interface Rank {
  level: number;
  name: string;
  min_xp: number;
  max_class: AircraftClass;
  perk: string | null;
}

export interface Pilot {
  id: string;
  callsign: string;
  display_name: string;
  airline_id: string | null;
  home_base_icao: string | null;
  current_icao: string | null;
  xp: number;
  rank_level: number;
  total_flights: number;
  total_minutes: number;
  total_pax: number;
  onboarded_at: string | null;
  created_at: string;
}

export interface AcarsToken {
  id: string;
  pilot_id: string;
  label: string;
  token_hash: string;
  prefix: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

export interface Booking {
  id: string;
  pilot_id: string;
  schedule_id: string;
  flight_date: string;
  status: BookingStatus;
  aircraft_icao: string;
  pax: number;
  cargo_kg: number;
  created_at: string;
}

export interface Pirep {
  id: string;
  booking_id: string;
  pilot_id: string;
  status: PirepStatus;
  aircraft_icao: string;
  dep_icao: string;
  arr_icao: string;
  actual_out: string | null;
  actual_off: string | null;
  actual_on: string | null;
  actual_in: string | null;
  block_minutes: number | null;
  landing_rate_fpm: number | null;
  fuel_used_kg: number | null;
  distance_nm: number | null;
  max_altitude_ft: number | null;
  max_g: number | null;
  overspeed_events: number;
  stall_events: number;
  pause_events: number;
  landed_off_target: boolean;
  score: number | null;
  xp_awarded: number | null;
  breakdown: XpBreakdown | null;
  remarks: string | null;
  sim: string | null;
  client_version: string | null;
  created_at: string;
  filed_at: string | null;
}

export interface XpLine {
  label: string;
  amount: number;
  detail?: string;
}

export interface XpBreakdown {
  lines: XpLine[];
  total: number;
  score: number;
  grade: string;
}

export interface TelemetryRow {
  id: number;
  pirep_id: string;
  ts: string;
  lat: number;
  lon: number;
  altitude_ft: number;
  gs_kt: number;
  ias_kt: number | null;
  vs_fpm: number | null;
  heading: number | null;
  fuel_kg: number | null;
  on_ground: boolean;
  phase: string | null;
}

export interface XpEvent {
  id: string;
  pilot_id: string;
  pirep_id: string | null;
  amount: number;
  reason: string;
  created_at: string;
}

/**
 * Note: the Supabase clients are intentionally untyped. Once the project is
 * linked, `supabase gen types typescript` can generate a real `Database` type
 * and the clients can be re-parameterised with it.
 */
