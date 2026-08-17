import { AIRLINES } from "@/data/airlines";
import { AIRPORTS } from "@/data/airports";
import { AIRCRAFT } from "@/data/aircraft";
import { distanceNm } from "@/lib/utils";
import type {
  AirportHint,
  FetchOptions,
  FetchResult,
  FlightProvider,
  ProviderFlight,
} from "./types";

const aircraftByIcao = new Map(AIRCRAFT.map((a) => [a.icao, a]));
const airportByIcao = new Map(AIRPORTS.map((a) => [a[0], a]));

/**
 * The bundled timetable, exposed through the same interface as the live
 * providers. This is the default: it needs no credentials, has no quota, and
 * gives the importer something to fall back on when a provider is unavailable.
 */
export class DatasetProvider implements FlightProvider {
  readonly id = "dataset";
  readonly label = "Dataset Splynt";
  readonly caveats =
    "Orari pubblicati curati a mano, completi di aeromobile e passeggeri. Non si aggiorna da solo.";

  isConfigured() {
    return true;
  }

  async fetchDepartures(options: FetchOptions): Promise<FetchResult> {
    const airline = AIRLINES.find(
      (a) => a.icao.toUpperCase() === options.airlineIcao.toUpperCase(),
    );
    if (!airline) {
      return { flights: [], airports: [], notes: ["compagnia non nel dataset"] };
    }

    const origin = options.airportIcao.toUpperCase();
    const flights: ProviderFlight[] = [];
    const airports = new Map<string, AirportHint>();

    for (const [fn, dep, arr, std, ac, pax] of airline.routes) {
      if (dep !== origin) continue;

      const d = airportByIcao.get(dep);
      const a = airportByIcao.get(arr);
      const type = aircraftByIcao.get(ac);
      if (!d || !a || !type) continue;

      const nm = distanceNm(d[5], d[6], a[5], a[6]);
      const factor = nm > 1500 ? 1.08 : 1.05;
      const blockMinutes = Math.max(
        35,
        Math.round((30 + (nm / type.cruiseKt) * 60 * factor) / 5) * 5,
      );

      for (const ap of [d, a]) {
        if (!airports.has(ap[0])) {
          airports.set(ap[0], {
            icao: ap[0],
            iata: ap[1],
            name: ap[2],
            city: ap[3],
            country: ap[4],
            lat: ap[5],
            lon: ap[6],
            elevationFt: ap[7],
            timezone: ap[8],
          });
        }
      }

      flights.push({
        flightNumber: fn,
        airlineIcao: airline.icao,
        depIcao: dep,
        arrIcao: arr,
        stdUtc: std,
        blockMinutes,
        aircraftIcao: ac,
        pax,
        sourceRef: `dataset:${fn}`,
      });
    }

    return { flights, airports: [...airports.values()], notes: [] };
  }
}
