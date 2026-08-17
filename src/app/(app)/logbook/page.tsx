import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getPilotContext } from "@/lib/pilot";
import { gradeFor } from "@/lib/career";
import { Badge, Card, Empty, Stat } from "@/components/ui";
import { durationLabel, formatNumber } from "@/lib/utils";

export const metadata = { title: "Libretto di volo" };

const GRADE_TONE = {
  "A+": "jade",
  A: "jade",
  B: "sky",
  C: "amber",
  D: "amber",
  F: "coral",
} as const;

export default async function LogbookPage() {
  const { pilot } = await getPilotContext();
  const supabase = await createClient();

  const { data: pireps } = await supabase
    .from("pireps")
    .select(
      `id, dep_icao, arr_icao, aircraft_icao, block_minutes, distance_nm,
       landing_rate_fpm, score, xp_awarded, filed_at, sim`,
    )
    .eq("pilot_id", pilot.id)
    .eq("status", "accepted")
    .order("filed_at", { ascending: false })
    .limit(200);

  const flights = pireps ?? [];
  const avgScore = flights.length
    ? Math.round(flights.reduce((s, p) => s + (p.score ?? 0), 0) / flights.length)
    : 0;
  const landings = flights.filter((p) => p.landing_rate_fpm != null);
  const avgLanding = landings.length
    ? Math.round(
        landings.reduce((s, p) => s + Math.abs(p.landing_rate_fpm!), 0) /
          landings.length,
      )
    : 0;
  const totalNm = flights.reduce((s, p) => s + (p.distance_nm ?? 0), 0);

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Libretto di volo
        </h1>
        <p className="mt-2 text-sm text-slate-muted">
          Ogni tratta registrata dal client ACARS, con il voto che si è meritata.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Voli registrati" value={formatNumber(pilot.total_flights)} />
        <Stat
          label="Ore di volo"
          value={durationLabel(pilot.total_minutes)}
          sub={`${formatNumber(totalNm)} NM percorse`}
        />
        <Stat
          label="Punteggio medio"
          value={flights.length ? `${avgScore}` : "—"}
          sub={flights.length ? `grado medio ${gradeFor(avgScore)}` : undefined}
        />
        <Stat
          label="Contatto medio"
          value={landings.length ? `-${avgLanding}` : "—"}
          sub={landings.length ? "fpm al touchdown" : undefined}
        />
      </div>

      {flights.length === 0 ? (
        <Empty
          title="Nessun volo registrato"
          hint="Prendi un turno dal tabellone, avvia il client ACARS e vola la tratta. Il PIREP comparirà qui appena spegni i motori a destinazione."
        />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead>
              <tr className="border-b border-ink-800 text-[10px] uppercase tracking-[0.14em] text-slate-muted">
                <th className="px-5 py-2.5 font-medium">Data</th>
                <th className="px-3 py-2.5 font-medium">Tratta</th>
                <th className="px-3 py-2.5 font-medium">Aeromobile</th>
                <th className="px-3 py-2.5 font-medium">Blocchi</th>
                <th className="px-3 py-2.5 font-medium">Contatto</th>
                <th className="px-3 py-2.5 font-medium">Voto</th>
                <th className="px-5 py-2.5 text-right font-medium">XP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800/70">
              {flights.map((p) => {
                const grade = gradeFor(p.score ?? 0);
                return (
                  <tr key={p.id} className="text-sm transition hover:bg-ink-800/40">
                    <td className="px-5 py-3 font-mono text-xs tabular-nums text-slate-muted">
                      {p.filed_at
                        ? new Intl.DateTimeFormat("it-IT", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "2-digit",
                          }).format(new Date(p.filed_at))
                        : "—"}
                    </td>
                    <td className="px-3 py-3">
                      <Link
                        href={`/logbook/${p.id}`}
                        className="flap font-semibold hover:underline"
                      >
                        {p.dep_icao} → {p.arr_icao}
                      </Link>
                      <div className="font-mono text-[10px] text-slate-muted">
                        {formatNumber(p.distance_nm ?? 0)} NM · {p.sim ?? "MSFS"}
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-slate-soft">
                      {p.aircraft_icao}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs tabular-nums text-slate-muted">
                      {durationLabel(p.block_minutes)}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs tabular-nums text-slate-soft">
                      {p.landing_rate_fpm != null ? `${p.landing_rate_fpm} fpm` : "—"}
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={GRADE_TONE[grade as keyof typeof GRADE_TONE]}>
                        {grade} · {p.score}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-xs tabular-nums text-jade">
                      +{formatNumber(p.xp_awarded ?? 0)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
