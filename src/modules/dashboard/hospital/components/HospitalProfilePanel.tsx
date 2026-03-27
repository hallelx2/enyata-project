"use client";

import { useState, useTransition } from "react";
import {
  updateHospitalProfile,
  upsertHospitalResource,
  deleteHospitalResource,
} from "@/modules/hospital/actions";

interface Resource {
  id: string;
  name: string;
  category: string;
  totalCount: number;
  availableCount: number;
  priceNaira: number;
  unit: string;
}

interface Profile {
  description: string | null;
  specialties: string | null;
  address: string | null;
  emergencyPhone: string | null;
  bedCount: number | null;
  icuCount: number | null;
}

interface HospitalProfilePanelProps {
  hospitalId: string;
  initialProfile: Profile | null;
  initialResources: Resource[];
}

const CATEGORY_OPTIONS = ["bed", "equipment", "staff", "medicine", "procedure"] as const;
type Category = (typeof CATEGORY_OPTIONS)[number];

const categoryColors: Record<string, string> = {
  bed: "bg-blue-100 text-blue-700",
  equipment: "bg-purple-100 text-purple-700",
  staff: "bg-green-100 text-green-700",
  medicine: "bg-amber-100 text-amber-700",
  procedure: "bg-rose-100 text-rose-700",
};

