/**
 * The career engine. Pure functions — no I/O — so both the API routes and the
 * UI can score a flight from the same rules.
 */
import type { AircraftClass, XpBreakdown, XpLine } from "@/lib/supabase/types";
import { RANKS } from "@/data/aircraft";

/** Flying a Q400 all day should not be strictly worse than a 777. */
const CLASS_MULTIPLIER: Record<AircraftClass, number> = {
  turboprop: 1.35,
  regional: 1.2,
  narrowbody: 1.0,
  widebody: 0.92,
  heavy: 0.88,
};

export interface FlightResult {
  distanceNm: number;
  pax: number;
  blockMinutes: number;
  aircraftClass: AircraftClass;
  airlineDifficulty: number;
  /** Vertical speed at touchdown, negative = descending. */
  landingRateFpm: number | null;
  /** Minutes between STD and actual off-blocks; negative = early. */
  departureDelayMin: number | null;
  /** Actual track flown, used to detect straight-line teleporting or detours. */
  trackDistanceNm?: number | null;
  overspeedEvents: number;
  stallEvents: number;
  pauseEvents: number;
  /** True when the aircraft did not shut down at the filed destination. */
  landedOffTarget: boolean;
  /** Touchdown in local night hours at the destination. */
  nightLanding?: boolean;
}

export interface ScoredFlight extends XpBreakdown {
  landingQuality: string;
}

function landingScore(fpm: number | null): { score: number; label: string } {
  if (fpm === null) return { score: 60, label: "non registrato" };
  const rate = Math.abs(fpm);
  if (rate <= 50) return { score: 88, label: "flottante" };
  if (rate <= 180) return { score: 100, label: "da manuale" };
  if (rate <= 300) return { score: 86, label: "buono" };
  if (rate <= 450) return { score: 66, label: "deciso" };
  if (rate <= 600) return { score: 42, label: "duro" };
  return { score: 8, label: "atterraggio pesante" };
}

function punctualityScore(delay: number | null): { score: number; label: string } {
  if (delay === null) return { score: 70, label: "non registrato" };
  if (delay < -20) return { score: 75, label: `${Math.abs(delay)}' in anticipo` };
  if (delay <= 15) return { score: 100, label: delay <= 0 ? "in orario" : `${delay}' di ritardo` };
  if (delay <= 30) return { score: 84, label: `${delay}' di ritardo` };
  if (delay <= 60) return { score: 62, label: `${delay}' di ritardo` };
  if (delay <= 120) return { score: 35, label: `${delay}' di ritardo` };
  return { score: 12, label: `${delay}' di ritardo` };
}

function airmanshipScore(f: FlightResult): { score: number; notes: string[] } {
  const notes: string[] = [];
  let score = 100;

  if (f.overspeedEvents > 0) {
    const p = Math.min(45, f.overspeedEvents * 15);
    score -= p;
    notes.push(`${f.overspeedEvents}× overspeed`);
  }
  if (f.stallEvents > 0) {
    const p = Math.min(50, f.stallEvents * 25);
    score -= p;
    notes.push(`${f.stallEvents}× stall warning`);
  }
  if (f.pauseEvents > 0) {
    const p = Math.min(30, f.pauseEvents * 10);
    score -= p;
    notes.push(`${f.pauseEvents}× pausa in volo`);
  }

  if (f.trackDistanceNm && f.distanceNm > 0) {
    const ratio = f.trackDistanceNm / f.distanceNm;
    if (ratio < 0.9) {
      score -= 60;
      notes.push("traccia più corta della rotta ortodromica");
    } else if (ratio > 1.45) {
      score -= 20;
      notes.push(`deviazione del ${Math.round((ratio - 1) * 100)}%`);
    }
  }

  return { score: Math.max(0, score), notes };
}

