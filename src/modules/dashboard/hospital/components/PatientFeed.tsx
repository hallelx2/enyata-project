export function PatientFeed() {
  return (
    <section className="lg:col-span-8 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">
            dynamic_feed
          </span>
          Incoming Patients
          <span className="ml-2 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
            3 Alerting
          </span>
        </h2>
      </div>

      {/* Patient Card 1 */}
      <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border-l-4 border-primary flex flex-col md:flex-row gap-6 relative overflow-hidden group hover:shadow-md transition-shadow">
        <div className="absolute top-0 right-0 p-4">
          <span className="bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1">
            <span
              className="material-symbols-outlined text-xs"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              verified_user
            </span>
            Funds Guaranteed via Aura
          </span>
        </div>
        <div className="w-20 h-20 rounded-2xl bg-surface-container flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-4xl text-slate-400">
            person
          </span>
        </div>
        <div className="flex-grow space-y-4">
          <div className="flex flex-col">
            <h3 className="text-xl font-bold text-on-surface">
              Elena Rodriguez{" "}
              <span className="text-slate-400 font-normal ml-2 text-sm">
                #AH-8829-X
              </span>
            </h3>
            <p className="text-sm text-on-surface-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-error">
                warning
              </span>
              ETA: 4 mins • Ambulance Transport
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-surface-container-low p-3 rounded-lg border border-slate-100">
              <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                Preliminary Diagnosis
              </p>
              <p className="font-bold text-on-surface">Heart Attack Symptoms</p>
              <div className="mt-1 w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-primary h-full w-[92%]"></div>
              </div>
              <p className="text-[10px] mt-1 text-primary-fixed-variant">
                High Urgency
              </p>
            </div>
            <div className="bg-surface-container-low p-3 rounded-lg border border-slate-100">
              <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                Required Facilities
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                <span className="px-2 py-0.5 bg-white rounded text-[10px] font-semibold border border-slate-200">
                  Cardiology Unit
                </span>
                <span className="px-2 py-0.5 bg-white rounded text-[10px] font-semibold border border-slate-200">
                  ECG Setup
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button className="bg-primary text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-sm active:scale-95 transition-all">
              Mark as Arrived
            </button>
            <button className="bg-surface-container-high text-primary px-5 py-2.5 rounded-full text-sm font-bold active:scale-95 transition-all">
              View Patient Profile
            </button>
          </div>
        </div>
      </div>

      {/* Patient Card 2 */}
      <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border-l-4 border-slate-200 flex flex-col md:flex-row gap-6 relative overflow-hidden opacity-80 grayscale-[0.3]">
        <div className="absolute top-0 right-0 p-4">
          <span className="bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1">
            <span
              className="material-symbols-outlined text-xs"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              verified_user
            </span>
            Funds Guaranteed via Aura
          </span>
        </div>
        <div className="w-20 h-20 rounded-2xl bg-surface-container flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-4xl text-slate-400">
            person
          </span>
        </div>
        <div className="flex-grow space-y-4">
          <div className="flex flex-col">
            <h3 className="text-xl font-bold text-on-surface">
              Marcus Thorne{" "}
              <span className="text-slate-400 font-normal ml-2 text-sm">
                #AH-1104-Y
              </span>
            </h3>
            <p className="text-sm text-on-surface-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-blue-500">
                info
              </span>
              ETA: 12 mins • Private Vehicle
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-surface-container-low p-3 rounded-lg">
              <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                Preliminary Diagnosis
              </p>
              <p className="font-bold text-on-surface">Severe Dehydration</p>
              <div className="mt-1 w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-400 h-full w-[81%]"></div>
              </div>
            </div>
            <div className="bg-surface-container-low p-3 rounded-lg">
              <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                Required Facilities
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                <span className="px-2 py-0.5 bg-white rounded text-[10px] font-semibold">
                  IV Setup Room
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button className="bg-primary text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-sm active:scale-95 transition-all">
              Mark as Arrived
            </button>
            <button className="bg-surface-container-high text-primary px-5 py-2.5 rounded-full text-sm font-bold active:scale-95 transition-all">
              View Patient Profile
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
