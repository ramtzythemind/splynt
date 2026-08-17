import type { SimState } from "./sim.js";

export type Phase =
  | "preflight"
  | "taxi_out"
  | "takeoff"
  | "climb"
  | "cruise"
  | "descent"
  | "approach"
  | "landed"
  | "taxi_in"
  | "arrived";

export interface Milestones {
  out?: string; // off blocks
  off?: string; // wheels up
  on?: string; // touchdown
  in?: string; // on blocks
}

export interface FlightTotals {
  landingRateFpm: number | null;
  maxAltitudeFt: number;
  maxG: number;
  overspeedEvents: number;
  stallEvents: number;
  fuelStartKg: number | null;
  fuelEndKg: number | null;
}

/**
 * Watches the raw sim frames and turns them into flight phases, OOOI
 * milestones and the handful of aggregates a PIREP needs.
 */
export class FlightRecorder {
  phase: Phase = "preflight";
  milestones: Milestones = {};
  totals: FlightTotals = {
    landingRateFpm: null,
    maxAltitudeFt: 0,
    maxG: 0,
    overspeedEvents: 0,
    stallEvents: 0,
    fuelStartKg: null,
    fuelEndKg: null,
  };

  /** Vertical speed of the last airborne frame — the touchdown rate. */
  private lastAirborneVs = 0;
  private wasOverspeed = false;
  private wasStall = false;
  private stoppedSince: number | null = null;
  private cruiseAltitude = 0;

  constructor(private readonly onPhaseChange?: (phase: Phase) => void) {}

  get finished(): boolean {
    return this.phase === "arrived";
  }

  update(s: SimState, now = new Date()): void {
    const iso = now.toISOString();

    if (this.totals.fuelStartKg === null) this.totals.fuelStartKg = s.fuelKg;
    this.totals.fuelEndKg = s.fuelKg;
    this.totals.maxAltitudeFt = Math.max(this.totals.maxAltitudeFt, s.altitudeFt);
    this.totals.maxG = Math.max(this.totals.maxG, s.gForce);

    // Rising-edge counting so a sustained warning is one event, not fifty.
    if (s.overspeed && !this.wasOverspeed) this.totals.overspeedEvents++;
    if (s.stall && !this.wasStall) this.totals.stallEvents++;
    this.wasOverspeed = s.overspeed;
    this.wasStall = s.stall;

    if (!s.onGround) this.lastAirborneVs = s.vsFpm;

    const moving = s.gsKt > 1;
    if (moving) this.stoppedSince = null;
    else if (this.stoppedSince === null) this.stoppedSince = now.getTime();

    const stoppedFor = this.stoppedSince
      ? (now.getTime() - this.stoppedSince) / 1000
      : 0;

    switch (this.phase) {
      case "preflight":
        if (s.onGround && moving) {
          this.milestones.out = iso;
          this.set("taxi_out");
        } else if (!s.onGround) {
          // Client started mid-air: treat the flight as already under way.
          this.milestones.out ??= iso;
          this.milestones.off ??= iso;
          this.set("climb");
        }
        break;

      case "taxi_out":
        if (!s.onGround) {
          this.milestones.off = iso;
          this.set("takeoff");
        }
        break;

      case "takeoff":
        if (s.altitudeFt > 2000) this.set("climb");
        break;

      case "climb":
        if (Math.abs(s.vsFpm) < 300 && s.altitudeFt > 10_000) {
          this.cruiseAltitude = s.altitudeFt;
          this.set("cruise");
        } else if (s.onGround) {
          this.touchdown(iso);
        }
        break;

      case "cruise":
        this.cruiseAltitude = Math.max(this.cruiseAltitude, s.altitudeFt);
        if (s.vsFpm < -500 && s.altitudeFt < this.cruiseAltitude - 1500) {
          this.set("descent");
        } else if (s.onGround) {
          this.touchdown(iso);
        }
        break;

      case "descent":
        if (s.altitudeFt < 10_000) this.set("approach");
        else if (s.onGround) this.touchdown(iso);
        break;

      case "approach":
        if (s.onGround) this.touchdown(iso);
        break;

      case "landed":
        if (!s.onGround) {
          // Bounce or go-around: back into the air.
          this.set("approach");
        } else if (!moving && stoppedFor > 20) {
          this.milestones.in = iso;
          this.set("arrived");
        } else {
          this.set("taxi_in");
        }
        break;

      case "taxi_in":
        if (!s.onGround) this.set("approach");
        else if (!moving && stoppedFor > 20) {
          this.milestones.in = iso;
          this.set("arrived");
        }
        break;

      case "arrived":
        break;
    }
  }

  private touchdown(iso: string) {
    this.milestones.on ??= iso;
    if (this.totals.landingRateFpm === null) {
      this.totals.landingRateFpm = Math.round(this.lastAirborneVs);
    }
    this.set("landed");
  }

  private set(phase: Phase) {
    if (this.phase === phase) return;
    this.phase = phase;
    this.onPhaseChange?.(phase);
  }

  fuelUsedKg(): number {
    if (this.totals.fuelStartKg === null || this.totals.fuelEndKg === null) return 0;
    return Math.max(0, Math.round(this.totals.fuelStartKg - this.totals.fuelEndKg));
  }
}

export const PHASE_LABEL: Record<Phase, string> = {
  preflight: "Pre-volo",
  taxi_out: "Rullaggio",
  takeoff: "Decollo",
  climb: "Salita",
  cruise: "Crociera",
  descent: "Discesa",
  approach: "Avvicinamento",
  landed: "Atterrato",
  taxi_in: "Rullaggio in",
  arrived: "Ai blocchi",
};
