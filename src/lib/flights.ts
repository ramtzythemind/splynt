/**
 * Turns rows of the published timetable into dated, flyable instances —
 * what the departure board actually shows.
 */
import type { Airport, Schedule } from "@/lib/supabase/types";

export interface FlightInstance {
  scheduleId: string;
  flightNumber: string;
  flightDate: string; // YYYY-MM-DD, the UTC date of departure
  departure: Date; // STD in UTC
  arrival: Date; // STA in UTC
  blockMinutes: number;
  distanceNm: number;
  aircraftIcao: string;
  pax: number;
  cargoKg: number;
  dep: Airport;
  arr: Airport;
}

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** ISO weekday of a UTC date: 1 = Monday … 7 = Sunday. */
export function isoWeekday(d: Date): number {
  return d.getUTCDay() === 0 ? 7 : d.getUTCDay();
}

/** Builds the flight for a given UTC date, or null if it does not operate. */
export function instanceFor(
  schedule: Schedule,
  date: Date,
  airports: Map<string, Airport>,
): FlightInstance | null {
  if (!schedule.days_of_week.includes(isoWeekday(date))) return null;

  const dep = airports.get(schedule.dep_icao);
  const arr = airports.get(schedule.arr_icao);
  if (!dep || !arr) return null;

  const [h, m] = schedule.std_utc.split(":").map(Number);
  const departure = new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      h,
      m,
      0,
    ),
  );
  const arrival = new Date(departure.getTime() + schedule.block_minutes * 60_000);

  return {
    scheduleId: schedule.id,
    flightNumber: schedule.flight_number,
    flightDate: isoDate(departure),
    departure,
    arrival,
    blockMinutes: schedule.block_minutes,
    distanceNm: schedule.distance_nm,
    aircraftIcao: schedule.aircraft_icao,
    pax: schedule.pax_typical,
    cargoKg: schedule.cargo_kg,
    dep,
    arr,
  };
}

/** All instances of the given schedules across `days` days from `from`. */
export function buildBoard(
  schedules: Schedule[],
  airports: Map<string, Airport>,
  from: Date,
  days: number,
): FlightInstance[] {
  const out: FlightInstance[] = [];
  for (let i = 0; i < days; i++) {
    const day = new Date(from.getTime() + i * 86_400_000);
    for (const s of schedules) {
      const inst = instanceFor(s, day, airports);
      if (inst) out.push(inst);
    }
  }
  return out.sort((a, b) => a.departure.getTime() - b.departure.getTime());
}

/** Local wall-clock time at an airport, e.g. "14:35". */
export function localTime(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
    hour12: false,
  }).format(date);
}

export function utcTime(date: Date): string {
  return date.toISOString().slice(11, 16);
}

/** How many calendar days the arrival lands after departure, in local terms. */
export function dayOffset(departure: Date, arrival: Date, tz: string): number {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: tz, dateStyle: "short" });
  const a = fmt.format(departure);
  const b = fmt.format(arrival);
  return a === b ? 0 : 1;
}

/** True when the sun is down at the destination — drives the night bonus. */
export function isNightAt(date: Date, timezone: string): boolean {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      hour12: false,
      timeZone: timezone,
    }).format(date),
  );
  return hour >= 21 || hour < 6;
}
