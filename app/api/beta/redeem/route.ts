import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Consumes an invite code for the currently authenticated user.
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { code } = await request.json()
    if (!code?.trim()) return NextResponse.json({ error: 'No code provided' }, { status: 400 })

    const { data: success, error } = await supabase.rpc('redeem_beta_invite', {
      code_to_use: code.trim(),
    })

    if (error || !success) {
      return NextResponse.json({ error: 'Invalid or already used invite code' }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
