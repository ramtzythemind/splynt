"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Loader2, Plane } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, Input, Label } from "@/components/ui";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const isSignup = mode === "signup";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setNotice(null);

    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient();
    } catch {
      setError(
        "Supabase non è configurato: mancano NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
      );
      setPending(false);
      return;
    }

    const { data, error: authError } = isSignup
      ? await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName || email.split("@")[0] } },
        })
      : await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(translate(authError.message));
      setPending(false);
      return;
    }

    // Email confirmation is on: no session yet.
    if (isSignup && !data.session) {
      setNotice(
        "Ti abbiamo inviato un'email di conferma. Aprila per attivare il tuo pilota.",
      );
      setPending(false);
      return;
    }

    router.replace(params.get("next") ?? "/hub");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col bg-flightdeck">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-16">
        <Link href="/" className="mb-8 flex items-center gap-2.5 self-start">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-amber-board">
            <Plane className="h-4 w-4 -rotate-45 text-ink-950" strokeWidth={2.2} />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-white">
            Splynt
          </span>
        </Link>

        <Card className="p-7">
          <h1 className="text-xl font-semibold tracking-tight text-white">
            {isSignup ? "Crea il tuo pilota" : "Bentornato a bordo"}
          </h1>
          <p className="mt-1.5 text-sm text-slate-muted">
            {isSignup
              ? "Un account, un libretto di volo, tutte le compagnie."
              : "Accedi per riprendere la tua carriera."}
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {isSignup && (
              <div>
                <Label htmlFor="displayName">Nome visualizzato</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Filippo O."
                  autoComplete="name"
                />
              </div>
            )}

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pilota@splynt.app"
                autoComplete="email"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="almeno 8 caratteri"
                autoComplete={isSignup ? "new-password" : "current-password"}
              />
            </div>

            {error && (
              <p className="rounded-lg border border-coral/30 bg-coral/10 px-3 py-2 text-xs text-coral">
                {error}
              </p>
            )}
            {notice && (
              <p className="rounded-lg border border-jade/30 bg-jade/10 px-3 py-2 text-xs text-jade">
                {notice}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSignup ? "Crea account" : "Accedi"}
            </Button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-muted">
            {isSignup ? "Hai già un account? " : "Non hai ancora un pilota? "}
            <Link
              href={isSignup ? "/login" : "/signup"}
              className="text-sky-signal hover:underline"
            >
              {isSignup ? "Accedi" : "Registrati"}
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}

function translate(message: string): string {
  const map: Record<string, string> = {
    "Invalid login credentials": "Email o password non corretti.",
    "User already registered": "Esiste già un account con questa email.",
    "Email not confirmed": "Conferma prima la tua email.",
  };
  return map[message] ?? message;
}
