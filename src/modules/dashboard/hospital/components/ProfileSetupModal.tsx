"use client";

import { useEffect, useState, useTransition } from "react";
import { updateHospitalProfile, upsertHospitalResource } from "@/modules/hospital/actions";

interface ProfileSetupModalProps {
  hospitalId: string;
  hospitalName: string;
  /** Show the modal if the hospital has no profile yet */
  needsSetup: boolean;
}

const RESOURCE_TEMPLATES = [
  { name: "General Bed", category: "ward", totalCount: 20, availableCount: 20, priceNaira: 15000, unit: "per night" },
  { name: "ICU Bed", category: "icu", totalCount: 5, availableCount: 5, priceNaira: 80000, unit: "per night" },
  { name: "Emergency Bed", category: "emergency", totalCount: 8, availableCount: 8, priceNaira: 25000, unit: "per night" },
];

export function ProfileSetupModal({ hospitalId, hospitalName, needsSetup }: ProfileSetupModalProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [isPending, startTransition] = useTransition();

  // Profile fields
  const [description, setDescription] = useState("");
  const [specialties, setSpecialties] = useState("");
  const [address, setAddress] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [bedCount, setBedCount] = useState("20");
  const [icuCount, setIcuCount] = useState("5");

  // Resources
  const [resources, setResources] = useState(RESOURCE_TEMPLATES);

  useEffect(() => {
    if (needsSetup) setOpen(true);
  }, [needsSetup]);

  const handleProfileSave = () => {
    startTransition(async () => {
      await updateHospitalProfile(hospitalId, {
        description,
        specialties,
        address,
        emergencyPhone,
        bedCount: Number(bedCount) || 0,
        icuCount: Number(icuCount) || 0,
      });
      setStep(2);
    });
  };

  const handleResourcesSave = () => {
    startTransition(async () => {
      for (const r of resources) {
        await upsertHospitalResource(hospitalId, r);
      }
      setOpen(false);
    });
  };

  const updateResource = (i: number, field: string, value: string | number) => {
    setResources((prev) => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="aura-gradient-bg px-8 py-6 text-white">
          <div className="flex items-center gap-3 mb-1">
            <span className="material-symbols-outlined text-2xl">local_hospital</span>
            <span className="font-headline text-lg font-bold">Welcome to AuraHealth</span>
          </div>
          <h2 className="font-headline text-2xl font-extrabold">Set up {hospitalName}</h2>
          <p className="text-white/80 text-sm mt-1">
            {step === 1
              ? "Tell Aura about your hospital so patients get routed correctly"
              : "Add your resources and pricing so the AI can pre-authorize the right amount"}
          </p>
          {/* Step dots */}
          <div className="flex gap-2 mt-4">
            <div className={`h-1.5 rounded-full transition-all ${step === 1 ? "w-8 bg-white" : "w-4 bg-white/40"}`} />
            <div className={`h-1.5 rounded-full transition-all ${step === 2 ? "w-8 bg-white" : "w-4 bg-white/40"}`} />
          </div>
        </div>

        {/* Step 1 — Hospital Profile */}
        {step === 1 && (
          <div className="px-8 py-6 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. A tertiary hospital specialising in cardiology and trauma care in Lagos..."
                rows={3}
                className="w-full bg-surface-container-high rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Specialties</label>
              <input
                value={specialties}
                onChange={(e) => setSpecialties(e.target.value)}
                placeholder="e.g. Cardiology, Trauma, Paediatrics, Oncology"
                className="w-full bg-surface-container-high rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Address</label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 45 Marina Road, Lagos Island"
                className="w-full bg-surface-container-high rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Emergency Phone</label>
                <input
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  placeholder="+234..."
                  className="w-full bg-surface-container-high rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Total Beds</label>
                <input
                  type="number"
                  value={bedCount}
                  onChange={(e) => setBedCount(e.target.value)}
                  className="w-full bg-surface-container-high rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">ICU Beds</label>
              <input
                type="number"
                value={icuCount}
                onChange={(e) => setIcuCount(e.target.value)}
                className="w-full bg-surface-container-high rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        )}

        {/* Step 2 — Resources */}
        {step === 2 && (
          <div className="px-8 py-6 space-y-4 max-h-[60vh] overflow-y-auto">
            <p className="text-xs text-on-surface-variant">
              These are seeded with typical Nigerian hospital rates. Adjust the counts and prices for your facility — Aura will use them when quoting care costs.
            </p>
            {resources.map((r, i) => (
              <div key={r.name} className="bg-surface-container-low rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-sm text-on-surface">{r.name}</p>
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase">{r.category}</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-1">Total</label>
                    <input
                      type="number"
                      value={r.totalCount}
                      onChange={(e) => updateResource(i, "totalCount", Number(e.target.value))}
                      className="w-full bg-white rounded-lg px-3 py-2 text-sm border border-outline-variant/20 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-1">Available</label>
                    <input
                      type="number"
                      value={r.availableCount}
                      onChange={(e) => updateResource(i, "availableCount", Number(e.target.value))}
                      className="w-full bg-white rounded-lg px-3 py-2 text-sm border border-outline-variant/20 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-1">Price (₦)</label>
                    <input
                      type="number"
                      value={r.priceNaira}
                      onChange={(e) => updateResource(i, "priceNaira", Number(e.target.value))}
                      className="w-full bg-white rounded-lg px-3 py-2 text-sm border border-outline-variant/20 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="px-8 py-5 bg-surface-container-low flex items-center justify-between gap-4 border-t border-outline-variant/10">
          {step === 1 ? (
            <>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-sm text-on-surface-variant hover:text-on-surface transition-colors"
              >
                Skip for now
              </button>
              <button
                type="button"
                onClick={handleProfileSave}
                disabled={isPending || !description.trim()}
                className="px-6 py-3 aura-gradient-bg text-white font-bold rounded-xl disabled:opacity-50 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {isPending ? "Saving..." : "Next — Resources"}
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-sm text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                Back
              </button>
              <button
                type="button"
                onClick={handleResourcesSave}
                disabled={isPending}
                className="px-6 py-3 aura-gradient-bg text-white font-bold rounded-xl disabled:opacity-50 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {isPending ? "Saving..." : "Finish Setup"}
                <span className="material-symbols-outlined text-lg">check_circle</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
