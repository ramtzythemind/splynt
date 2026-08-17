import {
  ProviderError,
  utcHHMM,
  type FetchOptions,
  type FetchResult,
  type FlightProvider,
  type ProviderFlight,
} from "./types";

const AUTH_URL =
  "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token";
const API = "https://opensky-network.org/api";

interface OpenSkyFlight {
  icao24: string;
  firstSeen: number;
  estDepartureAirport: string | null;
  lastSeen: number;
  estArrivalAirport: string | null;
  callsign: string | null;
}

/**
 * OpenSky Network — free, and the only provider here with no paywall at all.
 *
 * It reports flights that actually flew, derived from ADS-B, rather than a
 * published timetable. That means real routes and real block times, but no
 * aircraft type and no passenger counts: the importer fills both in from the
 * airline's fleet. Arrival airports are estimated and occasionally null.
 *
 * Auth is OAuth2 client credentials (basic auth was retired in March 2026) and
 * each query window is capped at two hours, so a full day costs 12 requests.
 */
export class OpenSkyProvider implements FlightProvider {
  readonly id = "opensky";
  readonly label = "OpenSky Network";
  readonly caveats =
    "Voli realmente volati via ADS-B. Nessun tipo aeromobile né passeggeri: dedotti dalla flotta della compagnia. Gli aeroporti di arrivo sono stimati e talvolta assenti.";

  private readonly clientId = process.env.OPENSKY_CLIENT_ID;
  private readonly clientSecret = process.env.OPENSKY_CLIENT_SECRET;
  private token: { value: string; expiresAt: number } | null = null;

  isConfigured() {
    return !!this.clientId && !!this.clientSecret;
  }

  private async accessToken(): Promise<string> {
    // Tokens last ~30 minutes; refresh a minute early to avoid a race.
    if (this.token && Date.now() < this.token.expiresAt - 60_000) {
      return this.token.value;
    }
    if (!this.clientId || !this.clientSecret) {
      throw new ProviderError(
        this.id,
        "OPENSKY_CLIENT_ID e OPENSKY_CLIENT_SECRET non configurati",
      );
    }

    const res = await fetch(AUTH_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    });

    if (!res.ok) {
      throw new ProviderError(this.id, `autenticazione fallita (${res.status})`, res.status);
    }

    const body = (await res.json()) as { access_token: string; expires_in: number };
    this.token = {
      value: body.access_token,
      expiresAt: Date.now() + body.expires_in * 1000,
    };
    return this.token.value;
  }

  async fetchDepartures(options: FetchOptions): Promise<FetchResult> {
    const token = await this.accessToken();
    const airline = options.airlineIcao.toUpperCase();

    const dayStart = Math.floor(
      Date.UTC(
        options.date.getUTCFullYear(),
        options.date.getUTCMonth(),
        options.date.getUTCDate(),
      ) / 1000,
    );

    const notes: string[] = [];
    const seen = new Map<string, ProviderFlight>();
    const TWO_HOURS = 7200;

    for (let offset = 0; offset < 86_400; offset += TWO_HOURS) {
      const begin = dayStart + offset;
      const end = begin + TWO_HOURS;

      const res = await fetch(
        `${API}/flights/departure?airport=${options.airportIcao}&begin=${begin}&end=${end}`,
        { headers: { authorization: `Bearer ${token}` } },
      );

      // 404 simply means "no flights in this window" on OpenSky.
      if (res.status === 404) continue;
      if (res.status === 429) {
        notes.push("crediti giornalieri OpenSky esauriti, import parziale");
        break;
      }
      if (!res.ok) {
        throw new ProviderError(this.id, `HTTP ${res.status}`, res.status);
      }

      const rows = (await res.json()) as OpenSkyFlight[];
      for (const row of rows) {
        const parsed = this.parse(row, airline, options.airportIcao, notes);
        if (parsed) seen.set(parsed.flightNumber, parsed);
      }
    }

    // OpenSky knows nothing about airports, so it contributes no hints —
    // unknown destinations are dropped by the importer instead.
    return { flights: [...seen.values()], airports: [], notes };
  }

  private parse(
    row: OpenSkyFlight,
    airline: string,
    airportIcao: string,
    notes: string[],
  ): ProviderFlight | null {
    const callsign = row.callsign?.trim().toUpperCase();
    if (!callsign || !callsign.startsWith(airline)) return null;

    const suffix = callsign.slice(airline.length);
    if (!/^\d{1,4}[A-Z]?$/.test(suffix)) return null;

    if (!row.estArrivalAirport) {
      notes.push(`${callsign}: aeroporto di arrivo non determinato`);
      return null;
    }
    const arrIcao = row.estArrivalAirport.toUpperCase();
    if (arrIcao === airportIcao.toUpperCase()) return null;

    const off = new Date(row.firstSeen * 1000);
    const on = new Date(row.lastSeen * 1000);
    const airborne = Math.round((on.getTime() - off.getTime()) / 60_000);
    if (airborne <= 0 || airborne > 1200) return null;

    // firstSeen is wheels-up and lastSeen is touchdown, so add typical taxi
    // time at both ends to get something comparable to a published block time.
    const blockMinutes = airborne + 20;
    const std = new Date(off.getTime() - 12 * 60_000);

    return {
      flightNumber: `${airline}${suffix}`,
      airlineIcao: airline,
      depIcao: airportIcao.toUpperCase(),
      arrIcao,
      stdUtc: utcHHMM(std),
      blockMinutes,
      sourceRef: row.icao24,
    };
  }
}
