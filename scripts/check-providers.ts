/**
 * Offline checks for the provider layer — no credentials, no network.
 *   npm run providers:check
 *
 * Covers the two pieces that fail silently in production if they are wrong:
 * the aircraft-model matcher, and the dataset provider's own output.
 */
import { AIRLINES } from "../src/data/airlines";
import {
  matchAircraft,
  inferAircraftForLeg,
  estimatePax,
} from "../src/lib/providers/aircraft-match";
import { DatasetProvider } from "../src/lib/providers/dataset";
import { configuredProviders, getProvider, providerNames } from "../src/lib/providers";

/** Model strings as real providers actually write them. */
const MATCHER_CASES: [input: string, expected: string | null][] = [
  ["Airbus A320", "A320"],
  ["Airbus A320neo", "A20N"],
  ["Airbus A321", "A321"],
  ["Airbus A321neo", "A21N"],
  ["Airbus A319", "A319"],
  ["Airbus A330-200", "A332"],
  ["Airbus A330-300", "A333"],
  ["Airbus A330-900neo", "A339"],
  ["Airbus A350-900", "A359"],
  ["Airbus A350-1000", "A359"],
  ["Airbus A380-800", "A388"],
  ["Boeing 737-800", "B738"],
  ["Boeing 737-900", "B738"],
  ["Boeing 737 MAX 8", "B38M"],
  ["Boeing 737 MAX 9", "B39M"],
  ["Boeing 757-200", "B752"],
  ["Boeing 767-300ER", "B763"],
  ["Boeing 777-200LR", "B772"],
  ["Boeing 777-300ER", "B77W"],
  ["Boeing 787-8 Dreamliner", "B788"],
  ["Boeing 787-9 Dreamliner", "B789"],
  ["Boeing 787-10 Dreamliner", "B789"],
  ["Embraer 190", "E190"],
  ["Embraer E195-E2", "E195"],
  ["Bombardier CRJ-900", "CRJ9"],
  ["ATR 72-600", "AT76"],
  ["De Havilland Dash 8-400", "DH8D"],
  ["A320", "A320"], // already an ICAO code
  ["B77W", "B77W"],
  ["Cessna 172", null], // not modelled — must be skipped, not guessed
  ["Airbus A220-300", null],
  ["", null],
];

let failures = 0;

console.log("\n  Matcher aeromobili\n  ──────────────────");
for (const [input, expected] of MATCHER_CASES) {
  const actual = matchAircraft(input);
  const ok = actual === expected;
  if (!ok) failures++;
  console.log(
    `  ${ok ? "✓" : "✗"} ${(input || "(vuoto)").padEnd(28)} → ${String(actual).padEnd(6)}${ok ? "" : `  atteso ${expected}`}`,
  );
}

console.log("\n  Inferenza da flotta\n  ───────────────────");
const ryanairFleet = ["B738", "B38M"];
const baFleet = ["A319", "A320", "A321", "B788", "B789", "B77W", "B772", "A388"];
const emiratesFleet = ["B77W", "A388"];
const inferenceCases: [string[], number, string | null][] = [
  [ryanairFleet, 400, "B738"], // il più piccolo della flotta
  [ryanairFleet, 1200, "B738"],
  [ryanairFleet, 5000, null], // fuori raggio per tutta la flotta
  [baFleet, 300, "A319"], // corto raggio → narrowbody più piccolo
  [baFleet, 2000, "A319"],
  [baFleet, 3000, "B788"], // oltre 2800 NM → widebody, non un A319 al limite
  [baFleet, 6500, "B788"],
  [emiratesFleet, 400, "B77W"], // nessun narrowbody in flotta: ripiego sul raggio
];
for (const [fleet, nm, expected] of inferenceCases) {
  const actual = inferAircraftForLeg(fleet, nm);
  const ok = actual === expected;
  if (!ok) failures++;
  console.log(
    `  ${ok ? "✓" : "✗"} ${String(nm).padStart(5)} NM su ${fleet.length} tipi → ${String(actual).padEnd(6)}${ok ? "" : `  atteso ${expected}`}`,
  );
}

console.log("\n  Stima passeggeri\n  ────────────────");
for (const icao of ["DH8D", "A320", "B77W", "A388"]) {
  console.log(`  · ${icao.padEnd(6)} ${String(estimatePax(icao)).padStart(4)} pax (load factor 85%)`);
}

console.log("\n  Provider registrati\n  ───────────────────");
for (const name of providerNames()) {
  const p = getProvider(name);
  console.log(
    `  ${p.isConfigured() ? "✓" : "·"} ${p.id.padEnd(13)} ${p.isConfigured() ? "configurato" : "credenziali assenti"}`,
  );
}
const ready = configuredProviders().map((p) => p.id);
console.log(`\n  Utilizzabili ora: ${ready.join(", ")}`);

console.log("\n  Dataset provider\n  ────────────────");
const dataset = new DatasetProvider();
const date = new Date();

async function checkDataset() {
  for (const airline of AIRLINES) {
    const result = await dataset.fetchDepartures({
      airportIcao: airline.hub,
      airlineIcao: airline.icao,
      date,
    });

    const bad = result.flights.filter(
      (f) =>
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(f.stdUtc) ||
        !f.blockMinutes ||
        f.blockMinutes < 30 ||
        !f.aircraftIcao ||
        f.depIcao !== airline.hub,
    );
    if (bad.length) {
      failures += bad.length;
      console.log(`  ✗ ${airline.icao}: ${bad.length} voli malformati`);
      for (const f of bad.slice(0, 3)) console.log(`      ${JSON.stringify(f)}`);
    } else {
      console.log(
        `  ✓ ${airline.icao.padEnd(4)} ${String(result.flights.length).padStart(3)} partenze da ${airline.hub} · ${result.airports.length} aeroporti`,
      );
    }
  }
}

checkDataset().then(() => {
  if (failures > 0) {
    console.log(`\n  ✗ ${failures} controlli falliti\n`);
    process.exit(1);
  }
  console.log("\n  ✓ Livello provider coerente.\n");
});
