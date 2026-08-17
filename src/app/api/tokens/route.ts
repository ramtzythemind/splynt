import { generateToken } from "@/lib/acars-auth";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const CreateSchema = z.object({ label: z.string().min(1).max(40).default("Desktop") });

/** Issues an ACARS token. The raw value is shown once and never stored. */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Non autenticato" }, { status: 401 });

  const { label } = CreateSchema.parse(await request.json().catch(() => ({})));
  const { raw, hash, prefix } = generateToken();

  const { data, error } = await supabase
    .from("acars_tokens")
    .insert({ pilot_id: user.id, label, token_hash: hash, prefix })
    .select("id, label, prefix, created_at")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });

  return Response.json({ ...data, token: raw });
}

const RevokeSchema = z.object({ id: z.string().uuid() });

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Non autenticato" }, { status: 401 });

  const { id } = RevokeSchema.parse(await request.json());
  const { error } = await supabase
    .from("acars_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .eq("pilot_id", user.id);

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ revoked: true });
}
