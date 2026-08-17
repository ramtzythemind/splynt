import { createHash, randomBytes } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/server";
import type { Pilot } from "@/lib/supabase/types";

export const TOKEN_PREFIX = "splynt_";

export function generateToken() {
  const raw = TOKEN_PREFIX + randomBytes(24).toString("hex");
  return { raw, hash: hashToken(raw), prefix: raw.slice(0, 14) };
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export class AcarsAuthError extends Error {
  constructor(
    message: string,
    readonly status = 401,
  ) {
    super(message);
  }
}

/**
 * Authenticates a desktop ACARS client from its `Authorization: Bearer` token
 * and returns the pilot it belongs to. Bumps `last_used_at` so the web UI can
 * show when the client last checked in.
 */
export async function authenticateAcars(request: Request): Promise<{
  pilot: Pilot;
  db: ReturnType<typeof createServiceClient>;
}> {
  const header = request.headers.get("authorization") ?? "";
  const raw = header.startsWith("Bearer ") ? header.slice(7).trim() : "";

  if (!raw.startsWith(TOKEN_PREFIX)) {
    throw new AcarsAuthError("Token ACARS mancante o malformato");
  }

  const db = createServiceClient();
  const { data: token } = await db
    .from("acars_tokens")
    .select("id, pilot_id, revoked_at")
    .eq("token_hash", hashToken(raw))
    .maybeSingle();

  if (!token) throw new AcarsAuthError("Token non riconosciuto");
  if (token.revoked_at) throw new AcarsAuthError("Token revocato");

  const { data: pilot } = await db
    .from("pilots")
    .select("*")
    .eq("id", token.pilot_id)
    .single();

  if (!pilot) throw new AcarsAuthError("Pilota non trovato", 404);

  await db
    .from("acars_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", token.id);

  return { pilot: pilot as Pilot, db };
}

export function acarsError(err: unknown) {
  if (err instanceof AcarsAuthError) {
    return Response.json({ error: err.message }, { status: err.status });
  }
  const message = err instanceof Error ? err.message : "Errore interno";
  console.error("[acars]", err);
  return Response.json({ error: message }, { status: 500 });
}