export function scoreFlight(f: FlightResult): ScoredFlight {
  const landing = landingScore(f.landingRateFpm);
  const punctuality = punctualityScore(f.departureDelayMin);
  const airmanship = airmanshipScore(f);

  const score = Math.round(
    landing.score * 0.4 + punctuality.score * 0.22 + airmanship.score * 0.38,
  );

  const base = Math.round(f.distanceNm * 1.2 + f.pax * 3 + f.blockMinutes * 2);
  const classMult = CLASS_MULTIPLIER[f.aircraftClass];
  const difficultyMult = 1 + (f.airlineDifficulty - 1) * 0.05;
  const performanceMult = 0.5 + (score / 100) * 0.7;

  const lines: XpLine[] = [
    {
      label: "Volo completato",
      amount: base,
      detail: `${f.distanceNm} NM · ${f.pax} pax · ${f.blockMinutes}' di blocchi`,
    },
  ];

  const classBonus = Math.round(base * (classMult - 1));
  if (classBonus !== 0) {
    lines.push({
      label: classBonus > 0 ? "Bonus categoria" : "Correzione categoria",
      amount: classBonus,
      detail: `${f.aircraftClass} ×${classMult.toFixed(2)}`,
    });
  }

  const difficultyBonus = Math.round(base * classMult * (difficultyMult - 1));
  if (difficultyBonus > 0) {
    lines.push({
      label: "Difficoltà compagnia",
      amount: difficultyBonus,
      detail: `livello ${f.airlineDifficulty} ×${difficultyMult.toFixed(2)}`,
    });
  }

  const afterMultipliers = base * classMult * difficultyMult;
  const performanceDelta = Math.round(afterMultipliers * (performanceMult - 1));
  lines.push({
    label: performanceDelta >= 0 ? "Bonus condotta" : "Penalità condotta",
    amount: performanceDelta,
    detail: `punteggio ${score}/100 ×${performanceMult.toFixed(2)}`,
  });

  let total = Math.round(afterMultipliers * performanceMult);

  if (f.nightLanding) {
    const bonus = Math.round(total * 0.08);
    lines.push({ label: "Atterraggio notturno", amount: bonus, detail: "+8%" });
    total += bonus;
  }

  if (f.distanceNm >= 3000) {
    const bonus = Math.round(total * 0.1);
    lines.push({ label: "Long haul", amount: bonus, detail: "oltre 3000 NM, +10%" });
    total += bonus;
  }

  if (f.landedOffTarget) {
    const penalty = -Math.round(total * 0.6);
    lines.push({
      label: "Destinazione errata",
      amount: penalty,
      detail: "il volo non si è concluso all'aeroporto previsto",
    });
    total += penalty;
  }

  for (const note of airmanship.notes) {
    lines.push({ label: "Rilievo", amount: 0, detail: note });
  }

  total = Math.max(0, total);

  return {
    lines,
    total,
    score,
    grade: gradeFor(score),
    landingQuality: landing.label,
  };
}

export function gradeFor(score: number): string {
  if (score >= 95) return "A+";
  if (score >= 88) return "A";
  if (score >= 78) return "B";
  if (score >= 65) return "C";
  if (score >= 50) return "D";
  return "F";
}

export function rankForXp(xp: number) {
  let current = RANKS[0];
  for (const r of RANKS) if (xp >= r.minXp) current = r;
  return current;
}

export function nextRank(xp: number) {
  return RANKS.find((r) => r.minXp > xp) ?? null;
}

/** 0–1 progress towards the next rank. Returns 1 at the top rank. */
export function rankProgress(xp: number): number {
  const current = rankForXp(xp);
  const next = nextRank(xp);
  if (!next) return 1;
  return Math.min(1, (xp - current.minXp) / (next.minXp - current.minXp));
}

const CLASS_ORDER: AircraftClass[] = [
  "turboprop",
  "regional",
  "narrowbody",
  "widebody",
  "heavy",
];

/** Can a pilot at this rank command this aircraft class? */
export function canFly(rankLevel: number, klass: AircraftClass): boolean {
  const rank = RANKS.find((r) => r.level === rankLevel) ?? RANKS[0];
  return CLASS_ORDER.indexOf(klass) <= CLASS_ORDER.indexOf(rank.maxClass);
}

export { RANKS };
