'use client'

import { forwardRef } from 'react'
import type { CheckIn, Profile, Project } from '@/types'
import { computeStreak, computeMomentumScore, getTier } from '@/lib/momentum'

export type CardFormat = 'square' | 'portrait' | 'stories'

export const CARD_DIMS: Record<CardFormat, { w: number; h: number; label: string; ratio: string; outW: number; outH: number }> = {
  square:   { w: 540, h: 540,  label: 'Square',   ratio: '1:1',  outW: 1080, outH: 1080 },
  portrait: { w: 540, h: 675,  label: 'Portrait',  ratio: '4:5',  outW: 1080, outH: 1350 },
  stories:  { w: 540, h: 960,  label: 'Stories',   ratio: '9:16', outW: 1080, outH: 1920 },
}

const GRADIENT_CSS: Record<string, string> = {
  'from-violet-500 to-indigo-500': 'linear-gradient(135deg, #8b5cf6, #6366f1)',
  'from-cyan-400 to-blue-600':     'linear-gradient(135deg, #22d3ee, #2563eb)',
  'from-orange-400 to-pink-600':   'linear-gradient(135deg, #fb923c, #db2777)',
  'from-emerald-400 to-teal-600':  'linear-gradient(135deg, #34d399, #0d9488)',
  'from-rose-400 to-purple-600':   'linear-gradient(135deg, #fb7185, #9333ea)',
  'from-yellow-400 to-orange-500': 'linear-gradient(135deg, #facc15, #f97316)',
  'from-slate-600 to-gray-900':    'linear-gradient(135deg, #475569, #111827)',
  'from-green-400 to-cyan-500':    'linear-gradient(135deg, #4ade80, #06b6d4)',
}

const TIER_ACCENT: Record<string, string> = {
  'Getting Started':   '#22c55e',
  'Building Momentum': '#eab308',
  'On Fire':           '#f97316',
  'Unstoppable':       '#a855f7',
}

interface Props {
  project: Project
  checkins: CheckIn[]
  profile: Profile | null
  format: CardFormat
}

// ── shared helpers ─────────────────────────────────────────────────────────────

function Logo({ size = 26 }: { size?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <div style={{
        width: size, height: size, borderRadius: Math.round(size * 0.27),
        background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: Math.round(size * 0.5), color: 'white',
      }}>⚡</div>
      <span style={{ color: 'white', fontWeight: 700, fontSize: Math.round(size * 0.58), letterSpacing: '-0.02em' }}>
        SPLYNT
      </span>
    </div>
  )
}

function TierBadge({ label, accent }: { label: string; accent: string }) {
  return (
    <div style={{
      padding: '4px 12px', borderRadius: 100,
      border: `1px solid ${accent}55`, background: `${accent}18`,
      color: accent, fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
      textTransform: 'uppercase' as const,
    }}>{label}</div>
  )
}

function Avatar({ gradient, initials, size }: { gradient: string; initials: string; size: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size / 2,
      background: gradient,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 0 0 3px rgba(255,255,255,0.08), 0 10px 28px rgba(0,0,0,0.5)',
    }}>
      <span style={{ color: 'white', fontWeight: 700, fontSize: Math.round(size * 0.35) }}>{initials}</span>
    </div>
  )
}

function StatCell({ value, label, sub, large = false }: { value: string; label: string; sub: string; large?: boolean }) {
  return (
    <div style={{
      flex: 1,
      background: 'rgba(255,255,255,0.055)',
      border: '1px solid rgba(255,255,255,0.09)',
      borderRadius: 14,
      padding: large ? '18px 8px 14px' : '12px 6px 10px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
    }}>
      <span style={{ color: 'white', fontWeight: 700, fontSize: large ? 26 : 20, lineHeight: 1 }}>{value}</span>
      <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: large ? 13 : 11, fontWeight: 500, marginTop: 2 }}>{label}</span>
      <span style={{ color: 'rgba(255,255,255,0.38)', fontSize: large ? 11 : 10 }}>{sub}</span>
    </div>
  )
}

