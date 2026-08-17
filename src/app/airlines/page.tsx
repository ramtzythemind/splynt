import Link from "next/link";
import { ArrowLeft, MapPin, Plane } from "lucide-react";
import { AIRLINES } from "@/data/airlines";
import { AIRPORTS } from "@/data/airports";
import { DATASET_STATS } from "@/data/stats";
import { Badge, Button, Card } from "@/components/ui";

export const metadata = {
  title: "Le compagnie",
  description:
    "Dodici compagnie aeree con i loro orari reali, dalle regionali con ATR e Dash 8 fino ai widebody di Emirates.",
};

const cityByIcao = new Map(AIRPORTS.map((a) => [a[0], a[3]]));

export default function AirlinesPage() {
  return (
    <div className="min-h-screen bg-flightdeck">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-muted transition hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Splynt
        </Link>

        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {DATASET_STATS.airlines} compagnie, {DATASET_STATS.airlines} carriere
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-soft">
          Ogni compagnia ha il suo hub, la sua flotta e il suo ritmo. La
          difficoltà moltiplica gli XP che guadagni: volare per Emirates rende
          più che volare per Ryanair, ma richiede il grado di comandante prima
          ancora del primo turno.
        </p>

        <div className="mt-12 space-y-4">
          {AIRLINES.map((a) => {
            const destinations = new Set(a.routes.map((r) => r[2]));
            return (
              <Card key={a.icao} className="overflow-hidden">
                <div className="h-1" style={{ background: a.accent }} />
                <div className="grid gap-6 p-6 lg:grid-cols-[220px_1fr_auto]">
                  <div>
                    <div className="flap text-2xl font-semibold">{a.iata}</div>
                    <h2 className="mt-1.5 text-base font-semibold text-white">
                      {a.name}
                    </h2>
                    <p className="mt-1 font-mono text-[11px] tracking-wide text-slate-muted">
                      {a.icao} · &ldquo;{a.callsign}&rdquo;
                    </p>
                    <div className="mt-3 flex items-center gap-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <span
                          key={i}
                          className="h-1 w-5 rounded-full"
                          style={{
                            background:
                              i < a.difficulty ? a.accent : "var(--color-ink-700)",
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm leading-relaxed text-slate-soft">
                      {a.description}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      <Badge tone="amber">
                        <MapPin className="h-3 w-3" />
                        {a.hub} · {cityByIcao.get(a.hub)}
                      </Badge>
                      <Badge tone="neutral">
                        <Plane className="h-3 w-3" />
                        {a.routes.length * 2} tratte
                      </Badge>
                      <Badge tone="neutral">{destinations.size} destinazioni</Badge>
                    </div>
                    <div className="mt-3 font-mono text-[10px] tracking-wide text-slate-muted">
                      {a.fleet.map(([icao]) => icao).join(" · ")}
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Link href="/signup">
                      <Button size="sm">Vola per {a.iata}</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
