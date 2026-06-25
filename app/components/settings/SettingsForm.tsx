'use client'

import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types'
import { SKILL_TAGS } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { AvatarCustomizer } from './AvatarCustomizer'
import { UserAvatar } from './UserAvatar'
import { Loader2, Check } from 'lucide-react'

interface Props {
  user: User
  initialProfile: Profile | null
}

const DEFAULT_PROFILE: Partial<Profile> = {
  nickname: '',
  first_name: '',
  last_name: '',
  avatar_gradient: 'from-violet-500 to-indigo-500',
  avatar_shape: 'circle',
  billing_name: '',
  billing_address: '',
  billing_city: '',
  billing_country: '',
  billing_vat: '',
  skill_tags: [],
}

export function SettingsForm({ user, initialProfile }: Props) {
  const [profile, setProfile] = useState<Partial<Profile>>(
    initialProfile ? { ...DEFAULT_PROFILE, ...initialProfile } : DEFAULT_PROFILE
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const update = (updates: Partial<Profile>) => setProfile(p => ({ ...p, ...updates }))

  const toggleSkill = (tag: string) => {
    const current = profile.skill_tags ?? []
    update({
      skill_tags: current.includes(tag)
        ? current.filter(t => t !== tag)
        : [...current, tag],
    })
  }

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('profiles').upsert({ id: user.id, ...profile })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-8">
      {/* Avatar */}
      <section className="rounded-2xl border border-border/60 bg-card p-6">
        <h2 className="mb-1 text-lg font-semibold">Avatar</h2>
        <p className="mb-6 text-sm text-muted-foreground">Customize your visual identity across Splynt</p>
        <AvatarCustomizer user={user} profile={profile} onChange={update} />
      </section>

      {/* Profile */}
      <section className="rounded-2xl border border-border/60 bg-card p-6">
        <h2 className="mb-1 text-lg font-semibold">Profile</h2>
        <p className="mb-6 text-sm text-muted-foreground">How you appear in Splynt</p>
        <div className="flex items-center gap-4 mb-6">
          <UserAvatar user={user} profile={profile as Profile} size="lg" animate />
          <div>
            <p className="font-semibold">
              {profile.first_name ? `${profile.first_name} ${profile.last_name ?? ''}`.trim() : profile.nickname || 'Your Name'}
            </p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>First name</Label>
            <Input value={profile.first_name ?? ''} onChange={e => update({ first_name: e.target.value })} placeholder="Alex" />
          </div>
          <div className="space-y-2">
            <Label>Last name</Label>
            <Input value={profile.last_name ?? ''} onChange={e => update({ last_name: e.target.value })} placeholder="Johnson" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Nickname <span className="text-muted-foreground text-xs">(displayed in chat)</span></Label>
            <Input value={profile.nickname ?? ''} onChange={e => update({ nickname: e.target.value })} placeholder="e.g. Alex" />
          </div>
        </div>
      </section>

      {/* Skills */}
      <section className="rounded-2xl border border-border/60 bg-card p-6">
        <h2 className="mb-1 text-lg font-semibold">Skills & Role</h2>
        <p className="mb-4 text-sm text-muted-foreground">Select all that apply — helps personalize your AI advice</p>
        <div className="flex flex-wrap gap-2">
          {SKILL_TAGS.map((tag) => {
            const active = (profile.skill_tags ?? []).includes(tag)
            return (
              <button
                key={tag}
                onClick={() => toggleSkill(tag)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/40 hover:bg-muted/50 text-muted-foreground'
                  }`}
              >
                {tag}
              </button>
            )
          })}
        </div>
      </section>

      {/* Billing */}
      <section className="rounded-2xl border border-border/60 bg-card p-6">
        <h2 className="mb-1 text-lg font-semibold">Billing Information</h2>
        <p className="mb-6 text-sm text-muted-foreground">For future invoices. No payment required yet.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Full name / Company</Label>
            <Input value={profile.billing_name ?? ''} onChange={e => update({ billing_name: e.target.value })} placeholder="Acme Inc." />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Address</Label>
            <Input value={profile.billing_address ?? ''} onChange={e => update({ billing_address: e.target.value })} placeholder="123 Main St" />
          </div>
          <div className="space-y-2">
            <Label>City</Label>
            <Input value={profile.billing_city ?? ''} onChange={e => update({ billing_city: e.target.value })} placeholder="New York" />
          </div>
          <div className="space-y-2">
            <Label>Country</Label>
            <Input value={profile.billing_country ?? ''} onChange={e => update({ billing_country: e.target.value })} placeholder="United States" />
          </div>
          <div className="space-y-2">
            <Label>VAT Number <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input value={profile.billing_vat ?? ''} onChange={e => update({ billing_vat: e.target.value })} placeholder="EU1234567890" />
          </div>
        </div>
      </section>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="min-w-32 gap-2">
          {saving ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
          ) : saved ? (
            <><Check className="h-4 w-4" /> Saved!</>
          ) : (
            'Save changes'
          )}
        </Button>
      </div>
    </div>
  )
}
