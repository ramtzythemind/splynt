import { z } from "zod";
import { acarsError, authenticateAcars } from "@/lib/acars-auth";

export const dynamic = "force-dynamic";

const PointSchema = z.object({
  ts: z.string().datetime(),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  altitudeFt: z.number().int(),
  gsKt: z.number().int().min(0).max(1200),
  iasKt: z.number().int().min(0).max(1200).nullable().optional(),
  vsFpm: z.number().int().min(-30000).max(30000).nullable().optional(),
  heading: z.number().int().min(0).max(360).nullable().optional(),
  fuelKg: z.number().int().min(0).nullable().optional(),
  onGround: z.boolean(),
  phase: z.string().max(24).nullable().optional(),
});

const BatchSchema = z.object({
  pirepId: z.string().uuid(),
  points: z.array(PointSchema).min(1).max(240),
  /** Milestone timestamps the client detects locally. */
  events: z
    .object({
      out: z.string().datetime().nullable().optional(),
      off: z.string().datetime().nullable().optional(),
      on: z.string().datetime().nullable().optional(),
      in: z.string().datetime().nullable().optional(),
    })
    .optional(),
});

/** Bulk-ingests position reports. Called by the client roughly every 30s. */
export async function POST(request: Request) {
  try {
    const { pilot, db } = await authenticateAcars(request);
    const body = BatchSchema.parse(await request.json());

    const { data: pirep } = await db
      .from("pireps")
      .select("id, pilot_id, status")
      .eq("id", body.pirepId)
      .maybeSingle();

    if (!pirep) return Response.json({ error: "PIREP non trovato" }, { status: 404 });
    if (pirep.pilot_id !== pilot.id) {
      return Response.json({ error: "PIREP di un altro pilota" }, { status: 403 });
    }
    if (pirep.status !== "in_progress") {
      return Response.json({ error: "PIREP già chiuso" }, { status: 409 });
    }

    const { error } = await db.from("telemetry").insert(
      body.points.map((p) => ({
        pirep_id: body.pirepId,
        ts: p.ts,
        lat: p.lat,
        lon: p.lon,
        altitude_ft: p.altitudeFt,
        gs_kt: p.gsKt,
        ias_kt: p.iasKt ?? null,
        vs_fpm: p.vsFpm ?? null,
        heading: p.heading ?? null,
        fuel_kg: p.fuelKg ?? null,
        on_ground: p.onGround,
        phase: p.phase ?? null,
      })),
    );
    if (error) throw error;

    if (body.events) {
      const patch: Record<string, string> = {};
      if (body.events.out) patch.actual_out = body.events.out;
      if (body.events.off) patch.actual_off = body.events.off;
      if (body.events.on) patch.actual_on = body.events.on;
      if (body.events.in) patch.actual_in = body.events.in;
      if (Object.keys(patch).length) {
        await db.from("pireps").update(patch).eq("id", body.pirepId);
      }
    }

    return Response.json({ accepted: body.points.length });
  } catch (err) {
    return acarsError(err);
  }
}
