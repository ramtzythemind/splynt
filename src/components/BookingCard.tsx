"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Radio, Users, X } from "lucide-react";
import { cancelBooking } from "@/lib/actions";
import { Badge, Button, Card } from "@/components/ui";
import { durationLabel } from "@/lib/utils";

export interface DispatchFlight {
  bookingId: string;
  status: "booked" | "in_progress";
  flightNumber: string;
  callsign: string;
  accent: string;
  depIcao: string;
  depCity: string;
  arrIcao: string;
  arrCity: string;
  stdUtc: string;
  staUtc: string;
  flightDate: string;
  blockMinutes: number;
  distanceNm: number;
  aircraftIcao: string;
  aircraftName: string;
  pax: number;
  cargoKg: number;
}

export function BookingCard({ flight }: { flight: DispatchFlight }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const live = flight.status === "in_progress";

  return (
    <Card className="overflow-hidden">
      <div className="h-0.5" style={{ background: flight.accent }} />
      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flap text-lg font-semibold">{flight.flightNumber}</span>
              {live ? (
                <Badge tone="jade">
                  <Radio className="h-3 w-3 animate-pulse-dot" />
                  In volo
                </Badge>
              ) : (
                <Badge tone="amber">Prenotato</Badge>
              )}
            </div>
            <p className="mt-1 font-mono text-[11px] tracking-wide text-slate-muted">
              {flight.callsign} · {flight.flightDate}
            </p>
          </div>

          {!live && (
            <Button
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await cancelBooking(flight.bookingId);
                  router.refresh();
                })
              }
            >
              {pending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <X className="h-3.5 w-3.5" />
              )}
              Annulla
            </Button>
          )}
        </div>

        <div className="mt-5 flex items-center gap-4">
          <div className="min-w-0">
            <div className="flap text-2xl font-semibold">{flight.depIcao}</div>
            <div className="truncate text-xs text-slate-muted">{flight.depCity}</div>
            <div className="mt-1 font-mono text-sm tabular-nums text-white">
              {flight.stdUtc}
              <span className="ml-1 text-[10px] text-slate-muted">Z</span>
            </div>
          </div>

          <div className="flex flex-1 flex-col items-center gap-1 px-2">
            <span className="text-[10px] uppercase tracking-[0.14em] text-slate-muted">
              {durationLabel(flight.blockMinutes)}
            </span>
            <div className="flex w-full items-center gap-1">
              <span className="h-px flex-1 bg-ink-600" />
              <ArrowRight className="h-3.5 w-3.5 text-slate-muted" />
              <span className="h-px flex-1 bg-ink-600" />
            </div>
            <span className="font-mono text-[10px] tabular-nums text-slate-muted">
              {flight.distanceNm} NM
            </span>
          </div>

          <div className="min-w-0 text-right">
            <div className="flap text-2xl font-semibold">{flight.arrIcao}</div>
            <div className="truncate text-xs text-slate-muted">{flight.arrCity}</div>
            <div className="mt-1 font-mono text-sm tabular-nums text-white">
              {flight.staUtc}
              <span className="ml-1 text-[10px] text-slate-muted">Z</span>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-ink-800 pt-4">
          <Badge tone="sky">{flight.aircraftIcao}</Badge>
          <span className="text-xs text-slate-muted">{flight.aircraftName}</span>
          <span className="ml-auto flex items-center gap-1 font-mono text-xs tabular-nums text-slate-muted">
            <Users className="h-3.5 w-3.5" />
            {flight.pax}
          </span>
          <span className="font-mono text-xs tabular-nums text-slate-muted">
            {flight.cargoKg.toLocaleString("it-IT")} kg
          </span>
        </div>

        {live && (
          <p className="mt-3 rounded-lg border border-jade/25 bg-jade/5 px-3 py-2 text-[11px] leading-relaxed text-jade">
            Il client ACARS sta registrando questo volo. Il PIREP verrà archiviato
            automaticamente allo spegnimento dei motori a destinazione.
          </p>
        )}
      </div>
    </Card>
  );
}
