import { CTA } from "../components/CTA";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { Hero } from "../components/Hero";
import { HowItWorks } from "../components/HowItWorks";
import { TrustMarkers } from "../components/TrustMarkers";
import { TrustSecurity } from "../components/TrustSecurity";

export function LandingView() {
  return (
    <>
      <Header />
      <main className="relative aura-etheric-gradient">
        {/* Decorative Blurs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/5 ethereal-blur -z-10"></div>
        <div className="absolute top-[20%] right-0 w-[400px] h-[400px] bg-secondary/5 ethereal-blur -z-10"></div>

        <Hero />
        <HowItWorks />
        <TrustSecurity />
        <CTA />
        <TrustMarkers />
      </main>
      <Footer />
    </>
  );
}
