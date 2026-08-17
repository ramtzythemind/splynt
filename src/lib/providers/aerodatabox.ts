import {
  ProviderError,
  normaliseFlightNumber,
  utcHHMM,
  type AirportHint,
  type FetchOptions,
  type FetchResult,
  type FlightProvider,
  type ProviderFlight,
} from "./types";
import { matchAircraft } from "./aircraft-match";

const HOST = "aerodatabox.p.rapidapi.com";

/**
 * Shapes we read from the FIDS response. Everything is optional because
 * AeroDataBox documents most fields as best-effort, and the payload differs
 * slightly between the `withLeg` and plain forms.
 */
interface AdbMovement {
  airport?: {
    icao?: string;
    iata?: string;
    name?: string;
    municipalityName?: string;
    countryCode?: string;
    location?: { lat?: number; lon?: number };
    timeZone?: string;
  };
  scheduledTime?: { utc?: string; local?: string };
  revisedTime?: { utc?: string; local?: string };
}

interface AdbFlight {
  number?: string;
  callSign?: string;
  status?: string;
  isCargo?: boolean;
  codeshareStatus?: string;
  aircraft?: { model?: string; reg?: string };
  airline?: { icao?: string; iata?: string; name?: string };
  departure?: AdbMovement;
  arrival?: AdbMovement;
  movement?: AdbMovement;
}

/**
 * AeroDataBox — real published departure boards.
 *
 * Free tier on RapidAPI is 600 units/month, which is why this is only ever
 * called by the import job. One airport-day costs three requests (the API caps
 * each window at 12 hours, and we ask for a little overlap).
 */
export class AeroDataBoxProvider implements FlightProvider {
  readonly id = "aerodatabox";
  readonly label = "AeroDataBox";
  readonly caveats =
    "Tabellone reale con numero volo, orari e aeromobile. Nessun dato passeggeri: viene stimato dal tipo con load factor 85%.";

  private readonly key = process.env.AERODATABOX_API_KEY;

  isConfigured() {
    return !!this.key;
  }

  async fetchDepartures(options: FetchOptions): Promise<FetchResult> {
    if (!this.key) {
      throw new ProviderError(this.id, "AERODATABOX_API_KEY non configurata");
    }

    const day = options.date.toISOString().slice(0, 10);
    // The endpoint accepts at most a 12-hour window, so a day is two calls.
    const windows: [string, string][] = [
      [`${day}T00:00`, `${day}T11:59`],
      [`${day}T12:00`, `${day}T23:59`],
    ];

    const flights: ProviderFlight[] = [];
    const airports = new Map<string, AirportHint>();
    const notes: string[] = [];

    for (const [from, to] of windows) {
      const url =
        `https://${HOST}/flights/airports/icao/${options.airportIcao}/${from}/${to}` +
        `?withLeg=true&direction=Departure&withCancelled=false` +
        `&withCodeshared=false&withCargo=false&withPrivate=false&withLocation=true`;

      const res = await fetch(url, {
        headers: {
          "x-rapidapi-key": this.key,
          "x-rapidapi-host": HOST,
        },
      });

      if (res.status === 429) {
        throw new ProviderError(this.id, "Quota RapidAPI esaurita", 429);
      }
      if (!res.ok) {
        throw new ProviderError(
          this.id,
          `HTTP ${res.status} su ${options.airportIcao}`,
          res.status,
        );
      }

      const body = (await res.json()) as { departures?: AdbFlight[] };
      const departures = body.departures ?? [];
      if (departures.length === 0) {
        notes.push(`nessuna partenza nella finestra ${from}`);
        continue;
      }

      for (const item of departures) {
        const parsed = this.parse(item, options, airports, notes);
        if (parsed) flights.push(parsed);
      }
    }

    return { flights, airports: [...airports.values()], notes };
  }

  private parse(
    item: AdbFlight,
    options: FetchOptions,
    airports: Map<string, AirportHint>,
    notes: string[],
  ): ProviderFlight | null {
    if (item.isCargo) return null;
    if (item.codeshareStatus === "IsCodeshared") return null;

    // Operating airline: prefer the explicit ICAO, fall back to the callsign prefix.
    const airlineIcao =
      item.airline?.icao?.toUpperCase() ??
      item.callSign?.trim().slice(0, 3).toUpperCase();
    if (airlineIcao !== options.airlineIcao.toUpperCase()) return null;

    const flightNumber = item.number ? normaliseFlightNumber(item.number) : null;
    if (!flightNumber) return null;

    // With `withLeg=true` the counterpart movement is the arrival; without it,
    // `movement` carries the destination instead.
    const arrival = item.arrival ?? item.movement;
    const arrIcao = arrival?.airport?.icao?.toUpperCase();
    if (!arrIcao) {
      notes.push(`${flightNumber}: destinazione mancante`);
      return null;
    }

    const stdIso =
      item.departure?.scheduledTime?.utc ?? item.movement?.scheduledTime?.utc;
    if (!stdIso) {
      notes.push(`${flightNumber}: orario di partenza mancante`);
      return null;
    }

    const std = parseAdbTime(stdIso);
    if (!std) {
      notes.push(`${flightNumber}: orario "${stdIso}" non interpretabile`);
      return null;
    }

    const staIso = arrival?.scheduledTime?.utc;
    const sta = staIso ? parseAdbTime(staIso) : null;
    let blockMinutes: number | undefined;
    if (sta) {
      let diff = Math.round((sta.getTime() - std.getTime()) / 60_000);
      if (diff < 0) diff += 1440; // crossed midnight
      if (diff > 0 && diff < 1200) blockMinutes = diff;
    }

    this.collectAirport(item.departure?.airport, airports);
    this.collectAirport(arrival?.airport, airports);

    return {
      flightNumber,
      airlineIcao: options.airlineIcao.toUpperCase(),
      depIcao: options.airportIcao.toUpperCase(),
      arrIcao,
      stdUtc: utcHHMM(std),
      blockMinutes,
      aircraftIcao: matchAircraft(item.aircraft?.model) ?? undefined,
      aircraftModel: item.aircraft?.model,
      sourceRef: `${flightNumber}@${options.airportIcao}`,
    };
  }

  private collectAirport(
    airport: AdbMovement["airport"],
    into: Map<string, AirportHint>,
  ) {
    const icao = airport?.icao?.toUpperCase();
    const lat = airport?.location?.lat;
    const lon = airport?.location?.lon;
    if (!icao || lat == null || lon == null || !airport?.timeZone) return;
    if (into.has(icao)) return;

    into.set(icao, {
      icao,
      iata: airport.iata ?? null,
      name: airport.name ?? icao,
      city: airport.municipalityName ?? airport.name ?? icao,
      country: airport.countryCode ?? "??",
      lat,
      lon,
      timezone: airport.timeZone,
    });
  }
}

/**
 * AeroDataBox returns UTC stamps as "2026-08-17 10:30Z" — a space instead of
 * the ISO "T", which `new Date()` parses inconsistently across runtimes.
 */
function parseAdbTime(value: string): Date | null {
  const iso = value.trim().replace(" ", "T").replace(/Z?$/, "Z");
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}
