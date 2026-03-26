import Image from "next/image";

export function HowItWorks() {
  return (
    <section className="py-24 bg-surface-container-low">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16 md:mb-24 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="max-w-xl">
            <h2 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
              Frictionless Journey
            </h2>
            <p className="text-on-surface-variant text-lg">
              We&apos;ve removed the bottleneck of financial clearance in
              emergency rooms. Here is how we ensure your treatment starts in
              seconds, not hours.
            </p>
          </div>
          <div className="hidden md:block pb-2">
            <span className="material-symbols-outlined text-primary text-6xl">
              emergency_share
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-7 bg-surface-container-lowest p-10 rounded-xl group hover:shadow-xl transition-all duration-500">
            <div className="flex flex-col h-full justify-between">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-primary-fixed flex items-center justify-center text-primary mb-8 group-hover:scale-110 transition-transform">
                  <span
                    className="material-symbols-outlined text-3xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    mic
                  </span>
                </div>
                <h3 className="font-headline text-3xl font-bold mb-4">
                  1. Voice Triage
                </h3>
                <p className="text-on-surface-variant text-lg leading-relaxed max-w-lg">
                  Speak naturally to our AI as you&apos;re en route. Aura
                  predicts the medical pathway and severity before you even
                  reach the doors.
                </p>
              </div>
              <div className="mt-12 rounded-lg overflow-hidden h-48 relative">
                <Image
                  alt="Close-up of a high-tech digital waveform interface representing voice analysis and AI diagnostics with blue glowing elements"
                  className="w-full h-full object-cover grayscale opacity-20 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuB-ORls3fmbB2dOxXYHkHiHmFqZ0gu22kSRSNnAsMfSDMm86YmlA5_nOr_f7eBxrT4p_UYknHILCteJxYXSl7i_75TpzTVpFQazuxtU1bctmzKTbgiLkA7IQSGkc0gvfny1095MjzcAAO5amTKmGCTgnnjK4g8yQ-E3O-pe8q_qgC7hGDKytCVhOMwfdqAstQ_Pr--4-XfShJBFMhfyjb5ZOO9XtZel5ngVfKQKWLH_NSMPoSz-cfrgBBrMUioWYh8EWCkbiCXfAbFq"
                  fill
                  unoptimized
                  priority
                />
              </div>
            </div>
          </div>
          <div className="md:col-span-5 bg-primary text-on-primary p-10 rounded-xl relative overflow-hidden group">
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white mb-8">
                <span
                  className="material-symbols-outlined text-3xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  account_balance_wallet
                </span>
              </div>
              <h3 className="font-headline text-3xl font-bold mb-4">
                2. Dynamic Escrow
              </h3>
              <p className="text-white/80 text-lg leading-relaxed">
                Funds are instantly secured via Interswitch. The hospital sees a
                &quot;Guaranteed&quot; status, eliminating the need for
                down-payments.
              </p>
            </div>
            <div className="absolute bottom-[-10%] right-[-10%] opacity-10 group-hover:scale-110 transition-transform duration-700">
              <span className="material-symbols-outlined text-[200px]">
                lock
              </span>
            </div>
          </div>
          <div className="md:col-span-5 bg-surface-container-highest p-10 rounded-xl group">
            <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center text-white mb-8">
              <span
                className="material-symbols-outlined text-3xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                patient_list
              </span>
            </div>
            <h3 className="font-headline text-3xl font-bold mb-4 text-on-surface">
              3. Instant Admission
            </h3>
            <p className="text-on-surface-variant text-lg leading-relaxed">
              Bypass the billing desk. Proceed directly to treatment as your
              digital token unlocks your priority admission status.
            </p>
          </div>
          <div className="md:col-span-7 bg-surface-container-lowest p-10 rounded-xl flex flex-col md:flex-row gap-8 items-center group">
            <div className="flex-1">
              <div className="w-14 h-14 rounded-2xl bg-surface-container-high flex items-center justify-center text-on-primary-fixed-variant mb-8">
                <span className="material-symbols-outlined text-3xl">
                  currency_exchange
                </span>
              </div>
              <h3 className="font-headline text-3xl font-bold mb-4">
                4. Smart Refund
              </h3>
              <p className="text-on-surface-variant text-lg leading-relaxed">
                Billing happens post-care. We calculate exactly what you used
                and the escrow releases the rest back to you immediately.
              </p>
            </div>
            <div className="w-full md:w-64 aspect-square rounded-full aura-gradient-bg flex items-center justify-center p-8 group-hover:rotate-12 transition-transform duration-700 shadow-xl shadow-primary/20">
              <span className="material-symbols-outlined text-7xl text-white">
                published_with_changes
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
