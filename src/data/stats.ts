import { AIRLINES } from "./airlines";
import { AIRPORTS } from "./airports";
import { AIRCRAFT, RANKS } from "./aircraft";

/**
 * Headline figures for the marketing pages, derived from the dataset rather
 * than typed in — they drifted the moment the regional airlines were added.
 */
export const DATASET_STATS = {
  /** Outbound legs plus the return the seeder generates for each. */
  legs: AIRLINES.reduce((total, a) => total + a.routes.length, 0) * 2,
  airports: AIRPORTS.length,
  aircraftTypes: AIRCRAFT.length,
  airlines: AIRLINES.length,
  ranks: RANKS.length,
  /** Airlines a brand new pilot (rank 1, turboprop only) can fly for. */
  entryAirlines: AIRLINES.filter((a) =>
    a.fleet.some(([icao]) => {
      const type = AIRCRAFT.find((t) => t.icao === icao);
      return type?.klass === "turboprop";
    }),
  ).length,
} as const;
