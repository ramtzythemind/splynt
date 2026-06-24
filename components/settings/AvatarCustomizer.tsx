'use client'

import { AVATAR_GRADIENTS, AVATAR_SHAPES, type Profile } from '@/types'
import type { User } from '@supabase/supabase-js'
import { UserAvatar } from './UserAvatar'

interface Props {
  user: User
  profile: Partial<Profile>
  onChange: (updates: Partial<Profile>) => void
}

export function AvatarCustomizer({ user, profile, onChange }: Props) {
  return (
    <div className="space-y-6">
      {/* Preview */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <UserAvatar user={user} profile={profile as Profile} size="xl" animate />
          <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-background" />
        </div>
        <p className="text-sm text-muted-foreground">Your avatar preview</p>
      </div>

      {/* Gradient */}
      <div>
        <p className="mb-3 text-sm font-medium">Color</p>
        <div className="grid grid-cols-4 gap-2">
          {AVATAR_GRADIENTS.map((g) => (
            <button
              key={g.value}
              onClick={() => onChange({ avatar_gradient: g.value })}
              title={g.label}
              className={`
                h-10 w-full rounded-xl bg-gradient-to-br ${g.value}
                ring-offset-2 ring-offset-background transition-all hover:scale-105
                ${profile.avatar_gradient === g.value ? 'ring-2 ring-primary' : ''}
              `}
            />
          ))}
        </div>
      </div>

      {/* Shape */}
      <div>
        <p className="mb-3 text-sm font-medium">Shape</p>
        <div className="flex gap-3">
          {AVATAR_SHAPES.map((shape) => (
            <button
              key={shape}
              onClick={() => onChange({ avatar_shape: shape })}
              className={`
                flex h-12 w-12 items-center justify-center border-2 transition-all
                ${shape === 'circle' ? 'rounded-full' : shape === 'rounded' ? 'rounded-2xl' : 'rounded-lg'}
                ${profile.avatar_shape === shape
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background hover:border-primary/40'}
              `}
            >
              <div className={`
                h-6 w-6 bg-gradient-to-br ${profile.avatar_gradient ?? 'from-violet-500 to-indigo-500'}
                ${shape === 'circle' ? 'rounded-full' : shape === 'rounded' ? 'rounded-lg' : 'rounded-sm'}
              `} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
