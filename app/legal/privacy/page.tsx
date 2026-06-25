import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy — Splynt',
  description: 'Read the Splynt Privacy Policy.',
}

const EFFECTIVE_DATE = 'June 25, 2025'

export default function PrivacyPage() {
  return (
    <div>
      {/* Header */}
      <section className="relative w-full overflow-hidden border-b border-border/60 px-4 py-16 text-center">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-background to-accent/20" />
        <div className="mx-auto max-w-2xl">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">Legal</p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Privacy Policy</h1>
          <p className="mt-4 text-muted-foreground">Effective date: {EFFECTIVE_DATE}</p>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        <div className="space-y-12">

          <Section title="1. Who We Are">
            <p>
              Splynt (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is an AI-powered startup product-building platform. This Privacy Policy explains how we collect, use, and protect your personal information when you use our Service at{' '}
              <span className="font-medium text-foreground">splynt.app</span>.
            </p>
          </Section>

          <Section title="2. Information We Collect">
            <p className="font-medium text-foreground">Information you provide directly:</p>
            <ul className="mt-3 space-y-2 pl-4">
              <Li>Name and email address when you create an account or join the waitlist.</Li>
              <Li>Your X (Twitter) or GitHub handle when submitting a waitlist request.</Li>
              <Li>Project details, roadmap content, daily check-ins, and notes you create within the Service.</Li>
              <Li>Messages sent to the AI advisor.</Li>
            </ul>
            <p className="mt-6 font-medium text-foreground">Information collected automatically:</p>
            <ul className="mt-3 space-y-2 pl-4">
              <Li>Usage data such as pages visited, features used, and actions taken within the Service.</Li>
              <Li>Device information including browser type, operating system, and IP address.</Li>
              <Li>Cookies and similar tracking technologies (see Section 6).</Li>
            </ul>
            <p className="mt-6 font-medium text-foreground">Information from third parties:</p>
            <ul className="mt-3 space-y-2 pl-4">
              <Li>If you sign in with Google, we receive your name, email address, and profile picture from Google.</Li>
            </ul>
          </Section>

          <Section title="3. How We Use Your Information">
            <p>We use your information to:</p>
            <ul className="mt-3 space-y-2 pl-4">
              <Li>Provide, operate, and maintain the Service.</Li>
              <Li>Generate AI-powered roadmaps and advice personalised to your project.</Li>
              <Li>Send you account-related emails such as invite confirmations and important updates.</Li>
              <Li>Monitor and analyse usage trends to improve the Service.</Li>
              <Li>Detect, prevent, and respond to fraud, abuse, or security incidents.</Li>
              <Li>Comply with legal obligations.</Li>
            </ul>
            <p className="mt-4">
              We do <span className="font-semibold text-foreground">not</span> sell your personal data to third parties.
            </p>
          </Section>

          <Section title="4. How We Share Your Information">
            <p>We may share your information with:</p>
            <ul className="mt-3 space-y-2 pl-4">
              <Li><span className="font-medium text-foreground">Supabase</span> — our database and authentication provider, used to store your account and project data securely.</Li>
              <Li><span className="font-medium text-foreground">Groq (Groq API)</span> — AI model provider used to generate roadmap and advisor content. Your project context is sent to generate responses.</Li>
              <Li><span className="font-medium text-foreground">Vercel</span> — our hosting provider, which processes request data as part of serving the application.</Li>
              <Li>Law enforcement or regulators when required by applicable law or to protect our legal rights.</Li>
            </ul>
            <p className="mt-4">
              All sub-processors are bound by data processing agreements and appropriate safeguards.
            </p>
          </Section>

          <Section title="5. Data Security">
            <p>
              We implement industry-standard security measures including encrypted connections (TLS), secure authentication via Supabase, and Row-Level Security policies to ensure your data is accessible only to you.
            </p>
            <p className="mt-4">
              However, no method of transmission over the internet or electronic storage is 100% secure. We cannot guarantee absolute security.
            </p>
          </Section>

          <Section title="6. Cookies">
            <p>
              We use cookies and similar technologies to maintain your session and remember your preferences (such as light/dark theme). We do not use third-party advertising cookies.
            </p>
            <p className="mt-4">
              You can control cookies through your browser settings. Disabling cookies may affect the functionality of the Service.
            </p>
          </Section>

          <Section title="7. Your Rights">
            <p>Depending on your location, you may have the right to:</p>
            <ul className="mt-3 space-y-2 pl-4">
              <Li>Access the personal data we hold about you.</Li>
              <Li>Request correction of inaccurate data.</Li>
              <Li>Request deletion of your account and associated data.</Li>
              <Li>Object to or restrict certain processing of your data.</Li>
              <Li>Data portability — receive a copy of your data in a structured format.</Li>
            </ul>
            <p className="mt-4">
              To exercise any of these rights, contact us at{' '}
              <a href="mailto:hello@splynt.app" className="text-primary hover:underline">hello@splynt.app</a>. We will respond within 30 days.
            </p>
          </Section>

          <Section title="8. Data Retention">
            <p>
              We retain your data for as long as your account is active or as needed to provide the Service. If you delete your account, we will delete or anonymise your personal data within 30 days, unless we are required by law to retain it longer.
            </p>
          </Section>

          <Section title="9. Children's Privacy">
            <p>
              The Service is not directed to individuals under the age of 16. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us and we will delete it promptly.
            </p>
          </Section>

          <Section title="10. International Transfers">
            <p>
              Your information may be transferred to and processed in countries other than your own. Our sub-processors (Supabase, Vercel, Google) operate under appropriate legal frameworks for international data transfers, including Standard Contractual Clauses where applicable.
            </p>
          </Section>

          <Section title="11. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes via email or a prominent notice within the Service. The &ldquo;Effective date&rdquo; at the top will always reflect the most recent revision.
            </p>
          </Section>

          <Section title="12. Contact">
            <p>
              For privacy-related questions or requests, contact us at:{' '}
              <a href="mailto:support@splynt.xyz" className="text-primary hover:underline">support@splynt.xyz</a>.
            </p>
          </Section>

        </div>

        {/* Bottom nav */}
        <div className="mt-16 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/60 pt-8 text-sm text-muted-foreground">
          <Link href="/legal/terms" className="hover:text-foreground transition-colors">← Terms of Service</Link>
          <Link href="/" className="hover:text-foreground transition-colors">Back to home →</Link>
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
