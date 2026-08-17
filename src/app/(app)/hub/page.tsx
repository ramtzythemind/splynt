import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Radio, TowerControl } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getPilotContext } from "@/lib/pilot";
import { nextRank, rankForXp, rankProgress } from "@/lib/career";
import { Badge, Button, Card, Empty, Meter } from "@/components/ui";
import { BookingCard, type DispatchFlight } from "@/components/BookingCard";
import { durationLabel, formatNumber, hhmm } from "@/lib/utils";

export const metadata = { title: "Hub" };

interface BookingJoin {
  id: string;
  status: DispatchFlight["status"];
  flight_date: string;
  aircraft_icao: string;
  pax: number;
  cargo_kg: number;
  schedules: {
    flight_number: string;
    dep_icao: string;
    arr_icao: string;
    std_utc: string;
    block_minutes: number;
    distance_nm: number;
    airlines: { callsign: string; accent: string } | null;
  } | null;
}

export default async function HubPage() {
  const { pilot, airline, position } = await getPilotContext();
  if (!pilot.airline_id) redirect("/onboarding");

  const supabase = await createClient();
  const rank = rankForXp(pilot.xp);
  const next = nextRank(pilot.xp);

  const [{ data: bookings }, { data: pireps }, { data: airports }, { data: aircraft }] =
    await Promise.all([
      supabase
        .from("bookings")
        .select(
          `id, status, flight_date, aircraft_icao, pax, cargo_kg,
           schedules ( flight_number, dep_icao, arr_icao, std_utc, block_minutes,
                       distance_nm, airlines ( callsign, accent ) )`,
        )
        .eq("pilot_id", pilot.id)
        .in("status", ["booked", "in_progress"])
        .order("flight_date"),
      supabase
        .from("pireps")
        .select("id, dep_icao, arr_icao, score, xp_awarded, block_minutes, filed_at, aircraft_icao")
        .eq("pilot_id", pilot.id)
        .eq("status", "accepted")
        .order("filed_at", { ascending: false })
        .limit(5),
      supabase.from("airports").select("icao, city"),
      supabase.from("aircraft_types").select("icao, name"),
    ]);

  const cityByIcao = new Map((airports ?? []).map((a) => [a.icao, a.city]));
  const acByIcao = new Map((aircraft ?? []).map((a) => [a.icao, a.name]));

  const dispatch: DispatchFlight[] = ((bookings ?? []) as unknown as BookingJoin[])
    .filter((b) => b.schedules)
    .map((b) => {
      const s = b.schedules!;
      const [h, m] = s.std_utc.split(":").map(Number);
      const std = new Date(Date.UTC(2000, 0, 1, h, m));
      const sta = new Date(std.getTime() + s.block_minutes * 60_000);
      return {
        bookingId: b.id,
        status: b.status,
        flightNumber: s.flight_number,
        callsign: s.airlines?.callsign ?? "",
        accent: s.airlines?.accent ?? "#3ea6ff",
        depIcao: s.dep_icao,
        depCity: cityByIcao.get(s.dep_icao) ?? s.dep_icao,
        arrIcao: s.arr_icao,
        arrCity: cityByIcao.get(s.arr_icao) ?? s.arr_icao,
        stdUtc: hhmm(s.std_utc),
        staUtc: sta.toISOString().slice(11, 16),
        flightDate: b.flight_date,
        blockMinutes: s.block_minutes,
        distanceNm: s.distance_nm,
        aircraftIcao: b.aircraft_icao,
        aircraftName: acByIcao.get(b.aircraft_icao) ?? b.aircraft_icao,
        pax: b.pax,
        cargoKg: b.cargo_kg,
      };
    });

  return (
    <div className="space-y-8">
      {/* Career header */}
      <Card className="overflow-hidden">
        <div className="h-1" style={{ background: airline?.accent ?? "#3ea6ff" }} />
        <div className="flex flex-wrap items-end justify-between gap-6 p-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="flap text-sm font-semibold">{pilot.callsign}</span>
              <Badge tone="neutral">{airline?.name}</Badge>
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
              {rank.name}
            </h1>
            <p className="mt-1 text-xs text-slate-muted">{rank.perk}</p>
          </div>

          <div className="min-w-[240px] flex-1 sm:max-w-xs">
            <div className="mb-1.5 flex items-baseline justify-between text-xs">
              <span className="font-mono tabular-nums text-white">
                {formatNumber(pilot.xp)} XP
              </span>
              {next ? (
                <span className="text-slate-muted">
                  {formatNumber(next.minXp - pilot.xp)} al grado{" "}
                  <span className="text-slate-soft">{next.name}</span>
                </span>
              ) : (
                <span className="text-amber-board">grado massimo</span>
              )}
            </div>
            <Meter
              value={rankProgress(pilot.xp)}
              accent={airline?.accent ?? "var(--color-amber-board)"}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px border-t border-ink-800 bg-ink-800 sm:grid-cols-4">
          <PlainStat label="Voli" value={formatNumber(pilot.total_flights)} />
          <PlainStat label="Ore di volo" value={durationLabel(pilot.total_minutes)} />
          <PlainStat label="Passeggeri" value={formatNumber(pilot.total_pax)} />
          <PlainStat
            label="Posizione"
            value={position?.icao ?? "—"}
            sub={position?.city}
          />
        </div>
      </Card>

      {/* Dispatch */}
      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
            <TowerControl className="h-4 w-4 text-amber-board" strokeWidth={1.8} />
            Dispatch
            <span className="font-mono text-xs text-slate-muted">
              {dispatch.length}/5
            </span>
          </h2>
          <Link href="/board">
            <Button variant="outline" size="sm">
              Tabellone partenze
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {dispatch.length === 0 ? (
          <Empty
            title="Nessun volo in dispatch"
            hint={`Vai al tabellone e prendi un turno in partenza da ${position?.icao ?? "il tuo hub"}. Puoi tenere fino a cinque voli prenotati alla volta.`}
            action={
              <Link href="/board" className="mt-1">
                <Button size="sm">Apri il tabellone</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {dispatch.map((f) => (
              <BookingCard key={f.bookingId} flight={f} />
            ))}
          </div>
        )}
      </section>

      {/* Recent flights */}
      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
            <Radio className="h-4 w-4 text-sky-signal" strokeWidth={1.8} />
            Ultimi PIREP
          </h2>
          <Link href="/logbook">
            <Button variant="ghost" size="sm">
              Libretto completo
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {!pireps?.length ? (
          <Empty
            title="Il libretto è ancora vuoto"
            hint="Collega il client ACARS, prendi un volo e completa la tratta: il PIREP verrà archiviato da solo."
          />
        ) : (
          <Card className="divide-y divide-ink-800">
            {pireps.map((p) => (
              <Link
                key={p.id}
                href={`/logbook/${p.id}`}
                className="flex flex-wrap items-center gap-x-5 gap-y-1 px-5 py-3.5 transition hover:bg-ink-800/50"
              >
                <span className="flap w-28 text-sm font-semibold">
                  {p.dep_icao} → {p.arr_icao}
                </span>
                <span className="w-16 font-mono text-xs text-slate-muted">
                  {p.aircraft_icao}
                </span>
                <span className="w-20 font-mono text-xs tabular-nums text-slate-muted">
                  {durationLabel(p.block_minutes)}
                </span>
                <span className="w-16 font-mono text-xs tabular-nums text-slate-soft">
                  {p.score}/100
                </span>
                <span className="ml-auto font-mono text-xs tabular-nums text-jade">
                  +{formatNumber(p.xp_awarded ?? 0)} XP
                </span>
              </Link>
            ))}
          </Card>
        )}
      </section>
    </div>
  );
}

function PlainStat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-ink-850 px-5 py-4">
      <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-muted">
        {label}
      </div>
      <div className="mt-1 font-mono text-lg tabular-nums text-white">{value}</div>
      {sub && <div className="text-[11px] text-slate-muted">{sub}</div>}
    </div>
  );
}
