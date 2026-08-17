import type { Config } from "./config.js";
import { CLIENT_VERSION } from "./config.js";

export interface BookingSummary {
  id: string;
  flight_date: string;
  status: "booked" | "in_progress";
  aircraft_icao: string;
  pax: number;
  cargo_kg: number;
  schedules: {
    flight_number: string;
    dep_icao: string;
    arr_icao: string;
    std_utc: string;
    block_minutes: number;
    distance_nm: number;
    airlines: { icao: string; iata: string; name: string; callsign: string } | null;
  } | null;
}

export interface Handshake {
  pilot: {
    id: string;
    callsign: string;
    displayName: string;
    xp: number;
    rank: string;
    rankLevel: number;
    currentIcao: string | null;
  };
  bookings: BookingSummary[];
  serverTime: string;
}

export interface Field {
  icao: string;
  lat: number;
  lon: number;
  elevation_ft: number;
  name: string;
  city: string;
}

export interface SessionStart {
  pirepId: string;
  resumed: boolean;
  schedule: {
    flight_number: string;
    dep_icao: string;
    arr_icao: string;
    std_utc: string;
    block_minutes: number;
    distance_nm: number;
  };
  airports: { dep: Field | null; arr: Field | null };
}

export interface TelemetryPoint {
  ts: string;
  lat: number;
  lon: number;
  altitudeFt: number;
  gsKt: number;
  iasKt: number;
  vsFpm: number;
  heading: number;
  fuelKg: number;
  onGround: boolean;
  phase: string;
}

export interface FinalizeResult {
  pirepId: string;
  score: number;
  grade: string;
  xpAwarded: number;
  landingQuality: string;
  breakdown: { label: string; amount: number; detail?: string }[];
}

export class SplyntApi {
  constructor(private readonly config: Config) {}

  private async call<T>(
    path: string,
    init?: { method?: string; body?: unknown },
  ): Promise<T> {
    const res = await fetch(`${this.config.baseUrl}${path}`, {
      method: init?.method ?? "GET",
      headers: {
        authorization: `Bearer ${this.config.token}`,
        "content-type": "application/json",
      },
      body: init?.body ? JSON.stringify(init.body) : undefined,
    });

    const text = await res.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      throw new Error(`Risposta non valida dal server (${res.status})`);
    }

    if (!res.ok) {
      const message =
        (data as { error?: string }).error ?? `Errore HTTP ${res.status}`;
      throw new Error(message);
    }
    return data as T;
  }

  handshake() {
    return this.call<Handshake>("/api/acars/handshake");
  }

  startSession(bookingId: string) {
    return this.call<SessionStart>("/api/acars/session", {
      method: "POST",
      body: { bookingId, sim: this.config.sim, clientVersion: CLIENT_VERSION },
    });
  }

  sendTelemetry(
    pirepId: string,
    points: TelemetryPoint[],
    events?: { out?: string; off?: string; on?: string; in?: string },
  ) {
    return this.call<{ accepted: number }>("/api/acars/telemetry", {
      method: "POST",
      body: { pirepId, points, events },
    });
  }

  finalize(body: Record<string, unknown>) {
    return this.call<FinalizeResult>("/api/acars/finalize", {
      method: "POST",
      body,
    });
  }
}