function ProgressBar({ progress, accent }: { progress: number; accent: string }) {
  return (
    <div style={{ height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${progress}%`, borderRadius: 4,
        background: `linear-gradient(90deg, #7c3aed, ${accent})`,
      }} />
    </div>
  )
}

function Footer({ large = false }: { large?: boolean }) {
  return (
    <div style={{
      paddingTop: large ? 24 : 18,
      borderTop: '1px solid rgba(255,255,255,0.07)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    }}>
      <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 700, fontSize: large ? 15 : 13 }}>splynt.xyz</span>
      <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>·</span>
      <span style={{ color: 'rgba(255,255,255,0.38)', fontSize: large ? 13 : 11 }}>
        Build your startup, one milestone at a time
      </span>
    </div>
  )
}

// ── card layouts ──────────────────────────────────────────────────────────────

export const StatsCard = forwardRef<HTMLDivElement, Props>(
  function StatsCard({ project, checkins, profile, format }, ref) {
    const score         = computeMomentumScore(project, checkins)
    const streak        = computeStreak(checkins)
    const tier          = getTier(score)
    const allTasks      = project.roadmap.flatMap((m) => m.tasks ?? [])
    const completedT    = allTasks.filter((t) => t.status === 'completed').length
    const completedMs   = project.roadmap.filter((m) => m.status === 'completed').length
    const progress      = project.roadmap.length ? Math.round((completedMs / project.roadmap.length) * 100) : 0
    const currentMs     = project.roadmap.find((m) => m.status === 'in_progress') ?? project.roadmap.find((m) => m.status === 'pending')

    const displayName   = profile?.first_name ? `${profile.first_name} ${profile.last_name ?? ''}`.trim() : profile?.nickname ?? 'Founder'
    const initials      = displayName.split(' ').map((n) => n[0] ?? '').join('').slice(0, 2).toUpperCase()
    const avatarGrad    = GRADIENT_CSS[profile?.avatar_gradient ?? ''] ?? 'linear-gradient(135deg, #8b5cf6, #6366f1)'
    const accent        = TIER_ACCENT[tier.label] ?? '#7c3aed'
    const { w, h }      = CARD_DIMS[format]

    const stats = [
      { value: String(score),                           label: 'Momentum',   sub: tier.label },
      { value: streak > 0 ? `${streak}d` : '—',        label: 'Streak',     sub: streak > 0 ? 'active 🔥' : 'start today' },
      { value: `${completedT}/${allTasks.length}`,      label: 'Tasks',      sub: 'completed' },
      { value: `${completedMs}/${project.roadmap.length}`, label: 'Milestones', sub: 'done' },
    ]

    const base: React.CSSProperties = {
      width: w, height: h,
      background: 'linear-gradient(145deg, #070810 0%, #110d26 55%, #080b18 100%)',
      fontFamily: '"Space Grotesk", "Inter", ui-sans-serif, system-ui, sans-serif',
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden', flexShrink: 0,
    }

    // ── Square ────────────────────────────────────────────────────────────────
    if (format === 'square') {
      return (
        <div ref={ref} style={{ ...base, padding: '36px 36px 28px' }}>
          <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: `radial-gradient(circle, ${accent}40 0%, transparent 70%)`, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -60, left: -60, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            <Logo />
            <TierBadge label={tier.label} accent={accent} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 24, gap: 6, position: 'relative' }}>
            <Avatar gradient={avatarGrad} initials={initials} size={68} />
            <span style={{ color: 'white', fontWeight: 700, fontSize: 19, marginTop: 4 }}>{displayName}</span>
            <div style={{ padding: '3px 14px', borderRadius: 100, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 500 }}>{project.name}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 22, position: 'relative' }}>
            {stats.map((s) => <StatCell key={s.label} {...s} />)}
          </div>

          <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 7, position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>{currentMs ? currentMs.title : 'All milestones complete!'}</span>
              <span style={{ color: 'white', fontSize: 11, fontWeight: 700 }}>{progress}%</span>
            </div>
            <ProgressBar progress={progress} accent={accent} />
          </div>

          <div style={{ marginTop: 'auto', position: 'relative' }}>
            <Footer />
          </div>
        </div>
      )
    }

    // ── Portrait ──────────────────────────────────────────────────────────────
    if (format === 'portrait') {
      const topMilestones = project.roadmap.slice(0, 3)

      return (
        <div ref={ref} style={{ ...base, padding: '40px 40px 32px' }}>
          <div style={{ position: 'absolute', top: -100, right: -100, width: 380, height: 380, borderRadius: '50%', background: `radial-gradient(circle, ${accent}38 0%, transparent 70%)`, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -80, left: -80, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            <Logo size={28} />
            <TierBadge label={tier.label} accent={accent} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 32, gap: 8, position: 'relative' }}>
            <Avatar gradient={avatarGrad} initials={initials} size={80} />
            <span style={{ color: 'white', fontWeight: 700, fontSize: 22, marginTop: 6 }}>{displayName}</span>
            <div style={{ padding: '4px 16px', borderRadius: 100, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 500 }}>{project.name}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 28, position: 'relative' }}>
            {stats.map((s) => <StatCell key={s.label} {...s} large />)}
          </div>

          {/* Milestone list */}
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>Roadmap</span>
            {topMilestones.map((m) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: 4, flexShrink: 0,
                  background: m.status === 'completed' ? accent : m.status === 'in_progress' ? '#facc15' : 'rgba(255,255,255,0.15)',
                }} />
                <span style={{
                  color: m.status === 'completed' ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.85)',
                  fontSize: 12, fontWeight: 500,
                  textDecoration: m.status === 'completed' ? 'line-through' : 'none',
                }}>{m.title}</span>
                <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.25)', fontSize: 10 }}>{m.timeframe}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>{currentMs ? currentMs.title : 'All milestones done!'}</span>
              <span style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>{progress}%</span>
            </div>
            <ProgressBar progress={progress} accent={accent} />
          </div>

          <div style={{ marginTop: 'auto', position: 'relative' }}>
            <Footer />
          </div>
        </div>
      )
    }

    // ── Stories (9:16) — stats only, no roadmap list ─────────────────────────
    const weeklyCheckins = checkins.filter(
      (c) => new Date(c.created_at).getTime() > Date.now() - 7 * 86400000
    ).length

    return (
      <div ref={ref} style={{ ...base, padding: '52px 44px 48px' }}>
        {/* Glows */}
        <div style={{ position: 'absolute', top: -140, right: -140, width: 520, height: 520, borderRadius: '50%', background: `radial-gradient(circle, ${accent}30 0%, transparent 65%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -120, left: -120, width: 440, height: 440, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 68%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '42%', left: '50%', width: 540, height: 540, borderRadius: '50%', transform: 'translate(-50%,-50%)', background: `radial-gradient(circle, ${accent}0d 0%, transparent 60%)`, pointerEvents: 'none' }} />

        {/* Header — logo + domain on two lines, centered */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, position: 'relative' }}>
          <Logo size={32} />
          <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 500, letterSpacing: '0.04em' }}>
            splynt.xyz
          </span>
        </div>

        {/* User */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 56, gap: 10, position: 'relative' }}>
          <Avatar gradient={avatarGrad} initials={initials} size={92} />
          <span style={{ color: 'white', fontWeight: 700, fontSize: 28, marginTop: 8, letterSpacing: '-0.02em' }}>
            {displayName}
          </span>
          <div style={{ padding: '5px 20px', borderRadius: 100, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.11)' }}>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 500 }}>{project.name}</span>
          </div>
        </div>

        {/* Hero score */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 52, gap: 6, position: 'relative' }}>
          <span style={{ color: accent, fontWeight: 700, fontSize: 80, lineHeight: 1, letterSpacing: '-0.04em' }}>
            {score}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, fontWeight: 500 }}>Momentum Score</span>
          <div style={{
            padding: '6px 18px', borderRadius: 100, marginTop: 4,
            border: `1px solid ${accent}55`, background: `${accent}1a`,
            color: accent, fontSize: 12, fontWeight: 600, letterSpacing: '0.07em',
            textTransform: 'uppercase' as const,
          }}>
            {tier.label}
          </div>
        </div>

        {/* Stats 2 × 2 */}
        <div style={{ display: 'flex', gap: 12, marginTop: 52, position: 'relative' }}>
          <StatCell value={streak > 0 ? `${streak}d` : '—'} label="Streak"     sub={streak > 0 ? 'active 🔥' : 'start today'} large />
          <StatCell value={`${completedT}/${allTasks.length}`}           label="Tasks"      sub="completed"   large />
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 12, position: 'relative' }}>
          <StatCell value={`${completedMs}/${project.roadmap.length}`}   label="Milestones" sub="done"        large />
          <StatCell value={String(weeklyCheckins)}                        label="Check-ins"  sub="this week"   large />
        </div>

        {/* Spacer + footer */}
        <div style={{ marginTop: 'auto', paddingTop: 40, position: 'relative' }}>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'white', fontWeight: 700, fontSize: 18, letterSpacing: '-0.01em' }}>
              splynt.xyz
            </span>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
              Build your startup, one milestone at a time
            </span>
          </div>
        </div>
      </div>
    )
  }
)
