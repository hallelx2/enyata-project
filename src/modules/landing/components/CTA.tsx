import Link from "next/link";

export function CTA() {
  return (
    <section className="py-24">
      <div className="max-w-5xl mx-auto px-6">
        <div className="aura-gradient-bg rounded-xl p-12 md:p-20 text-center text-on-primary relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <span className="material-symbols-outlined text-[300px] absolute -top-24 -left-24">
              health_metrics
            </span>
            <span className="material-symbols-outlined text-[300px] absolute -bottom-24 -right-24">
              credit_card
            </span>
          </div>
          <div className="relative z-10">
            <h2 className="font-headline text-4xl md:text-6xl font-extrabold mb-8 tracking-tighter">
              Your Health Shouldn&apos;t <br />
              Have a Waiting Room.
            </h2>
            <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto mb-12">
              Join thousands of patients and leading hospitals using AuraHealth
              to prioritize life over logistics.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <Link
                href="/signup"
                className="bg-white text-primary px-10 py-5 rounded-xl font-bold text-xl hover:shadow-2xl transition-all hover:-translate-y-1"
              >
                Get Protected Now
              </Link>
              <Link
                href="/signup"
                className="bg-transparent border-2 border-white/30 text-white px-10 py-5 rounded-xl font-bold text-xl hover:bg-white/10 transition-all"
              >
                Request Demo
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
