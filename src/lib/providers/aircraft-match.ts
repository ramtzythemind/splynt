import { AIRCRAFT } from "@/data/aircraft";

/**
 * Providers report aircraft as free text ("Airbus A330-900neo", "Boeing 737 MAX 8")
 * rather than ICAO type codes. These rules map that text onto the types Splynt
 * knows about, most specific first — "737 MAX 9" must win over "737".
 */
const RULES: [pattern: RegExp, icao: string][] = [
  // Airbus widebody / heavy
  [/a\W?380/i, "A388"],
  [/a\W?350\W*10/i, "A359"], // -1000 folded onto the -900 we model
  [/a\W?350/i, "A359"],
  [/a\W?330\W*(900|neo)/i, "A339"],
  [/a\W?330\W*300/i, "A333"],
  [/a\W?330\W*200/i, "A332"],
  [/a\W?330/i, "A333"],

  // Airbus narrowbody — neo variants before the ceo they are named after
  [/a\W?321\W*neo/i, "A21N"],
  [/a\W?321/i, "A321"],
  [/a\W?320\W*neo/i, "A20N"],
  [/a\W?320/i, "A320"],
  [/a\W?319/i, "A319"],
  [/a\W?318/i, "A319"],

  // Boeing
  [/7\W?7\W?7\W*300/i, "B77W"],
  [/7\W?7\W?7\W*200/i, "B772"],
  [/7\W?7\W?7/i, "B77W"],
  [/7\W?8\W?7\W*10/i, "B789"], // -10 folded onto the -9
  [/7\W?8\W?7\W*9/i, "B789"],
  [/7\W?8\W?7\W*8/i, "B788"],
  [/7\W?8\W?7/i, "B789"],
  [/7\W?6\W?7/i, "B763"],
  [/7\W?5\W?7/i, "B752"],
  // MAX variants before the NG ones — "737 MAX 9" must not fall through to
  // the -900, which is a different airframe entirely.
  [/737\W*max\W*(9|10)/i, "B39M"],
  [/737\W*max/i, "B38M"],
  [/737\W*[89]00/i, "B738"], // -800 and -900 NG both modelled as the -800
  [/737/i, "B738"],

  // Regional
  [/e\W?195/i, "E195"],
  [/e\W?190/i, "E190"],
  [/e\W?175/i, "E190"],
  [/embraer\W*19/i, "E190"],
  [/crj\W*(900|1000)/i, "CRJ9"],
  [/crj/i, "CRJ9"],

  // Turboprop
  [/atr\W*(72|42)/i, "AT76"],
  [/dash\W*8|q400|dhc\W*8/i, "DH8D"],
];

const KNOWN = new Set(AIRCRAFT.map((a) => a.icao));

/**
 * Resolves provider text to an ICAO type Splynt models.
 * Returns null when nothing matches — the importer then skips the flight
 * rather than inventing an aircraft.
 */
export function matchAircraft(text: string | null | undefined): string | null {
  if (!text) return null;

  // An exact ICAO code is the happy path.
  const upper = text.trim().toUpperCase();
  if (KNOWN.has(upper)) return upper;

  for (const [pattern, icao] of RULES) {
    if (pattern.test(text)) return icao;
  }
  return null;
}

/**
 * The distance bands airlines actually roster to. Range alone is a bad guide:
 * an A319 can legally reach 3000 NM, but nobody schedules one that far.
 */
function preferredClasses(distanceNm: number): string[] {
  if (distanceNm < 1200) return ["turboprop", "regional", "narrowbody"];
  if (distanceNm < 2800) return ["regional", "narrowbody"];
  return ["widebody", "heavy"];
}

/**
 * When a provider gives no aircraft at all (OpenSky reports callsigns, not
 * types), pick the most plausible type from the airline's fleet: one that can
 * reach with a 10% margin, in the class band typical for the distance, and the
 * smallest of those — airlines fly the smallest aircraft that does the job.
 */
export function inferAircraftForLeg(
  fleetIcaos: string[],
  distanceNm: number,
): string | null {
  const inRange = AIRCRAFT.filter(
    (a) => fleetIcaos.includes(a.icao) && a.rangeNm >= distanceNm * 1.1,
  );
  if (inRange.length === 0) return null;

  const bands = preferredClasses(distanceNm);
  const banded = inRange.filter((a) => bands.includes(a.klass));

  // Fall back to anything in range if the airline has nothing in the band —
  // Emirates, for instance, operates no narrowbody at all.
  const pool = banded.length > 0 ? banded : inRange;

  return pool.sort((a, b) => a.pax - b.pax || a.rangeNm - b.rangeNm)[0]?.icao ?? null;
}

/** Typical load factor — providers publish seats, not bums on seats. */
export const LOAD_FACTOR = 0.85;

export function estimatePax(aircraftIcao: string): number {
  const type = AIRCRAFT.find((a) => a.icao === aircraftIcao);
  return type ? Math.round(type.pax * LOAD_FACTOR) : 150;
}
