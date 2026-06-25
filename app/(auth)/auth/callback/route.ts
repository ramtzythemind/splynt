import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Pull Google identity metadata into the profile on first OAuth login
      const { data: { user } } = await supabase.auth.getUser()
      if (user && user.app_metadata?.provider === 'google') {
        const meta = user.user_metadata ?? {}
        const fullName: string = meta.full_name ?? meta.name ?? ''
        const firstName: string = meta.given_name ?? fullName.split(' ')[0] ?? ''
        const lastName: string = meta.family_name ?? fullName.split(' ').slice(1).join(' ') ?? ''

        if (firstName) {
          // Only write if not already set — don't overwrite manual edits
          const { data: existing } = await supabase
            .from('profiles')
            .select('first_name')
            .eq('id', user.id)
            .single()

          if (!existing?.first_name) {
            await supabase
              .from('profiles')
              .update({ first_name: firstName, last_name: lastName || null })
              .eq('id', user.id)
          }
        }
      }

      // Consume beta invite code if present in the redirect URL
      const betaCode = searchParams.get('beta_code')
      if (betaCode) {
        // Use supabase RPC — user session is now active so auth.uid() works
        await supabase.rpc('redeem_beta_invite', { code_to_use: betaCode })
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
