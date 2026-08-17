/**
 * Proves the career is actually enterable.
 *   npm run career:check
 *
 * A brand new pilot holds rank 1 (Cadet), which clears only the turboprop
 * class. If no airline in the network operates a turboprop, the departure
 * board is entirely locked and there is no way to earn the XP needed to
 * unlock anything — a hard deadlock. This asserts that never happens, and
 * reports how long the climb out of each entry-level airline takes.
 */
import { AIRLINES } from "../src/data/airlines";
import { AIRPORTS } from "../src/data/airports";
import { AIRCRAFT, RANKS } from "../src/data/aircraft";
import { canFly, scoreFlight } from "../src/lib/career";
import { distanceNm } from "../src/lib/utils";
import type { AircraftClass } from "../src/lib/supabase/types";

const airportByIcao = new Map(AIRPORTS.map((a) => [a[0], a]));
const aircraftByIcao = new Map(AIRCRAFT.map((a) => [a.icao, a]));

function blockMinutes(distance: number, cruiseKt: number): number {
  const factor = distance > 1500 ? 1.08 : 1.05;
  return Math.max(35, Math.round((30 + (distance / cruiseKt) * 60 * factor) / 5) * 5);
}

let failures = 0;

// ---------------------------------------------------------------------------
// 1. Which airlines can a rank-1 Cadet fly for at all?
// ---------------------------------------------------------------------------
console.log("\n  Accesso al grado 1 (Cadet)\n  ──────────────────────────");

const entryAirlines: typeof AIRLINES = [];

for (const airline of AIRLINES) {
  const flyable = airline.routes.filter(([, dep, , , ac]) => {
    const type = aircraftByIcao.get(ac);
    return !!type && canFly(1, type.klass) && dep === airline.hub;
  });

  if (flyable.length > 0) entryAirlines.push(airline);

  const label = `${airline.iata} ${airline.name}`.padEnd(30);
  console.log(
    `  ${flyable.length > 0 ? "✓" : "·"} ${label} ${String(flyable.length).padStart(3)} voli dall'hub`,
  );
}

if (entryAirlines.length === 0) {
  console.log(
    "\n  ✗ DEADLOCK: nessuna compagnia ha voli volabili al grado 1.\n" +
      "    Un pilota nuovo non può volare, quindi non può guadagnare XP,\n" +
      "    quindi non può salire di grado. La carriera è inaccessibile.\n",
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 2. How fast does a Cadet actually climb?
// ---------------------------------------------------------------------------
console.log("\n  Progressione dalle compagnie di ingresso\n  ───────────────────────────────────────");

const secondOfficer = RANKS.find((r) => r.level === 2)!;
const firstOfficer = RANKS.find((r) => r.level === 3)!;

for (const airline of entryAirlines) {
  const legs = airline.routes
    .filter(([, dep, , , ac]) => {
      const type = aircraftByIcao.get(ac);
      return !!type && canFly(1, type.klass) && dep === airline.hub;
    })
    .map(([fn, dep, arr, , ac, pax]) => {
      const d = airportByIcao.get(dep)!;
      const a = airportByIcao.get(arr)!;
      const type = aircraftByIcao.get(ac)!;
      const distance = distanceNm(d[5], d[6], a[5], a[6]);
      const block = blockMinutes(distance, type.cruiseKt);

      // A competent but unremarkable flight: on time, −180 fpm, no violations.
      const scored = scoreFlight({
        distanceNm: distance,
        pax,
        blockMinutes: block,
        aircraftClass: type.klass as AircraftClass,
        airlineDifficulty: airline.difficulty,
        landingRateFpm: -180,
        departureDelayMin: 4,
        overspeedEvents: 0,
        stallEvents: 0,
        pauseEvents: 0,
        landedOffTarget: false,
      });

      return { fn, distance, block, xp: scored.total, score: scored.score };
    });

  const avgXp = Math.round(legs.reduce((s, l) => s + l.xp, 0) / legs.length);
  const avgBlock = Math.round(legs.reduce((s, l) => s + l.block, 0) / legs.length);
  const toRank2 = Math.ceil(secondOfficer.minXp / avgXp);
  const toRank3 = Math.ceil(firstOfficer.minXp / avgXp);

  console.log(
    `\n  ${airline.iata} ${airline.name} ${`(difficoltà ${airline.difficulty})`.padStart(16)}`,
  );
  console.log(
    `     volo medio  ${String(avgXp).padStart(5)} XP · ${String(avgBlock).padStart(3)}' di blocchi`,
  );
  console.log(
    `     grado 2     ${String(toRank2).padStart(5)} voli (~${Math.round((toRank2 * avgBlock) / 60)} h)`,
  );
  console.log(
    `     grado 3     ${String(toRank3).padStart(5)} voli (~${Math.round((toRank3 * avgBlock) / 60)} h)`,
  );

  // A first rank should take a handful of flights, not an evening and not a month.
  if (toRank2 > 12) {
    failures++;
    console.log(`     ✗ troppo lento: ${toRank2} voli per il primo avanzamento`);
  }
  if (toRank2 < 2) {
    failures++;
    console.log(`     ✗ troppo rapido: il grado 2 arriva in ${toRank2} volo/i`);
  }
}

// ---------------------------------------------------------------------------
// 3. Every rank must have something to fly.
// ---------------------------------------------------------------------------
console.log("\n  Copertura per grado\n  ───────────────────");

for (const rank of RANKS) {
  const count = AIRLINES.reduce((total, airline) => {
    return (
      total +
      airline.routes.filter(([, , , , ac]) => {
        const type = aircraftByIcao.get(ac);
        return !!type && canFly(rank.level, type.klass);
      }).length
    );
  }, 0);

  const ok = count > 0;
  if (!ok) failures++;
  console.log(
    `  ${ok ? "✓" : "✗"} ${String(rank.level)} ${rank.name.padEnd(22)} ${String(count).padStart(4)} tratte accessibili`,
  );
}

if (failures > 0) {
  console.log(`\n  ✗ ${failures} problemi di progressione\n`);
  process.exit(1);
}
console.log("\n  ✓ La carriera è accessibile dal grado 1.\n");
