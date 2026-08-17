"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Filter,
  Loader2,
  Lock,
  PlaneTakeoff,
  Search,
  Users,
} from "lucide-react";
import { bookFlight, deadhead } from "@/lib/actions";
import { Badge, Button, Card, Empty, Input } from "@/components/ui";
import { cn, durationLabel, formatNumber } from "@/lib/utils";

export interface BoardRow {
  scheduleId: string;
  flightDate: string;
  flightNumber: string;
  depIcao: string;
  arrIcao: string;
  arrCity: string;
  arrCountry: string;
  stdUtc: string;
  staUtc: string;
  stdLocal: string;
  staLocal: string;
  arrivesNextDay: boolean;
  blockMinutes: number;
  distanceNm: number;
  aircraftIcao: string;
  aircraftName: string;
  aircraftClass: string;
  pax: number;
  /** null when flyable, otherwise why it is not. */
  lockedReason: string | null;
  booked: boolean;
}

const CLASS_LABEL: Record<string, string> = {
  turboprop: "Turboelica",
  regional: "Regionale",
  narrowbody: "Narrowbody",
  widebody: "Widebody",
  heavy: "Heavy",
};

export function DepartureBoard({
  rows,
  dates,
  activeDate,
  origin,
  originCity,
  otherOrigins,
  accent,
}: {
  rows: BoardRow[];
  dates: { value: string; label: string }[];
  activeDate: string;
  origin: string;
  originCity: string;
  otherOrigins: { icao: string; city: string; count: number }[];
  accent: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [klass, setKlass] = useState<string>("all");
  const [onlyFlyable, setOnlyFlyable] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const classes = useMemo(
    () => [...new Set(rows.map((r) => r.aircraftClass))],
    [rows],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    return rows.filter((r) => {
      if (klass !== "all" && r.aircraftClass !== klass) return false;
      if (onlyFlyable && r.lockedReason) return false;
      if (!q) return true;
      return (
        r.flightNumber.includes(q) ||
        r.arrIcao.includes(q) ||
        r.arrCity.toUpperCase().includes(q) ||
        r.aircraftIcao.includes(q)
      );
    });
  }, [rows, query, klass, onlyFlyable]);

  function book(row: BoardRow) {
    setPendingId(row.scheduleId + row.flightDate);
    setError(null);
    startTransition(async () => {
      const res = await bookFlight(row.scheduleId, row.flightDate);
      if (!res.ok) setError(res.error);
      setPendingId(null);
      router.refresh();
    });
  }

  function reposition(icao: string) {
    setPendingId(`dh-${icao}`);
    setError(null);
    startTransition(async () => {
      const res = await deadhead(icao);
      if (!res.ok) setError(res.error);
      setPendingId(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      {/* Date strip */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {dates.map((d) => (
          <button
            key={d.value}
            onClick={() => router.push(`/board?date=${d.value}`)}
            className={cn(
              "shrink-0 rounded-lg border px-3.5 py-2 text-xs transition",
              d.value === activeDate
                ? "border-transparent text-ink-950"
                : "border-ink-700 text-slate-muted hover:border-ink-600 hover:text-slate-soft",
            )}
            style={d.value === activeDate ? { background: accent } : undefined}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-muted" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca volo, destinazione o aeromobile…"
            className="pl-9"
          />
        </div>

        <select
          value={klass}
          onChange={(e) => setKlass(e.target.value)}
          className="rounded-lg border border-ink-600 bg-ink-900 px-3 py-2 text-sm text-slate-soft focus:border-sky-signal focus:outline-none"
        >
          <option value="all">Tutte le categorie</option>
          {classes.map((c) => (
            <option key={c} value={c}>
              {CLASS_LABEL[c] ?? c}
            </option>
          ))}
        </select>

        <button
          onClick={() => setOnlyFlyable((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs transition",
            onlyFlyable
              ? "border-jade/40 bg-jade/10 text-jade"
              : "border-ink-600 text-slate-muted hover:text-slate-soft",
          )}
        >
          <Filter className="h-3.5 w-3.5" />
          Solo abilitati
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-coral/30 bg-coral/10 px-3 py-2 text-xs text-coral">
          {error}
        </p>
      )}

      {/* Board */}
      <Card className="scanline relative overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-ink-800 px-5 py-3">
          <div>
            <div className="flap text-sm font-semibold">{origin}</div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-slate-muted">
              Partenze · {originCity}
            </div>
          </div>
          <span className="font-mono text-xs tabular-nums text-slate-muted">
            {filtered.length} voli
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-10">
            <Empty
              title="Nessun volo con questi filtri"
              hint="Prova a cambiare data, categoria o a cancellare la ricerca."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left">
              <thead>
                <tr className="border-b border-ink-800 text-[10px] uppercase tracking-[0.14em] text-slate-muted">
                  <th className="px-5 py-2.5 font-medium">Volo</th>
                  <th className="px-3 py-2.5 font-medium">Destinazione</th>
                  <th className="px-3 py-2.5 font-medium">STD</th>
                  <th className="px-3 py-2.5 font-medium">STA</th>
                  <th className="px-3 py-2.5 font-medium">Blocchi</th>
                  <th className="px-3 py-2.5 font-medium">Aeromobile</th>
                  <th className="px-3 py-2.5 font-medium">Pax</th>
                  <th className="px-5 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800/70">
                {filtered.map((r) => {
                  const key = r.scheduleId + r.flightDate;
                  const locked = !!r.lockedReason;
                  return (
                    <tr
                      key={key}
                      className={cn(
                        "text-sm transition",
                        locked ? "opacity-45" : "hover:bg-ink-800/40",
                      )}
                    >
                      <td className="flap px-5 py-3 font-semibold">
                        {r.flightNumber}
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-medium text-white">{r.arrCity}</div>
                        <div className="font-mono text-[10px] text-slate-muted">
                          {r.arrIcao} · {r.arrCountry} · {formatNumber(r.distanceNm)} NM
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-mono tabular-nums text-white">
                          {r.stdUtc}
                          <span className="ml-1 text-[10px] text-slate-muted">Z</span>
                        </div>
                        <div className="font-mono text-[10px] text-slate-muted">
                          {r.stdLocal} loc
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-mono tabular-nums text-white">
                          {r.staUtc}
                          {r.arrivesNextDay && (
                            <sup className="ml-0.5 text-[9px] text-amber-board">+1</sup>
                          )}
                          <span className="ml-1 text-[10px] text-slate-muted">Z</span>
                        </div>
                        <div className="font-mono text-[10px] text-slate-muted">
                          {r.staLocal} loc
                        </div>
                      </td>
                      <td className="px-3 py-3 font-mono text-xs tabular-nums text-slate-muted">
                        {durationLabel(r.blockMinutes)}
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-mono text-xs text-slate-soft">
                          {r.aircraftIcao}
                        </div>
                        <div className="text-[10px] text-slate-muted">
                          {CLASS_LABEL[r.aircraftClass] ?? r.aircraftClass}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="flex items-center gap-1 font-mono text-xs tabular-nums text-slate-muted">
                          <Users className="h-3 w-3" />
                          {r.pax}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {r.booked ? (
                          <Badge tone="jade">
                            <Check className="h-3 w-3" />
                            In dispatch
                          </Badge>
                        ) : locked ? (
                          <span
                            title={r.lockedReason!}
                            className="inline-flex items-center gap-1 text-[11px] text-slate-muted"
                          >
                            <Lock className="h-3 w-3" />
                            {r.lockedReason}
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            disabled={pendingId === key}
                            onClick={() => book(r)}
                          >
                            {pendingId === key ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <PlaneTakeoff className="h-3.5 w-3.5" />
                            )}
                            Prendi
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Repositioning */}
      {otherOrigins.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-white">Riposizionamento</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-muted">
            Puoi prendere solo i voli che partono da dove ti trovi ora. Per volare
            da un altro scalo della rete devi raggiungerlo come passeggero: il
            deadhead costa XP in proporzione alla distanza.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {otherOrigins.map((o) => (
              <button
                key={o.icao}
                disabled={pendingId === `dh-${o.icao}`}
                onClick={() => reposition(o.icao)}
                className="flex items-center gap-2 rounded-lg border border-ink-600 px-3 py-2 text-xs text-slate-soft transition hover:border-ink-500 hover:text-white disabled:opacity-50"
              >
                {pendingId === `dh-${o.icao}` && (
                  <Loader2 className="h-3 w-3 animate-spin" />
                )}
                <span className="flap font-semibold">{o.icao}</span>
                <span className="text-slate-muted">{o.city}</span>
                <span className="font-mono text-[10px] text-slate-muted">
                  {o.count} voli
                </span>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
