import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Checks if a code exists and has remaining uses — does NOT consume it.
// Used by the signup form to give instant feedback before account creation.
export async function POST(request: Request) {
  try {
    const { code } = await request.json()
    if (!code?.trim()) return NextResponse.json({ valid: false, error: 'No code provided' }, { status: 400 })

    const supabase = await createClient()

    // Use RPC to avoid exposing the table (but here we just check via the same function logic)
    // We call a lightweight select via the service pattern — the RPC already handles auth.uid()
    // so we do a direct check here (validate-only, not consume)
    const { data, error } = await supabase
      .from('beta_invites')
      .select('id, use_count, max_uses')
      .eq('code', code.trim().toUpperCase())
      .single()

    if (error || !data) return NextResponse.json({ valid: false, error: 'Invalid invite code' })
    if (data.use_count >= data.max_uses) return NextResponse.json({ valid: false, error: 'This code has already been used' })

    return NextResponse.json({ valid: true })
  } catch {
    return NextResponse.json({ valid: false, error: 'Something went wrong' }, { status: 500 })
  }
}
