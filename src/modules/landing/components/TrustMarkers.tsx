export function TrustMarkers() {
  return (
    <section className="py-24 px-8 border-t border-outline-variant/30">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
        <div className="flex flex-col gap-6 max-w-md">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold tracking-[0.2em] text-on-surface-variant uppercase">
              Powered by
            </span>
            <div className="h-[1px] w-12 bg-outline-variant"></div>
          </div>
          <div className="flex items-center gap-2 opacity-60">
            <div className="w-8 h-8 rounded bg-red-600 flex items-center justify-center text-white font-black text-xs">
              IS
            </div>
            <span className="text-xl font-bold tracking-tight text-on-surface">
              Interswitch
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
          <div className="text-center md:text-left">
            <div className="text-3xl font-bold font-headline mb-1">₦1.2B+</div>
            <div className="text-sm text-on-surface-variant font-medium">
              Escrow Protected
            </div>
          </div>
          <div className="text-center md:text-left">
            <div className="text-3xl font-bold font-headline mb-1">120+</div>
            <div className="text-sm text-on-surface-variant font-medium">
              Partner Hospitals
            </div>
          </div>
          <div className="text-center md:text-left col-span-2 md:col-span-1">
            <div className="text-3xl font-bold font-headline mb-1">0ms</div>
            <div className="text-sm text-on-surface-variant font-medium">
              Bypass Delay
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
