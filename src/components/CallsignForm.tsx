"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { updateCallsign } from "@/lib/actions";
import { Button, Input, Label } from "@/components/ui";

export function CallsignForm({ current }: { current: string }) {
  const router = useRouter();
  const [value, setValue] = useState(current);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const dirty = value.trim().toUpperCase() !== current;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const res = await updateCallsign(value);
          if (!res.ok) return setError(res.error);
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
          router.refresh();
        });
      }}
    >
      <Label htmlFor="callsign">Callsign</Label>
      <Input
        id="callsign"
        value={value}
        maxLength={12}
        onChange={(e) => setValue(e.target.value.toUpperCase())}
        className="font-mono"
      />
      {error && <p className="mt-1.5 text-[11px] text-coral">{error}</p>}
      <Button
        type="submit"
        variant="outline"
        size="sm"
        className="mt-2 w-full"
        disabled={!dirty || pending}
      >
        {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {saved && <Check className="h-3.5 w-3.5 text-jade" />}
        {saved ? "Salvato" : "Salva callsign"}
      </Button>
    </form>
  );
}
