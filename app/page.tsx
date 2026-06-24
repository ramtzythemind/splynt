import { Navbar } from '@/components/landing/Navbar'
import { HeroSection } from '@/components/landing/HeroSection'
import { HowItWorksSection } from '@/components/landing/HowItWorksSection'
import { FeaturesSection } from '@/components/landing/FeaturesSection'
import { CtaSection } from '@/components/landing/CtaSection'
import { Footer } from '@/components/landing/Footer'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <FeaturesSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  )
}
