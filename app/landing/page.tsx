import { Navbar } from '@/app/components/landing/Navbar'
import { HeroSection } from '@/app/components/landing/HeroSection'
import { HowItWorksSection } from '@/app/components/landing/HowItWorksSection'
import { FeaturesSection } from '@/app/components/landing/FeaturesSection'
import { CtaSection } from '@/app/components/landing/CtaSection'
import { Footer } from '@/app/components/landing/Footer'

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
