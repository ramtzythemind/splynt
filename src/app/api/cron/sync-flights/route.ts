import { createServiceClient } from "@/lib/supabase/server";
import { getProvider } from "@/lib/providers";
import { importDepartures, type ImportReport } from "@/lib/import-flights";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Nightly refresh of the timetable from the configured provider.
 *
 * Wire it up in vercel.ts:
 *   crons: [{ path: "/api/cron/sync-flights", schedule: "0 3 * * *" }]
 *
 * Vercel signs cron invocations with CRON_SECRET; the same header lets you
 * trigger it manually while testing.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return Response.json({ error: "Non autorizzato" }, { status: 401 });
    }
  }

  const url = new URL(request.url);
  const providerName = url.searchParams.get("provider") ?? undefined;
  const only = url.searchParams.get("airline")?.toUpperCase();

  let provider;
  try {
    provider = getProvider(providerName);
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 400 });
  }

  if (!provider.isConfigured()) {
    return Response.json(
      { error: `Provider "${provider.id}" non configurato` },
      { status: 503 },
    );
  }

  const db = createServiceClient();
  const { data: airlines, error } = await db
    .from("airlines")
    .select("icao, hub_icao");

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const targets = (airlines ?? []).filter((a) => !only || a.icao === only);
  const reports: ImportReport[] = [];
  const failures: { airline: string; error: string }[] = [];

  // Sequential on purpose: free tiers rate-limit hard, and a burst of parallel
  // requests is the fastest way to get a 429 for the rest of the month.
  for (const airline of targets) {
    try {
      reports.push(
        await importDepartures(db, provider, {
          airlineIcao: airline.icao,
          airportIcao: airline.hub_icao,
        }),
      );
    } catch (err) {
      failures.push({ airline: airline.icao, error: (err as Error).message });
    }
  }

  return Response.json({
    provider: provider.id,
    airlines: targets.length,
    found: reports.reduce((s, r) => s + r.found, 0),
    saved: reports.reduce((s, r) => s + r.saved, 0),
    skipped: reports.reduce((s, r) => s + r.skipped.length, 0),
    airportsAdded: reports.reduce((s, r) => s + r.airportsAdded, 0),
    failures,
    reports,
  });
}
