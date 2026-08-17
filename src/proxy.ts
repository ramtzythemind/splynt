import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Everything except static assets, the ACARS API (token-authenticated)
    // and the cron endpoints (secret-authenticated).
    "/((?!_next/static|_next/image|favicon.ico|api/acars|api/cron|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
