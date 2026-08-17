import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Great-circle distance in nautical miles. */
export function distanceNm(
  latA: number,
  lonA: number,
  latB: number,
  lonB: number,
): number {
  const R = 3440.065; // Earth radius in NM
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(latB - latA);
  const dLon = toRad(lonB - lonA);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(latA)) * Math.cos(toRad(latB)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)));
}

/** "14:35" from a "14:35:00" postgres time or an ISO timestamp. */
export function hhmm(value: string | null | undefined): string {
  if (!value) return "--:--";
  if (/^\d{2}:\d{2}/.test(value)) return value.slice(0, 5);
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "--:--"
    : d.toISOString().slice(11, 16);
}

/** 95 -> "1h 35m" */
export function durationLabel(minutes: number | null | undefined): string {
  if (minutes == null) return "--";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("it-IT").format(Math.round(n));
}
