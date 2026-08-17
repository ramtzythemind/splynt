import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getPilotContext } from "@/lib/pilot";
import { gradeFor } from "@/lib/career";
import { Badge, Card, Stat } from "@/components/ui";
import { durationLabel, formatNumber, hhmm } from "@/lib/utils";
import type { XpBreakdown } from "@/lib/supabase/types";

export const metadata = { title: "PIREP" };

export default async function PirepPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { pilot } = await getPilotContext();
  const supabase = await createClient();

  const { data: pirep } = await supabase
    .from("pireps")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!pirep) notFound();

  const [{ data: airports }, { data: aircraft }, { data: track }] = await Promise.all([
    supabase
      .from("airports")
      .select("icao, city, name, timezone")
      .in("icao", [pirep.dep_icao, pirep.arr_icao]),
    supabase
      .from("aircraft_types")
      .select("icao, name, manufacturer")
      .eq("icao", pirep.aircraft_icao)
      .maybeSingle(),
    pirep.pilot_id === pilot.id
      ? supabase
          .from("telemetry")
          .select("lat, lon, altitude_ft")
          .eq("pirep_id", id)
          .order("ts")
      : Promise.resolve({ data: null }),
  ]);

  const dep = airports?.find((a) => a.icao === pirep.dep_icao);
  const arr = airports?.find((a) => a.icao === pirep.arr_icao);
  const breakdown = pirep.breakdown as XpBreakdown | null;
  const grade = gradeFor(pirep.score ?? 0);

  return (
    <div className="space-y-7">
      <Link
        href="/logbook"
        className="inline-flex items-center gap-1.5 text-xs text-slate-muted transition hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Libretto di volo
      </Link>

      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-5">
            <div>
              <div className="flap text-3xl font-semibold">{pirep.dep_icao}</div>
              <div className="text-xs text-slate-muted">{dep?.city}</div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-muted" />
            <div>
              <div className="flap text-3xl font-semibold">{pirep.arr_icao}</div>
              <div className="text-xs text-slate-muted">{arr?.city}</div>
            </div>
          </div>

          <div className="text-right">
            <div className="font-mono text-4xl tabular-nums text-white">
              {pirep.score}
              <span className="text-lg text-slate-muted">/100</span>
            </div>
            <Badge tone={grade.startsWith("A") ? "jade" : grade === "F" ? "coral" : "sky"}>
              Voto {grade}
            </Badge>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 border-t border-ink-800 pt-5">
          <Badge tone="sky">{pirep.aircraft_icao}</Badge>
          <span className="text-xs text-slate-muted">
            {aircraft?.manufacturer} {aircraft?.name}
          </span>
          {pirep.sim && <Badge tone="neutral">{pirep.sim}</Badge>}
          {pirep.landed_off_target && (
            <Badge tone="coral">Destinazione diversa da quella prevista</Badge>
          )}
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Rateo di contatto"
          value={pirep.landing_rate_fpm != null ? `${pirep.landing_rate_fpm}` : "—"}
          sub={breakdown?.grade ? `fpm · ${qualityFrom(pirep.landing_rate_fpm)}` : "fpm"}
        />
        <Stat label="Tempo blocchi" value={durationLabel(pirep.block_minutes)} />
        <Stat
          label="Carburante"
          value={
            pirep.fuel_used_kg != null ? `${formatNumber(pirep.fuel_used_kg)}` : "—"
          }
          sub="kg consumati"
        />
        <Stat
          label="Quota massima"
          value={
            pirep.max_altitude_ft != null
              ? `FL${Math.round(pirep.max_altitude_ft / 100)}`
              : "—"
          }
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Times */}
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-white">Tempi OOOI</h2>
          <dl className="mt-4 space-y-3">
            {[
              ["Off blocks", pirep.actual_out],
              ["Decollo", pirep.actual_off],
              ["Contatto", pirep.actual_on],
              ["On blocks", pirep.actual_in],
            ].map(([label, value]) => (
              <div key={label as string} className="flex justify-between text-sm">
                <dt className="text-slate-muted">{label}</dt>
                <dd className="font-mono tabular-nums text-white">
                  {value ? `${hhmm(value as string)}Z` : "—"}
                </dd>
              </div>
            ))}
          </dl>

          <h3 className="mt-6 text-xs font-medium uppercase tracking-[0.14em] text-slate-muted">
            Rilievi
          </h3>
          <div className="mt-3 grid grid-cols-3 gap-3 text-center">
            {[
              ["Overspeed", pirep.overspeed_events],
              ["Stall", pirep.stall_events],
              ["Pause", pirep.pause_events],
            ].map(([label, n]) => (
              <div
                key={label as string}
                className="rounded-lg border border-ink-700 bg-ink-900/60 py-3"
              >
                <div
                  className={`font-mono text-xl tabular-nums ${
                    (n as number) > 0 ? "text-coral" : "text-slate-soft"
                  }`}
                >
                  {n as number}
                </div>
                <div className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-muted">
                  {label as string}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* XP breakdown */}
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-white">Calcolo esperienza</h2>
          {breakdown?.lines?.length ? (
            <>
              <ul className="mt-4 space-y-2.5">
                {breakdown.lines.map((line, i) => (
                  <li key={i} className="flex items-baseline justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-sm text-slate-soft">{line.label}</div>
                      {line.detail && (
                        <div className="text-[11px] text-slate-muted">{line.detail}</div>
                      )}
                    </div>
                    {line.amount !== 0 && (
                      <span
                        className={`shrink-0 font-mono text-sm tabular-nums ${
                          line.amount > 0 ? "text-jade" : "text-coral"
                        }`}
                      >
                        {line.amount > 0 ? "+" : ""}
                        {formatNumber(line.amount)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex items-baseline justify-between border-t border-ink-800 pt-4">
                <span className="text-sm font-medium text-white">Totale</span>
                <span className="font-mono text-xl tabular-nums text-amber-board">
                  +{formatNumber(pirep.xp_awarded ?? 0)} XP
                </span>
              </div>
            </>
          ) : (
            <p className="mt-4 text-sm text-slate-muted">
              Nessun dettaglio disponibile per questo volo.
            </p>
          )}
        </Card>
      </div>

      {track && track.length > 1 && <TrackProfile points={track} />}
    </div>
  );
}

function qualityFrom(fpm: number | null): string {
  if (fpm === null) return "non registrato";
  const r = Math.abs(fpm);
  if (r <= 50) return "flottante";
  if (r <= 180) return "da manuale";
  if (r <= 300) return "buono";
  if (r <= 450) return "deciso";
  if (r <= 600) return "duro";
  return "pesante";
}

/** Simple altitude profile drawn straight from the recorded telemetry. */
function TrackProfile({ points }: { points: { altitude_ft: number }[] }) {
  const max = Math.max(...points.map((p) => p.altitude_ft), 1000);
  const width = 1000;
  const height = 160;
  const step = width / Math.max(1, points.length - 1);

  const line = points
    .map((p, i) => `${i * step},${height - (p.altitude_ft / max) * height}`)
    .join(" ");

  return (
    <Card className="p-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-white">Profilo di volo</h2>
        <span className="font-mono text-xs tabular-nums text-slate-muted">
          {points.length} rilevazioni · apogeo FL{Math.round(max / 100)}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="mt-4 h-40 w-full"
        role="img"
        aria-label="Profilo altimetrico del volo"
      >
        <defs>
          <linearGradient id="alt" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-sky-signal)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--color-sky-signal)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          points={`0,${height} ${line} ${width},${height}`}
          fill="url(#alt)"
        />
        <polyline
          points={line}
          fill="none"
          stroke="var(--color-sky-signal)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </Card>
  );
}
