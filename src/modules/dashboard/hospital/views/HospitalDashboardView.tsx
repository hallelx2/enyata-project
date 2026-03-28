"use client";

import { useState } from "react";
import { DashboardNav } from "../../components/DashboardNav";
import { EMRSyncPanel } from "../components/EMRSyncPanel";
import { HospitalProfilePanel } from "../components/HospitalProfilePanel";
import { PatientsPanel } from "../components/PatientsPanel";
import { ProfileSetupModal } from "../components/ProfileSetupModal";
import { ResourcePanel } from "../components/ResourcePanel";
import { TriageInbox } from "../components/TriageInbox";

interface PendingRequest {
  linkId: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string | null;
  status: string;
  requestedAt: Date;
}

interface LinkedPatient {
  linkId: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string | null;
  status: string;
  approvedAt: Date | null;
}

interface EMRRecord {
  id: string;
  patientName: string;
  patientEmail: string | null;
  patientPhone: string | null;
  dateOfBirth: string | null;
  bloodType: string | null;
  conditions: string | null;
  lastVisit: string | null;
  auraId: string | null;
}

interface TriageItem {
  id: string;
  patientName: string;
  patientEmail: string;
  symptoms: string;
  severity: string;
  status: string;
  notes: string | null;
  escrowRef: string | null;
  differentials: string | null;
  clinicalSummary: string | null;
  createdAt: Date;
}

interface HospitalProfile {
  description: string | null;
  specialties: string | null;
  address: string | null;
  emergencyPhone: string | null;
  bedCount: number | null;
  icuCount: number | null;
}

interface HospitalResource {
  id: string;
  name: string;
  category: string;
  totalCount: number;
  availableCount: number;
  priceNaira: number;
  unit: string;
}

interface HospitalDashboardViewProps {
  hospitalId: string;
  hospitalName: string;
  hospitalEmail: string;
  emrRecords: EMRRecord[];
  linkedPatients: LinkedPatient[];
  pendingRequests: PendingRequest[];
  triageRequests: TriageItem[];
  hospitalProfile: HospitalProfile | null;
  hospitalResources: HospitalResource[];
}

type Tab = "overview" | "triage" | "patients" | "resources" | "profile";

const NAV_ITEMS: { id: Tab; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "dashboard" },
  { id: "triage", label: "Triage", icon: "medical_services" },
  { id: "patients", label: "Patients", icon: "groups" },
  { id: "resources", label: "Resources", icon: "inventory_2" },
  { id: "profile", label: "Profile", icon: "apartment" },
];

