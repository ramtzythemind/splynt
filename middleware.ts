import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  const isAuthRoute      = path.startsWith('/login') || path.startsWith('/signup')
  const isBetaActivate   = path.startsWith('/beta')
  const isProtectedRoute =
    path.startsWith('/dashboard') ||
    path.startsWith('/onboarding') ||
    path.startsWith('/roadmap') ||
    path.startsWith('/settings')

  // No session → redirect protected routes to login
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Logged-in user on login/signup → send to dashboard
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Logged-in user on a protected route → check beta access
  if (user && isProtectedRoute && !isBetaActivate) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('beta_access')
      .eq('id', user.id)
      .single()

    if (!profile?.beta_access) {
      const url = request.nextUrl.clone()
      url.pathname = '/beta/activate'
      return NextResponse.redirect(url)
    }
  }

  // Beta activate page → redirect away if already approved
  if (user && isBetaActivate) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('beta_access')
      .eq('id', user.id)
      .single()

    if (profile?.beta_access) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
