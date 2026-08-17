/**
 * Imports real departure boards into `schedules`.
 *
 *   npm run flights:import -- --provider aerodatabox --airline ITY
 *   npm run flights:import -- --provider opensky --airline RYR --airport EIDW --date 2026-08-18
 *   npm run flights:import -- --all --dry-run
 *
 * Flags:
 *   --provider <id>   dataset | aerodatabox | opensky   (default: $FLIGHT_PROVIDER)
 *   --airline <ICAO>  compagnia da importare
 *   --airport <ICAO>  scalo di partenza (default: hub della compagnia)
 *   --date <YYYY-MM-DD>
 *   --all             tutte le compagnie presenti a database, dal loro hub
 *   --dry-run         analizza e riporta senza scrivere
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { getProvider, providerNames } from "../src/lib/providers";
import { importDepartures, type ImportReport } from "../src/lib/import-flights";

try {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (m?.[1] && !process.env[m[1]]) {
      process.env[m[1]] = (m[2] ?? "").replace(/^["']|["']$/g, "");
    }
  }
} catch {
  // no .env.local — rely on the ambient environment
}

function flag(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}
const has = (name: string) => process.argv.includes(`--${name}`);

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      "✗ Servono NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY in .env.local",
    );
    process.exit(1);
  }

  const db = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const provider = getProvider(flag("provider"));
  if (!provider.isConfigured()) {
    console.error(
      `✗ Provider "${provider.id}" non configurato — mancano le credenziali.\n` +
        `  Provider disponibili: ${providerNames().join(", ")}`,
    );
    process.exit(1);
  }

  const dryRun = has("dry-run");
  const dateArg = flag("date");
  const date = dateArg ? new Date(`${dateArg}T00:00:00Z`) : new Date();
  if (Number.isNaN(date.getTime())) {
    console.error(`✗ Data "${dateArg}" non valida (usa YYYY-MM-DD)`);
    process.exit(1);
  }

  console.log(`\n  Provider: ${provider.label}`);
  console.log(`  ${provider.caveats}`);
  console.log(`  Data:     ${date.toISOString().slice(0, 10)}`);
  if (dryRun) console.log("  Modalità: DRY RUN — nessuna scrittura\n");
  else console.log("");

  let targets: { icao: string; airport?: string }[];

  if (has("all")) {
    const { data, error } = await db.from("airlines").select("icao, hub_icao");
    if (error) throw error;
    targets = (data ?? []).map((a) => ({ icao: a.icao, airport: a.hub_icao }));
  } else {
    const airline = flag("airline");
    if (!airline) {
      console.error("✗ Specifica --airline <ICAO> oppure --all");
      process.exit(1);
    }
    targets = [{ icao: airline, airport: flag("airport") }];
  }

  const reports: ImportReport[] = [];

  for (const target of targets) {
    try {
      const report = await importDepartures(db, provider, {
        airlineIcao: target.icao,
        airportIcao: target.airport,
        date,
        dryRun,
      });
      reports.push(report);
      print(report);
    } catch (err) {
      console.log(
        `  ${target.icao.padEnd(5)} ✗ ${(err as Error).message}`,
      );
    }
  }

  const found = reports.reduce((s, r) => s + r.found, 0);
  const saved = reports.reduce((s, r) => s + r.saved, 0);
  const skipped = reports.reduce((s, r) => s + r.skipped.length, 0);

  console.log(
    `\n  ${dryRun ? "Analizzati" : "Importati"}: ${saved || found} voli · ${skipped} scartati · ${reports.reduce((s, r) => s + r.airportsAdded, 0)} aeroporti aggiunti\n`,
  );
}

function print(r: ImportReport) {
  console.log(
    `  ${r.airlineIcao.padEnd(5)} ${r.airportIcao}  ${String(r.found).padStart(4)} trovati  ${String(r.saved).padStart(4)} salvati  ${String(r.skipped.length).padStart(3)} scartati`,
  );

  // Group skip reasons so a systematic problem is obvious at a glance.
  if (r.skipped.length) {
    const byReason = new Map<string, number>();
    for (const s of r.skipped) {
      const key = s.reason.replace(/"[^"]*"/g, '"…"').replace(/\b[A-Z]{4}\b/g, "····");
      byReason.set(key, (byReason.get(key) ?? 0) + 1);
    }
    for (const [reason, count] of [...byReason].sort((a, b) => b[1] - a[1])) {
      console.log(`          ${String(count).padStart(3)}× ${reason}`);
    }
  }
  for (const note of r.notes.slice(0, 3)) {
    console.log(`          · ${note}`);
  }
}

main().catch((err) => {
  console.error(`\n✗ Import fallito: ${err.message ?? err}\n`);
  process.exit(1);
});