export function HospitalDashboardView({
  hospitalId,
  hospitalName,
  hospitalEmail,
  emrRecords,
  linkedPatients,
  pendingRequests,
  triageRequests,
  hospitalProfile,
  hospitalResources,
}: HospitalDashboardViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const activeTriages = triageRequests.filter(
    (t) => t.status === "pending" || t.status === "in_progress",
  );
  const heldEscrow = triageRequests
    .filter((t) => t.escrowRef)
    .length;
  const availableBeds =
    hospitalResources.find((r) => r.category === "ward")?.availableCount ?? hospitalProfile?.bedCount ?? 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ProfileSetupModal
        hospitalId={hospitalId}
        hospitalName={hospitalName}
        needsSetup={!hospitalProfile?.description}
      />
      <DashboardNav
        user={{ name: hospitalName, email: hospitalEmail, role: "hospital" }}
      />

      <div className="flex flex-1 max-w-screen-2xl mx-auto w-full px-4 py-6 gap-6">
        {/* ── Sidebar ── */}
        <aside className="hidden md:flex flex-col w-56 shrink-0 gap-1 sticky top-20 self-start">
          {/* Hospital identity */}
          <div className="mb-4 px-3 py-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/10">
            <div className="w-10 h-10 rounded-xl aura-gradient-bg flex items-center justify-center mb-2">
              <span className="material-symbols-outlined text-white text-xl">local_hospital</span>
            </div>
            <p className="font-bold text-sm text-on-surface leading-tight truncate">{hospitalName}</p>
            <p className="text-xs text-on-surface-variant truncate">{hospitalEmail}</p>
          </div>

          {/* Nav links */}
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left w-full ${
                activeTab === item.id
                  ? "aura-gradient-bg text-white shadow-md shadow-primary/20"
                  : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              {item.label}
              {item.id === "triage" && activeTriages.length > 0 && (
                <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === "triage" ? "bg-white/20 text-white" : "bg-red-100 text-red-700"}`}>
                  {activeTriages.length}
                </span>
              )}
              {item.id === "patients" && pendingRequests.length > 0 && (
                <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === "patients" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-700"}`}>
                  {pendingRequests.length}
                </span>
              )}
            </button>
          ))}

          {/* Quick actions */}
          <div className="mt-4 space-y-2">
            <button
              type="button"
              className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-error-container text-on-error-container text-xs font-bold transition-transform active:scale-95"
            >
              <span className="material-symbols-outlined text-base">emergency_home</span>
              Emergency Override
            </button>
            <button
              type="button"
              className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary text-xs font-bold transition-transform active:scale-95"
            >
              <span className="material-symbols-outlined text-base">add</span>
              Manual Admission
            </button>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 min-w-0 space-y-6">

          {/* Overview */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-extrabold text-on-surface font-headline tracking-tight">
                  Good morning
                </h1>
                <p className="text-on-surface-variant">
                  {hospitalName} — here's what's happening today
                </p>
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Active Triages", value: activeTriages.length, icon: "medical_services", color: "text-red-600 bg-red-50", onClick: () => setActiveTab("triage") },
                  { label: "Linked Patients", value: linkedPatients.length + emrRecords.length, icon: "groups", color: "text-primary bg-primary/5", onClick: () => setActiveTab("patients") },
                  { label: "Escrow Active", value: heldEscrow, icon: "account_balance_wallet", color: "text-green-600 bg-green-50", onClick: () => setActiveTab("triage") },
                  { label: "Beds Available", value: availableBeds, icon: "bed", color: "text-secondary bg-secondary/5", onClick: () => setActiveTab("resources") },
                ].map((stat) => (
                  <button
                    key={stat.label}
                    type="button"
                    onClick={stat.onClick}
                    className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/10 text-left hover:shadow-md transition-all active:scale-[0.98] group"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                      <span className="material-symbols-outlined text-xl">{stat.icon}</span>
                    </div>
                    <p className="text-3xl font-extrabold text-on-surface">{stat.value}</p>
                    <p className="text-xs text-on-surface-variant font-medium mt-0.5">{stat.label}</p>
                  </button>
                ))}
              </div>

              {/* Recent triages preview */}
              <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/10">
                  <h2 className="font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">medical_services</span>
                    Active Triage Cases
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActiveTab("triage")}
                    className="text-xs text-primary font-bold hover:underline"
                  >
                    View all →
                  </button>
                </div>
                {activeTriages.length === 0 ? (
                  <p className="text-sm text-on-surface-variant text-center py-10 italic">No active cases</p>
                ) : (
                  <div className="divide-y divide-outline-variant/10">
                    {activeTriages.slice(0, 4).map((t) => (
                      <div key={t.id} className="flex items-center gap-4 px-6 py-3">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${t.severity === "critical" ? "bg-red-500" : t.severity === "high" ? "bg-orange-400" : t.severity === "medium" ? "bg-amber-400" : "bg-green-400"}`} />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm text-on-surface truncate">{t.patientName}</p>
                          <p className="text-xs text-on-surface-variant truncate">{t.symptoms}</p>
                        </div>
                        <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${t.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                          {t.status.replace("_", " ")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pending patient requests */}
              {pendingRequests.length > 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-bold text-amber-800 flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-600">person_add</span>
                      {pendingRequests.length} patient request{pendingRequests.length !== 1 ? "s" : ""} awaiting approval
                    </h2>
                    <button type="button" onClick={() => setActiveTab("patients")} className="text-xs text-amber-700 font-bold hover:underline">
                      Review →
                    </button>
                  </div>
                  <div className="space-y-1">
                    {pendingRequests.slice(0, 3).map((r) => (
                      <p key={r.linkId} className="text-sm text-amber-700 font-medium">{r.patientName} · {r.patientEmail}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Hospital info summary */}
              {hospitalProfile?.description && (
                <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 p-6">
                  <h2 className="font-bold text-on-surface mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">apartment</span>
                    Hospital Summary
                  </h2>
                  <p className="text-sm text-on-surface-variant leading-relaxed mb-3">{hospitalProfile.description}</p>
                  <div className="flex flex-wrap gap-3 text-xs font-semibold">
                    {hospitalProfile.bedCount && (
                      <span className="px-3 py-1.5 bg-primary/5 text-primary rounded-full">{hospitalProfile.bedCount} total beds</span>
                    )}
                    {hospitalProfile.icuCount && (
                      <span className="px-3 py-1.5 bg-red-50 text-red-600 rounded-full">{hospitalProfile.icuCount} ICU</span>
                    )}
                    {hospitalProfile.specialties && (
                      <span className="px-3 py-1.5 bg-surface-container-low text-on-surface-variant rounded-full">{hospitalProfile.specialties}</span>
                    )}
                  </div>
                  <button type="button" onClick={() => setActiveTab("profile")} className="mt-3 text-xs text-primary font-bold hover:underline">
                    Edit profile →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Triage */}
          {activeTab === "triage" && (
            <div className="space-y-4">
              <div>
                <h1 className="text-3xl font-extrabold text-on-surface font-headline tracking-tight">Triage Inbox</h1>
                <p className="text-on-surface-variant">Real-time patient requests — live updates every 5s</p>
              </div>
              <TriageInbox hospitalId={hospitalId} initialTriages={triageRequests} />
            </div>
          )}

          {/* Patients */}
          {activeTab === "patients" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-extrabold text-on-surface font-headline tracking-tight">Patients</h1>
                <p className="text-on-surface-variant">Linked AuraHealth patients and imported EMR records</p>
              </div>
              <EMRSyncPanel
                hospitalId={hospitalId}
                initialEmrCount={emrRecords.length}
                initialPendingRequests={pendingRequests}
              />
              <PatientsPanel
                linkedPatients={linkedPatients}
                emrRecords={emrRecords}
                totalLinked={linkedPatients.length}
              />
            </div>
          )}

          {/* Resources */}
          {activeTab === "resources" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-extrabold text-on-surface font-headline tracking-tight">Resources</h1>
                <p className="text-on-surface-variant">Live inventory — Aura uses these counts and prices when routing patients</p>
              </div>
              <ResourcePanel />
              <HospitalProfilePanel
                hospitalId={hospitalId}
                initialProfile={hospitalProfile}
                initialResources={hospitalResources}
              />
            </div>
          )}

          {/* Profile */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-extrabold text-on-surface font-headline tracking-tight">Hospital Profile</h1>
                <p className="text-on-surface-variant">Description, specialties, and contact details shown to patients and the AI</p>
              </div>
              <HospitalProfilePanel
                hospitalId={hospitalId}
                initialProfile={hospitalProfile}
                initialResources={hospitalResources}
              />
            </div>
          )}

        </main>
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-end px-4 pb-6 pt-3 bg-white/80 backdrop-blur-2xl z-50 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.06)]">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-0.5 relative ${activeTab === item.id ? "text-primary" : "text-slate-400"}`}
          >
            <span className={`material-symbols-outlined text-2xl ${activeTab === item.id ? "scale-110" : ""} transition-transform`}>
              {item.icon}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-widest">{item.label}</span>
            {item.id === "triage" && activeTriages.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                {activeTriages.length}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
