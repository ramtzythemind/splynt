import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service — Splynt',
  description: 'Read the Splynt Terms of Service.',
}

const EFFECTIVE_DATE = 'June 25, 2025'

export default function TermsPage() {
  return (
    <div>
      {/* Header */}
      <section className="relative w-full overflow-hidden border-b border-border/60 px-4 py-16 text-center">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-background to-accent/20" />
        <div className="mx-auto max-w-2xl">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">Legal</p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Terms of Service</h1>
          <p className="mt-4 text-muted-foreground">Effective date: {EFFECTIVE_DATE}</p>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        <div className="space-y-12">

          <Section title="1. Acceptance of Terms">
            <p>
              By accessing or using Splynt (&ldquo;the Service&rdquo;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service. These terms apply to all visitors, users, and others who access the Service.
            </p>
          </Section>

          <Section title="2. Description of Service">
            <p>
              Splynt is an AI-powered product-building platform designed to help early-stage founders structure their startup journey through AI-generated roadmaps, daily check-ins, momentum tracking, and a personal AI advisor.
            </p>
            <p className="mt-4">
              The Service is currently in <span className="font-semibold text-foreground">closed beta</span>. Access is limited and granted by invitation only. Features, availability, and pricing are subject to change without notice.
            </p>
          </Section>

          <Section title="3. User Accounts">
            <p>To use the Service you must create an account. You agree to:</p>
            <ul className="mt-3 space-y-2 pl-4">
              <Li>Provide accurate, current, and complete information during registration.</Li>
              <Li>Maintain the security of your password and accept responsibility for all activity under your account.</Li>
              <Li>Notify us immediately at <a href="mailto:support@splynt.xyz" className="text-primary hover:underline">support@splynt.xyz</a> of any unauthorised use of your account.</Li>
              <Li>Not share your account credentials or beta invite with any third party.</Li>
            </ul>
          </Section>

          <Section title="4. Acceptable Use">
            <p>You agree not to use the Service to:</p>
            <ul className="mt-3 space-y-2 pl-4">
              <Li>Violate any applicable law or regulation.</Li>
              <Li>Upload or transmit viruses, malware, or any harmful code.</Li>
              <Li>Attempt to gain unauthorised access to any part of the Service or its related systems.</Li>
              <Li>Scrape, copy, or redistribute content from the Service without permission.</Li>
              <Li>Use the AI features to generate content that is illegal, harmful, or deceptive.</Li>
              <Li>Reverse-engineer, decompile, or disassemble any part of the Service.</Li>
            </ul>
          </Section>

          <Section title="5. Intellectual Property">
            <p>
              All content, features, and functionality of the Service — including but not limited to text, graphics, logos, and software — are owned by Splynt and are protected by applicable intellectual property laws.
            </p>
            <p className="mt-4">
              You retain ownership of any content you submit to the Service (project descriptions, check-ins, notes). By submitting content, you grant Splynt a limited, non-exclusive licence to use that content solely to provide and improve the Service.
            </p>
          </Section>

          <Section title="6. AI-Generated Content">
            <p>
              Splynt uses third-party AI models to generate roadmaps, advice, and other content. AI-generated content is provided for informational purposes only and does not constitute professional business, legal, or financial advice. You are solely responsible for any decisions made based on AI-generated output.
            </p>
          </Section>

          <Section title="7. Beta Disclaimer">
            <p>
              The Service is provided in beta form. It may contain bugs, be interrupted, or change substantially. We do not guarantee that the Service will be available at any specific time or that any data stored will be preserved. <span className="font-semibold text-foreground">Use the beta at your own risk.</span>
            </p>
          </Section>

          <Section title="8. Termination">
            <p>
              We reserve the right to suspend or terminate your account at any time, with or without cause, including if we believe you have violated these Terms. You may delete your account at any time from your account settings.
            </p>
          </Section>

          <Section title="9. Limitation of Liability">
            <p>
              To the fullest extent permitted by law, Splynt and its founders, employees, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the Service. In no event shall our total liability exceed the amount you paid to us in the twelve months preceding the claim.
            </p>
          </Section>

          <Section title="10. Changes to These Terms">
            <p>
              We may update these Terms from time to time. We will notify you of material changes via email or a notice within the Service. Continued use of the Service after changes take effect constitutes acceptance of the revised Terms.
            </p>
          </Section>

          <Section title="11. Governing Law">
            <p>
              These Terms are governed by and construed in accordance with the laws of Italy, without regard to its conflict of law provisions.
            </p>
          </Section>

          <Section title="12. Contact">
            <p>
              Questions about these Terms? Reach us at{' '}
              <a href="mailto:support@splynt.xyz" className="text-primary hover:underline">support@splynt.xyz</a>.
            </p>
          </Section>

        </div>

        {/* Bottom nav */}
        <div className="mt-16 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/60 pt-8 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">← Back to home</Link>
          <Link href="/legal/privacy" className="hover:text-foreground transition-colors">Privacy Policy →</Link>
        </div>
      </section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold tracking-tight">{title}</h2>
      <div className="text-sm leading-relaxed text-muted-foreground">{children}</div>
    </div>
  )
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
      <span>{children}</span>
    </li>
  )
}