export function HospitalProfilePanel({
  hospitalId,
  initialProfile,
  initialResources,
}: HospitalProfilePanelProps) {
  const [isPending, startTransition] = useTransition();

  // Profile form state
  const [description, setDescription] = useState(initialProfile?.description ?? "");
  const [specialties, setSpecialties] = useState(initialProfile?.specialties ?? "");
  const [address, setAddress] = useState(initialProfile?.address ?? "");
  const [emergencyPhone, setEmergencyPhone] = useState(initialProfile?.emergencyPhone ?? "");
  const [bedCount, setBedCount] = useState(String(initialProfile?.bedCount ?? ""));
  const [icuCount, setIcuCount] = useState(String(initialProfile?.icuCount ?? ""));
  const [profileMsg, setProfileMsg] = useState("");

  // Resources state
  const [resources, setResources] = useState<Resource[]>(initialResources);

  // Add resource form state
  const [addName, setAddName] = useState("");
  const [addCategory, setAddCategory] = useState<Category>("bed");
  const [addTotal, setAddTotal] = useState("");
  const [addAvailable, setAddAvailable] = useState("");
  const [addPrice, setAddPrice] = useState("");
  const [addUnit, setAddUnit] = useState("units");
  const [resourceMsg, setResourceMsg] = useState("");

  const handleSaveProfile = () => {
    startTransition(async () => {
      await updateHospitalProfile(hospitalId, {
        description: description || undefined,
        specialties: specialties || undefined,
        address: address || undefined,
        emergencyPhone: emergencyPhone || undefined,
        bedCount: bedCount ? Number(bedCount) : undefined,
        icuCount: icuCount ? Number(icuCount) : undefined,
      });
      setProfileMsg("Profile saved.");
      setTimeout(() => setProfileMsg(""), 3000);
    });
  };

  const handleAddResource = () => {
    if (!addName.trim()) return;
    startTransition(async () => {
      await upsertHospitalResource(hospitalId, {
        name: addName.trim(),
        category: addCategory,
        totalCount: Number(addTotal) || 0,
        availableCount: Number(addAvailable) || 0,
        priceNaira: Number(addPrice) || 0,
        unit: addUnit || "units",
      });
      // Optimistically add to list (page will revalidate)
      const tempId = `temp-${Date.now()}`;
      setResources((prev) => [
        ...prev,
        {
          id: tempId,
          name: addName.trim(),
          category: addCategory,
          totalCount: Number(addTotal) || 0,
          availableCount: Number(addAvailable) || 0,
          priceNaira: Number(addPrice) || 0,
          unit: addUnit || "units",
        },
      ]);
      setAddName("");
      setAddTotal("");
      setAddAvailable("");
      setAddPrice("");
      setAddUnit("units");
      setResourceMsg("Resource added.");
      setTimeout(() => setResourceMsg(""), 3000);
    });
  };

  const handleDeleteResource = (id: string) => {
    startTransition(async () => {
      await deleteHospitalResource(id);
      setResources((prev) => prev.filter((r) => r.id !== id));
    });
  };

  return (
    <div className="space-y-6">
      {/* Hospital Info */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 p-6">
        <h3 className="font-bold text-lg text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">
            local_hospital
          </span>
          Hospital Info
        </h3>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-on-surface-variant block mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Brief description of the hospital..."
            />
          </div>

          <div>
            <label className="text-xs font-bold text-on-surface-variant block mb-1">
              Specialties (comma-separated)
            </label>
            <input
              type="text"
              value={specialties}
              onChange={(e) => setSpecialties(e.target.value)}
              className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Cardiology, Emergency, Pediatrics..."
            />
          </div>

          <div>
            <label className="text-xs font-bold text-on-surface-variant block mb-1">
              Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="12 Hospital Road, Lagos..."
            />
          </div>

          <div>
            <label className="text-xs font-bold text-on-surface-variant block mb-1">
              Emergency Phone
            </label>
            <input
              type="tel"
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
              className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="+234 800 000 0000"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-on-surface-variant block mb-1">
                Total Beds
              </label>
              <input
                type="number"
                min="0"
                value={bedCount}
                onChange={(e) => setBedCount(e.target.value)}
                className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface-variant block mb-1">
                ICU Beds
              </label>
              <input
                type="number"
                min="0"
                value={icuCount}
                onChange={(e) => setIcuCount(e.target.value)}
                className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="0"
              />
            </div>
          </div>

          {profileMsg && (
            <p className="text-xs text-green-700 font-semibold">{profileMsg}</p>
          )}

          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={isPending}
            className="w-full py-3 aura-gradient-bg text-white font-bold rounded-xl disabled:opacity-50 hover:scale-[1.01] transition-transform text-sm"
          >
            {isPending ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </div>

      {/* Resources & Pricing */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 p-6">
        <h3 className="font-bold text-lg text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">
            inventory_2
          </span>
          Resources & Pricing
        </h3>

        {resources.length > 0 ? (
          <div className="mb-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-outline-variant/10">
                  <th className="pb-2 text-xs font-bold text-on-surface-variant">Name</th>
                  <th className="pb-2 text-xs font-bold text-on-surface-variant">Category</th>
                  <th className="pb-2 text-xs font-bold text-on-surface-variant text-right">Avail/Total</th>
                  <th className="pb-2 text-xs font-bold text-on-surface-variant text-right">Price (₦)</th>
                  <th className="pb-2 w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {resources.map((r) => (
                  <tr key={r.id} className="group">
                    <td className="py-2.5 font-medium text-on-surface pr-2">{r.name}</td>
                    <td className="py-2.5 pr-2">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wide ${categoryColors[r.category] ?? "bg-slate-100 text-slate-600"}`}
                      >
                        {r.category}
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-on-surface-variant pr-2">
                      {r.availableCount}/{r.totalCount} {r.unit}
                    </td>
                    <td className="py-2.5 text-right font-semibold text-on-surface pr-2">
                      {r.priceNaira.toLocaleString()}
                    </td>
                    <td className="py-2.5">
                      <button
                        type="button"
                        onClick={() => handleDeleteResource(r.id)}
                        disabled={isPending}
                        className="text-slate-300 hover:text-red-500 transition-colors disabled:opacity-40"
                        aria-label="Delete resource"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-on-surface-variant italic mb-4">
            No resources added yet. Add your first resource below.
          </p>
        )}

        {/* Add resource form */}
        <div className="border-t border-outline-variant/10 pt-4 space-y-3">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
            Add Resource
          </p>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              placeholder="Name (e.g. ICU Bed)"
              className="col-span-2 bg-surface-container-low rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <select
              value={addCategory}
              onChange={(e) => setAddCategory(e.target.value as Category)}
              className="bg-surface-container-low rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={addUnit}
              onChange={(e) => setAddUnit(e.target.value)}
              placeholder="Unit (e.g. beds)"
              className="bg-surface-container-low rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="number"
              min="0"
              value={addTotal}
              onChange={(e) => setAddTotal(e.target.value)}
              placeholder="Total count"
              className="bg-surface-container-low rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="number"
              min="0"
              value={addAvailable}
              onChange={(e) => setAddAvailable(e.target.value)}
              placeholder="Available count"
              className="bg-surface-container-low rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="number"
              min="0"
              value={addPrice}
              onChange={(e) => setAddPrice(e.target.value)}
              placeholder="Price in ₦"
              className="col-span-2 bg-surface-container-low rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {resourceMsg && (
            <p className="text-xs text-green-700 font-semibold">{resourceMsg}</p>
          )}

          <button
            type="button"
            onClick={handleAddResource}
            disabled={!addName.trim() || isPending}
            className="w-full py-2.5 bg-primary/10 text-primary font-bold rounded-xl hover:bg-primary/20 transition-colors disabled:opacity-50 text-sm flex items-center justify-center gap-1"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Add Resource
          </button>
        </div>
      </div>
    </div>
  );
}
