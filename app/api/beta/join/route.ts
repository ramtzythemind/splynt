import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, handle } = await request.json()
    if (!email?.trim()) return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    if (!handle?.trim()) return NextResponse.json({ error: 'Handle is required' }, { status: 400 })

    const supabase = await createClient()

    const { error } = await supabase
      .from('beta_waitlist')
      .upsert(
        {
          email: email.trim().toLowerCase(),
          handle: handle.trim().replace(/^@/, ''),
        },
        { onConflict: 'email' }
      )

    if (error) {
      console.error('[beta/join]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Something went wrong'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
