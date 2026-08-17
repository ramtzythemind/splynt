import Link from "next/link";
import { Building2, Terminal } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getPilotContext } from "@/lib/pilot";
import { RANKS, canFly, nextRank, rankForXp, rankProgress } from "@/lib/career";
import { Badge, Button, Card, Meter, Stat } from "@/components/ui";
import { TokenManager, type TokenRow } from "@/components/TokenManager";
import { CallsignForm } from "@/components/CallsignForm";
import { durationLabel, formatNumber } from "@/lib/utils";
import type { AircraftClass } from "@/lib/supabase/types";

export const metadata = { title: "Pilota" };

export default async function PilotPage() {
  const { pilot, airline, position } = await getPilotContext();
  const supabase = await createClient();

  const [{ data: tokens }, { data: fleet }, { data: xpEvents }] = await Promise.all([
    supabase
      .from("acars_tokens")
      .select("id, label, prefix, created_at, last_used_at")
      .eq("pilot_id", pilot.id)
      .is("revoked_at", null)
      .order("created_at", { ascending: false }),
    pilot.airline_id
      ? supabase
          .from("airline_fleet")
          .select("aircraft_icao, tail_count, aircraft_types ( name, class, min_rank_level )")
          .eq("airline_id", pilot.airline_id)
      : Promise.resolve({ data: [] }),
    supabase
      .from("xp_events")
      .select("id, amount, reason, created_at")
      .eq("pilot_id", pilot.id)
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  const rank = rankForXp(pilot.xp);
  const next = nextRank(pilot.xp);

  const fleetRows = (fleet ?? [])
    .map((f) => {
      const t = f.aircraft_types as unknown as {
        name: string;
        class: AircraftClass;
        min_rank_level: number;
      } | null;
      return {
        icao: f.aircraft_icao,
        tails: f.tail_count,
        name: t?.name ?? f.aircraft_icao,
        klass: t?.class ?? ("narrowbody" as AircraftClass),
        minRank: t?.min_rank_level ?? 1,
      };
    })
    .sort((a, b) => a.minRank - b.minRank || a.icao.localeCompare(b.icao));

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Scheda pilota
        </h1>
        <p className="mt-2 text-sm text-slate-muted">
          Identità, progressione e collegamento con il simulatore.
        </p>
      </div>

      {/* Identity */}
      <Card className="overflow-hidden">
        <div className="h-1" style={{ background: airline?.accent ?? "#3ea6ff" }} />
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_auto]">
          <div>
            <div className="flap text-2xl font-semibold">{pilot.callsign}</div>
            <div className="mt-1 text-sm text-white">{pilot.display_name}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone="amber">{rank.name}</Badge>
              {airline && (
                <Badge tone="neutral">
                  <Building2 className="h-3 w-3" />
                  {airline.name}
                </Badge>
              )}
              {position && (
                <Badge tone="neutral">
                  {position.icao} · {position.city}
                </Badge>
              )}
            </div>

            <div className="mt-6 max-w-sm">
              <div className="mb-1.5 flex items-baseline justify-between text-xs">
                <span className="font-mono tabular-nums text-white">
                  {formatNumber(pilot.xp)} XP
                </span>
                {next && (
                  <span className="text-slate-muted">
                    prossimo: {next.name} a {formatNumber(next.minXp)}
                  </span>
                )}
              </div>
              <Meter
                value={rankProgress(pilot.xp)}
                accent={airline?.accent ?? "var(--color-amber-board)"}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:w-56">
            <CallsignForm current={pilot.callsign} />
            <Link href="/onboarding">
              <Button variant="outline" size="sm" className="w-full">
                Cambia compagnia
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Voli" value={formatNumber(pilot.total_flights)} />
        <Stat label="Ore di volo" value={durationLabel(pilot.total_minutes)} />
        <Stat label="Passeggeri trasportati" value={formatNumber(pilot.total_pax)} />
      </div>

      <TokenManager tokens={(tokens ?? []) as TokenRow[]} />

      {/* Client setup */}
      <Card className="p-6">
        <div className="flex items-start gap-3">
          <Terminal className="mt-0.5 h-4 w-4 shrink-0 text-sky-signal" strokeWidth={1.8} />
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-white">Client ACARS</h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-muted">
              Il client gira sul PC che ospita MSFS, si collega via SimConnect e
              invia la telemetria al server. Avvialo prima di mettersi ai
              comandi, seleziona il volo prenotato e vola.
            </p>
            <pre className="mt-4 overflow-x-auto rounded-lg border border-ink-700 bg-ink-950 px-4 py-3 font-mono text-[11px] leading-relaxed text-slate-soft">
{`cd acars
npm install
copy .env.example .env      # incolla il token qui
npm start`}
            </pre>
          </div>
        </div>
      </Card>

      {/* Fleet access */}
      {fleetRows.length > 0 && (
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-white">
            Flotta {airline?.name}
          </h2>
          <p className="mt-1 text-xs text-slate-muted">
            Ogni categoria si sblocca con il grado. Sei {rank.name} (livello{" "}
            {rank.level}).
          </p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {fleetRows.map((f) => {
              const unlocked = canFly(pilot.rank_level, f.klass);
              const needed = RANKS.find((r) => r.level === f.minRank);
              return (
                <div
                  key={f.icao}
                  className={`rounded-lg border px-4 py-3 ${
                    unlocked
                      ? "border-ink-700 bg-ink-900/60"
                      : "border-ink-800 bg-ink-900/30 opacity-55"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm text-white">{f.icao}</span>
                    <span className="font-mono text-[10px] text-slate-muted">
                      {f.tails} esemplari
                    </span>
                  </div>
                  <div className="mt-0.5 truncate text-xs text-slate-muted">
                    {f.name}
                  </div>
                  {!unlocked && needed && (
                    <div className="mt-2 text-[10px] uppercase tracking-wider text-amber-board">
                      richiede {needed.name}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* XP ledger */}
      {xpEvents && xpEvents.length > 0 && (
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-white">Movimenti esperienza</h2>
          <ul className="mt-4 divide-y divide-ink-800">
            {xpEvents.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-4 py-2.5">
                <div className="min-w-0">
                  <div className="truncate text-sm text-slate-soft">{e.reason}</div>
                  <div className="font-mono text-[10px] text-slate-muted">
                    {new Intl.DateTimeFormat("it-IT", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(e.created_at))}
                  </div>
                </div>
                <span
                  className={`shrink-0 font-mono text-sm tabular-nums ${
                    e.amount >= 0 ? "text-jade" : "text-coral"
                  }`}
                >
                  {e.amount > 0 ? "+" : ""}
                  {formatNumber(e.amount)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
