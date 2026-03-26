import Image from "next/image";

export function TrustSecurity() {
  return (
    <section className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center gap-16">
          <div className="w-full md:w-1/2">
            <h2 className="font-headline text-4xl font-extrabold mb-8">
              Bank-Grade Peace of Mind
            </h2>
            <p className="text-on-surface-variant text-lg mb-12 leading-relaxed">
              Security isn&apos;t an afterthought; it&apos;s our foundation. We
              bridge the gap between finance and healthcare with rigorous
              encryption standards.
            </p>
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="mt-1 w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                  <span
                    className="material-symbols-outlined text-sm"
                    style={{ fontVariationSettings: "'wght' 700" }}
                  >
                    check
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-on-surface mb-1">
                    Interswitch Partnership
                  </h4>
                  <p className="text-sm text-on-surface-variant">
                    Industry-leading escrow and payment settlements powered by
                    Africa&apos;s most trusted payment gateway.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="mt-1 w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                  <span
                    className="material-symbols-outlined text-sm"
                    style={{ fontVariationSettings: "'wght' 700" }}
                  >
                    check
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-on-surface mb-1">
                    EMR Integration
                  </h4>
                  <p className="text-sm text-on-surface-variant">
                    Deep interoperability with hospital Electronic Medical
                    Records ensures your data moves safely with you.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="mt-1 w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                  <span
                    className="material-symbols-outlined text-sm"
                    style={{ fontVariationSettings: "'wght' 700" }}
                  >
                    check
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-on-surface mb-1">
                    256-bit Encryption
                  </h4>
                  <p className="text-sm text-on-surface-variant">
                    Every interaction, from voice triage to financial hold, is
                    wrapped in clinical-grade security protocols.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full md:w-1/2 grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="bg-surface-container-low h-48 rounded-xl flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-5xl text-primary/30"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  shield_lock
                </span>
              </div>
              <div className="bg-surface-container-highest h-64 rounded-xl overflow-hidden relative">
                <Image
                  alt="Digital representation of secure network with glowing blue connection points and abstract technology lines"
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDr-GECwzoZNVJ95Q2HjnLzHpKkHY91j5Rc-ld0Nm7inwjOH9rJLkWVTJ_00D-yj57MAvdsOqJZe8Fo5cmefKLXSUVDdXvcWoVSZN_wG_XeK7K0LaA7s_vhh6c1jNVIOTLp7164VpHsfRvi9AHGCFXLa75jomxbvpkEBBIQ5p8VOn8mF9lLAHgee99hseKAZ2y2-lh8y-j0UoXh7Zy2qUijq1-2TObmM4ryhImCSbvohQsHhT4xBw8Bo4J0WYAtzASr98wNBrjpuOOC"
                  fill
                  unoptimized
                />
              </div>
            </div>
            <div className="space-y-4 pt-8">
              <div className="bg-surface-container-highest h-64 rounded-xl overflow-hidden relative">
                <Image
                  alt="Abstract 3D blocks and digital architecture representing secure data storage and transaction ledger technology"
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDnC4nObt3nBo-ZiSWQKRKHpnl5UMbmGj8HVyoZSa1Isw1vII4Q1R7pswLjBJuRowiFfhIjeB6nJ6LZrJD9FTCOaApJrh8k4xgP6XptBcrZgTkq8N0xcnah6zEdDVwH6fTQ2oZ8t2qwv22d3g78R5JwSdUxnBs8hvxldmgLcPObf8Y11siMDEqJ45g_WrJfi1_PTgFLkqiJXqr485JDPx3M_Oi7VoqX5NH5eiTzXKT9F1icjab7fdriooCDNNkVbJhaUq7_jwT_SUrN"
                  fill
                  unoptimized
                />
              </div>
              <div className="bg-surface-container-low h-48 rounded-xl flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-5xl text-secondary/30"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  verified_user
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
