/**
 * Offline validation of the timetable dataset — no database required.
 *   npm run db:check
 *
 * Catches unknown airports/aircraft, out-of-range legs, flight-number
 * collisions and aircraft the hub airline could not actually crew.
 */
import { AIRPORTS } from "../src/data/airports";
import { AIRCRAFT } from "../src/data/aircraft";
import { AIRLINES } from "../src/data/airlines";
import { distanceNm } from "../src/lib/utils";

const airports = new Map(AIRPORTS.map((a) => [a[0], a]));
const aircraft = new Map(AIRCRAFT.map((a) => [a.icao, a]));

const errors: string[] = [];
const warnings: string[] = [];

// Duplicate airport codes
const icaoSeen = new Set<string>();
for (const a of AIRPORTS) {
  if (icaoSeen.has(a[0])) errors.push(`Aeroporto duplicato: ${a[0]}`);
  icaoSeen.add(a[0]);
  if (Math.abs(a[5]) > 90 || Math.abs(a[6]) > 180) {
    errors.push(`${a[0]}: coordinate fuori range (${a[5]}, ${a[6]})`);
  }
}

let legCount = 0;
let longest = { route: "", nm: 0 };

for (const al of AIRLINES) {
  if (!airports.has(al.hub)) errors.push(`${al.iata}: hub sconosciuto ${al.hub}`);

  const fleet = new Set(al.fleet.map(([icao]) => icao));
  for (const icao of fleet) {
    if (!aircraft.has(icao)) errors.push(`${al.iata}: flotta con tipo ignoto ${icao}`);
  }

  const numbers = new Map<string, string>();

  for (const [fn, dep, arr, std, ac, pax] of al.routes) {
    const d = airports.get(dep);
    const a = airports.get(arr);
    const t = aircraft.get(ac);

    if (!d) { errors.push(`${fn}: partenza ignota ${dep}`); continue; }
    if (!a) { errors.push(`${fn}: arrivo ignoto ${arr}`); continue; }
    if (!t) { errors.push(`${fn}: aeromobile ignoto ${ac}`); continue; }
    if (!fleet.has(ac)) errors.push(`${fn}: ${ac} non è nella flotta ${al.iata}`);
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(std)) errors.push(`${fn}: orario non valido "${std}"`);
    if (pax > t.pax) {
      errors.push(`${fn}: ${pax} pax su ${ac} (max ${t.pax})`);
    }

    const nm = distanceNm(d[5], d[6], a[5], a[6]);
    if (nm > t.rangeNm) {
      errors.push(`${fn}: ${dep}-${arr} = ${nm} NM > raggio ${ac} (${t.rangeNm} NM)`);
    } else if (nm > t.rangeNm * 0.95) {
      warnings.push(`${fn}: ${dep}-${arr} al ${Math.round((nm / t.rangeNm) * 100)}% del raggio ${ac}`);
    }
    if (nm < 80) warnings.push(`${fn}: tratta molto corta (${nm} NM)`);
    if (nm > longest.nm) longest = { route: `${al.iata} ${fn} ${dep}-${arr} (${ac})`, nm };

    const key = `${fn}|${dep}`;
    if (numbers.has(key)) errors.push(`${al.iata}: numero volo duplicato ${fn} da ${dep}`);
    numbers.set(key, arr);

    legCount += 2; // outbound + generated return
  }
}

// Reachability: every destination should have some way back.
const served = new Set<string>();
for (const al of AIRLINES) {
  for (const [, dep, arr] of al.routes) {
    served.add(dep);
    served.add(arr);
  }
}
const unused = [...airports.keys()].filter((i) => !served.has(i));

console.log(`Aeroporti:   ${AIRPORTS.length} (${unused.length} non serviti)`);
console.log(`Aeromobili:  ${AIRCRAFT.length}`);
console.log(`Compagnie:   ${AIRLINES.length}`);
console.log(`Tratte:      ${legCount} (andata + ritorno generato)`);
console.log(`Più lunga:   ${longest.route} — ${longest.nm} NM`);

if (unused.length) console.log(`\nNon serviti: ${unused.join(", ")}`);
if (warnings.length) {
  console.log(`\n⚠ ${warnings.length} avvisi:`);
  warnings.forEach((w) => console.log(`  ${w}`));
}
if (errors.length) {
  console.log(`\n✗ ${errors.length} errori:`);
  errors.forEach((e) => console.log(`  ${e}`));
  process.exit(1);
}
console.log("\n✓ Dataset valido.");
