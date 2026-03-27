export function ResourcePanel() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <span className="material-symbols-outlined text-secondary">
          inventory_2
        </span>
        Resource Status
      </h2>

      <div className="glass-widget rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center shadow-sm border border-slate-100">
              <span className="material-symbols-outlined text-primary text-xl">bed</span>
            </div>
            <div>
              <p className="font-bold text-sm">Bed 402 Reserved</p>
              <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">
                Patient: Rodriguez
              </p>
            </div>
          </div>
          <span
            className="material-symbols-outlined text-secondary text-sm"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            check_circle
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center shadow-sm border border-slate-100">
              <span className="material-symbols-outlined text-primary text-xl">biotech</span>
            </div>
            <div>
              <p className="font-bold text-sm">Lab Kit #23 Prepped</p>
              <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">
                Cardiac Panel
              </p>
            </div>
          </div>
          <span
            className="material-symbols-outlined text-secondary text-sm"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            check_circle
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center shadow-sm border border-slate-100">
              <span className="material-symbols-outlined text-primary text-xl">groups</span>
            </div>
            <div>
              <p className="font-bold text-sm">Surgical Team Alerted</p>
              <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">
                On-Call: Team Alpha
              </p>
            </div>
          </div>
          <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
        </div>

        <div className="pt-4 border-t border-slate-200">
          <button
            type="button"
            className="w-full py-3 text-xs font-bold uppercase tracking-widest text-primary bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors"
          >
            Manage Inventory
          </button>
        </div>
      </div>

      {/* Unit Capacity */}
      <div className="bg-surface-container-low rounded-3xl p-6 space-y-4">
        <h3 className="font-bold text-sm uppercase tracking-widest text-slate-500">
          Unit Capacity
        </h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold">ER Bays</span>
              <span className="font-bold">88%</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div className="bg-error h-full w-[88%]" />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold">Ventilators</span>
              <span className="font-bold">4/12</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div className="bg-secondary h-full w-[33%]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
