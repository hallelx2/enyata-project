import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-surface font-body text-on-surface min-h-screen flex items-center justify-center p-4 md:p-8">
      <main className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 min-h-[650px] lg:h-[calc(100vh-4rem)] lg:max-h-[850px] bg-surface-container-lowest rounded-2xl overflow-hidden shadow-xl border border-outline-variant/20">
        {/* Left Side: Immersive Visual */}
        <section className="hidden lg:relative lg:flex flex-col justify-end p-12 aura-gradient-bg overflow-hidden">
          {/* Decorative Aura Bleed */}
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-secondary-fixed/20 rounded-full blur-[120px]"></div>
          <Image
            alt="Secure Healthcare Digital Portal"
            className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBS7_-nidVmIMMg8p-6B1xE2AXwlf3NXGVQWMhkLjV12D6FEsxUZ0ezEymWB2y79-5KEzrABsyxqjECvd1jIZHERhyHwHMHdfmYj_PfupPFC0-mspK9IiK_Xb9n7XDfVbAqsQ4Y4I85f732ojNDyHfJofdDKX-q9RUyq2Pvr3yEjJdM0da3MjYGjJA3VEXy0SNVLqQNsGE_Kt43Lj3NEJlyPxrNlOamHHXemVdPFkchg7akRM82BPf-rcLFQW2x1LOnCrKrTDI-gtdY"
            fill
            unoptimized
            priority
          />
          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 glass-effect rounded-full text-primary font-semibold text-sm">
              <span
                className="material-symbols-outlined text-sm"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                verified_user
              </span>
              Clinical-Grade Security
            </div>
            <h1 className="font-headline text-5xl font-extrabold text-white tracking-tighter leading-tight">
              Your Healthcare Journey, <br/>Frictionless &amp; Protected.
            </h1>
            <p className="text-white/80 text-lg max-w-md font-medium leading-relaxed">
              AuraHealth bridges the gap between patient distress and clinical readiness. Our escrow-backed admissions ensure hospitals are paid, and patients are treated instantly.
            </p>
            {/* Vital Glass Widget Concept */}
            <div className="mt-8 p-6 glass-effect rounded-xl border border-white/10 flex items-center gap-4 max-w-xs">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-white">
                  admin_panel_settings
                </span>
              </div>
              <div>
                <div className="text-white text-xs font-bold uppercase tracking-widest opacity-70">
                  Platform Compliance
                </div>
                <div className="text-white font-headline font-bold text-xl">
                  HIPAA &amp; NDPR Active
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right Side: Interaction Canvas */}
        <section className="flex flex-col p-8 md:p-16 lg:p-20 justify-center bg-surface relative z-10">
          <div className="max-w-md w-full mx-auto space-y-10">{children}</div>
        </section>
      </main>

      {/* Global Footer Fragment */}
      <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-7xl px-8 justify-between items-center hidden lg:flex pointer-events-none">
        <p className="text-xs font-medium text-outline-variant pointer-events-auto">
          © 2024 AuraHealth. Secure Payments by Interswitch.
        </p>
        <div className="flex gap-6 pointer-events-auto">
          <Link
            className="text-xs font-bold text-outline-variant hover:text-primary transition-colors"
            href="#"
          >
            Privacy Policy
          </Link>
          <Link
            className="text-xs font-bold text-outline-variant hover:text-primary transition-colors"
            href="#"
          >
            Trust Center
          </Link>
        </div>
      </footer>
    </div>
  );
}
