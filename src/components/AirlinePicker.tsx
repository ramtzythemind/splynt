"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Lock, MapPin, Plane } from "lucide-react";
import { joinAirline } from "@/lib/actions";
import { Badge, Button, Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Airline } from "@/lib/supabase/types";

export interface AirlineCard extends Airline {
  hubCity: string;
  routeCount: number;
  fleetTypes: string[];
  /** Lowest rank any aircraft in this airline's fleet requires. */
  minRank: number;
  /** False when the pilot's rank cannot command anything this airline flies. */
  reachable: boolean;
}

const RANK_NAMES = [
  "",
  "Cadet",
  "Second Officer",
  "First Officer",
  "Senior First Officer",
  "Captain",
  "Senior Captain",
  "Training Captain",
  "Fleet Commander",
];

export function AirlinePicker({
  airlines,
  currentId,
}: {
  airlines: AirlineCard[];
  currentId: string | null;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(currentId);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirm() {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      const res = await joinAirline(selected);
      if (!res.ok) setError(res.error);
      else router.push("/hub");
    });
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {airlines.map((a) => {
          const active = selected === a.id;
          return (
            <Card
              key={a.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelected(a.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelected(a.id);
                }
              }}
              className={cn(
                "cursor-pointer overflow-hidden transition",
                active
                  ? "border-transparent ring-2"
                  : "hover:border-ink-600 hover:bg-ink-800/60",
                !a.reachable && !active && "opacity-60",
              )}
              style={active ? { boxShadow: `0 0 0 2px ${a.accent}` } : undefined}
            >
              <div className="h-1" style={{ background: a.accent }} />
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flap text-base font-semibold">{a.iata}</div>
                    <h3 className="mt-1 text-sm font-semibold text-white">{a.name}</h3>
                  </div>
                  {active && (
                    <span
                      className="grid h-5 w-5 shrink-0 place-items-center rounded-full"
                      style={{ background: a.accent }}
                    >
                      <Check className="h-3 w-3 text-white" strokeWidth={3} />
                    </span>
                  )}
                </div>

                <p className="mt-3 text-xs leading-relaxed text-slate-muted">
                  {a.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  <Badge tone="neutral">
                    <MapPin className="h-3 w-3" />
                    {a.hub_icao} · {a.hubCity}
                  </Badge>
                  <Badge tone="neutral">
                    <Plane className="h-3 w-3" />
                    {a.routeCount} tratte
                  </Badge>
                  {a.reachable && a.minRank === 1 && (
                    <Badge tone="jade">Adatta per iniziare</Badge>
                  )}
                  {!a.reachable && (
                    <Badge tone="coral">
                      <Lock className="h-3 w-3" />
                      Richiede {RANK_NAMES[a.minRank] ?? `grado ${a.minRank}`}
                    </Badge>
                  )}
                </div>

                <div className="mt-3 font-mono text-[10px] tracking-wide text-slate-muted">
                  {a.fleetTypes.join(" · ")}
                </div>

                <div className="mt-4 flex items-center gap-1">
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
                  <span className="ml-2 text-[10px] uppercase tracking-wider text-slate-muted">
                    difficoltà {a.difficulty}/5
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {error && (
        <p className="mt-6 rounded-lg border border-coral/30 bg-coral/10 px-3 py-2 text-xs text-coral">
          {error}
        </p>
      )}

      <div className="sticky bottom-0 mt-8 flex items-center justify-between gap-4 border-t border-ink-800 bg-ink-950/90 py-4 backdrop-blur">
        <p className="text-xs text-slate-muted">
          {selected
            ? "Verrai assegnato all'hub della compagnia. Potrai cambiare più avanti."
            : "Seleziona una compagnia per continuare."}
        </p>
        <Button size="lg" disabled={!selected || pending} onClick={confirm}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Firma il contratto
        </Button>
      </div>
    </>
  );
}
