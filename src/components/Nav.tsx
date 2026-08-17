"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/hub", label: "Hub" },
  { href: "/board", label: "Partenze" },
  { href: "/logbook", label: "Libretto" },
  { href: "/pilot", label: "Pilota" },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 text-sm">
      {LINKS.map((l) => {
        const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "rounded-md px-3 py-1.5 transition",
              active
                ? "bg-ink-800 text-white"
                : "text-slate-muted hover:bg-ink-800/60 hover:text-slate-soft",
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function SignOutButton() {
  const router = useRouter();

  return (
    <button
      onClick={async () => {
        await createClient().auth.signOut();
        router.replace("/login");
        router.refresh();
      }}
      aria-label="Esci"
      title="Esci"
      className="rounded-md p-2 text-slate-muted transition hover:bg-ink-800 hover:text-white"
    >
      <LogOut className="h-4 w-4" />
    </button>
  );
}
