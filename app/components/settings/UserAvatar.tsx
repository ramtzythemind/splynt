'use client'

import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types'

const SHAPE_CLASS: Record<string, string> = {
  circle: 'rounded-full',
  rounded: 'rounded-2xl',
  square: 'rounded-lg',
}

interface Props {
  user: User
  profile?: Profile | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  animate?: boolean
}

const SIZE: Record<string, { container: string; text: string }> = {
  sm: { container: 'h-8 w-8', text: 'text-xs' },
  md: { container: 'h-10 w-10', text: 'text-sm' },
  lg: { container: 'h-16 w-16', text: 'text-xl' },
  xl: { container: 'h-24 w-24', text: 'text-3xl' },
}

function getInitials(user: User, profile?: Profile | null): string {
  if (profile?.first_name) {
    return `${profile.first_name[0]}${profile.last_name?.[0] ?? ''}`.toUpperCase()
  }
  if (profile?.nickname) return profile.nickname.slice(0, 2).toUpperCase()
  return user.email?.slice(0, 2).toUpperCase() ?? 'U'
}

export function UserAvatar({ user, profile, size = 'md', animate = false }: Props) {
  const initials = getInitials(user, profile)
  const gradient = profile?.avatar_gradient ?? 'from-violet-500 to-indigo-500'
  const shape = profile?.avatar_shape ?? 'circle'
  const { container, text } = SIZE[size]

  return (
    <div
      className={`
        ${container} ${SHAPE_CLASS[shape]}
        bg-gradient-to-br ${gradient}
        flex items-center justify-center font-bold text-white select-none cursor-pointer
        ${animate ? 'hover:scale-105 transition-transform duration-200' : ''}
        flex-shrink-0
      `}
    >
      <span className={text}>{initials}</span>
    </div>
  )
}
