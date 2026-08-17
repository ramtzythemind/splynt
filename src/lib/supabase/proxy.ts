import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = [
  "/hub",
  "/board",
  "/logbook",
  "/pilot",
  "/dispatch",
  "/onboarding",
];

function isProtected(path: string) {
  return PROTECTED.some((p) => path === p || path.startsWith(`${p}/`));
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Without credentials there is no session to refresh. Let the public pages
  // render anyway and send anything that needs a pilot to the login screen,
  // which shows the misconfiguration instead of a blank 500.
  if (!url || !anonKey) {
    if (isProtected(request.nextUrl.pathname)) {
      const to = request.nextUrl.clone();
      to.pathname = "/login";
      return NextResponse.redirect(to);
    }
    return response;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Do not remove: this refreshes the auth token on every request.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  if (!user && isProtected(path)) {
    const to = request.nextUrl.clone();
    to.pathname = "/login";
    to.searchParams.set("next", path);
    return NextResponse.redirect(to);
  }

  if (user && (path === "/login" || path === "/signup")) {
    const to = request.nextUrl.clone();
    to.pathname = "/hub";
    to.search = "";
    return NextResponse.redirect(to);
  }

  return response;
}
