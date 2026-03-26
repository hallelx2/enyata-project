export function Hero() {
  return (
    <section className="pt-52 pb-32 md:pt-64 md:pb-48 px-6">
      <div className="max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container-high border border-outline-variant/50 text-primary text-[11px] font-bold tracking-widest uppercase mb-10">
          <span
            className="material-symbols-outlined text-sm"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            verified
          </span>
          Trust-First Emergency Infrastructure
        </div>
        <h1 className="font-headline text-6xl md:text-8xl lg:text-9xl font-extrabold tracking-[-0.04em] text-on-surface leading-[0.9] mb-12 text-balance">
          Focus on your health. <br />
          <span className="italic font-black text-primary/90">Worry less</span>{" "}
          about the payments.
        </h1>
        <p className="text-on-surface-variant text-lg md:text-2xl max-w-3xl mx-auto mb-16 leading-relaxed font-medium">
          Our AI-driven triage and dynamic escrow system ensures financial
          clearance happens before you reach the hospital doors.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-5">
          <button className="bg-primary text-white px-10 py-5 rounded-full text-lg font-bold hover:shadow-2xl hover:shadow-primary/30 transition-all flex items-center justify-center gap-2 group">
            Get Protected Now
            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </button>
          <button className="bg-white border border-outline-variant text-on-surface px-10 py-5 rounded-full text-lg font-bold hover:bg-surface-container-low transition-all">
            How it Works
          </button>
        </div>
      </div>
    </section>
  );
}
