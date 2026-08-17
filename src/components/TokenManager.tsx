"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, KeyRound, Loader2, Plus, Trash2 } from "lucide-react";
import { Badge, Button, Card, Input } from "@/components/ui";

export interface TokenRow {
  id: string;
  label: string;
  prefix: string;
  created_at: string;
  last_used_at: string | null;
}

export function TokenManager({ tokens }: { tokens: TokenRow[] }) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [issued, setIssued] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setPending("create");
    setError(null);
    const res = await fetch("/api/tokens", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ label: label.trim() || "Desktop" }),
    });
    const data = await res.json();
    setPending(null);
    if (!res.ok) return setError(data.error ?? "Impossibile creare il token");
    setIssued(data.token);
    setLabel("");
    router.refresh();
  }

  async function revoke(id: string) {
    setPending(id);
    await fetch("/api/tokens", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setPending(null);
    router.refresh();
  }

  return (
    <Card className="p-6">
      <div className="flex items-start gap-3">
        <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-amber-board" strokeWidth={1.8} />
        <div>
          <h2 className="text-sm font-semibold text-white">Token ACARS</h2>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-muted">
            Il client desktop usa questo token per identificarti e archiviare i
            PIREP. Incollalo nelle impostazioni del client. Viene mostrato una
            sola volta: se lo perdi, revocalo e generane un altro.
          </p>
        </div>
      </div>

      {issued && (
        <div className="mt-5 rounded-lg border border-jade/30 bg-jade/5 p-4">
          <p className="text-[11px] uppercase tracking-[0.14em] text-jade">
            Copialo adesso — non sarà più visibile
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded-md bg-ink-950 px-3 py-2 font-mono text-xs text-white">
              {issued}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(issued);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              <Copy className="h-3.5 w-3.5" />
              {copied ? "Copiato" : "Copia"}
            </Button>
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Nome del dispositivo (es. PC simulatore)"
          className="max-w-xs flex-1"
        />
        <Button onClick={create} disabled={pending === "create"}>
          {pending === "create" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Genera token
        </Button>
      </div>

      {error && <p className="mt-3 text-xs text-coral">{error}</p>}

      {tokens.length > 0 && (
        <ul className="mt-6 divide-y divide-ink-800 border-t border-ink-800">
          {tokens.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center gap-3 py-3">
              <span className="font-medium text-sm text-white">{t.label}</span>
              <code className="font-mono text-[11px] text-slate-muted">
                {t.prefix}…
              </code>
              <Badge tone="neutral">
                {t.last_used_at
                  ? `usato ${new Intl.DateTimeFormat("it-IT", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(t.last_used_at))}`
                  : "mai usato"}
              </Badge>
              <Button
                variant="danger"
                size="sm"
                className="ml-auto"
                disabled={pending === t.id}
                onClick={() => revoke(t.id)}
              >
                {pending === t.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                Revoca
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
