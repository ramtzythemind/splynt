import Link from "next/link";
import { Plane } from "lucide-react";
import type { ReactNode } from "react";
import { getPilotContext } from "@/lib/pilot";
import { rankForXp, rankProgress, nextRank } from "@/lib/career";
import { Meter } from "@/components/ui";
import { NavLinks, SignOutButton } from "@/components/Nav";
import { formatNumber } from "@/lib/utils";

export async function AppShell({ children }: { children: ReactNode }) {
  const { pilot, airline, position } = await getPilotContext();
  const rank = rankForXp(pilot.xp);
  const next = nextRank(pilot.xp);
  const progress = rankProgress(pilot.xp);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-ink-800 bg-ink-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3">
          <Link href="/hub" className="flex items-center gap-2.5">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-amber-board">
              <Plane className="h-4 w-4 -rotate-45 text-ink-950" strokeWidth={2.2} />
            </span>
            <span className="text-[15px] font-semibold tracking-tight text-white">
              Splynt
            </span>
          </Link>

          <NavLinks />

          <div className="ml-auto flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <div className="flap text-xs font-semibold">{pilot.callsign}</div>
              <div className="text-[10px] uppercase tracking-[0.12em] text-slate-muted">
                {rank.name}
                {position && ` · ${position.icao}`}
              </div>
            </div>
            <div className="hidden w-32 sm:block">
              <div className="mb-1 flex items-baseline justify-between text-[10px] text-slate-muted">
                <span className="font-mono tabular-nums text-slate-soft">
                  {formatNumber(pilot.xp)} XP
                </span>
                {next && (
                  <span className="font-mono tabular-nums">
                    {formatNumber(next.minXp)}
                  </span>
                )}
              </div>
              <Meter
                value={progress}
                accent={airline?.accent ?? "var(--color-amber-board)"}
              />
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-8">{children}</main>
    </div>
  );
}
