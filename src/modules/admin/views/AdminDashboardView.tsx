"use client";

import { useState, useTransition } from "react";
import { DashboardNav } from "@/modules/dashboard/components/DashboardNav";
import { approveHospital, rejectHospital } from "../actions";

interface Hospital {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: Date;
}

interface Stats {
  pendingHospitals: number;
  approvedHospitals: number;
  totalPatients: number;
  totalLinks: number;
}

interface AdminDashboardViewProps {
  adminName: string;
  adminEmail: string;
  pendingHospitals: Hospital[];
  approvedHospitals: Hospital[];
  stats: Stats;
}

type Tab = "overview" | "pending" | "hospitals";

const NAV_ITEMS: { id: Tab; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "dashboard" },
  { id: "pending", label: "Pending", icon: "hourglass_empty" },
  { id: "hospitals", label: "Hospitals", icon: "domain" },
];

export function AdminDashboardView({
  adminName,
  adminEmail,
  pendingHospitals: initialPending,
  approvedHospitals: initialApproved,
  stats: initialStats,
}: AdminDashboardViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [pending, setPending] = useState(initialPending);
  const [approved, setApproved] = useState(initialApproved);
  const [stats, setStats] = useState(initialStats);
  const [isPending, startTransition] = useTransition();

  const handleApprove = (id: string) => {
    startTransition(async () => {
      const result = await approveHospital(id);
      if (result.success) {
        const hospital = pending.find((h) => h.id === id);
        if (hospital) {
          setPending((prev) => prev.filter((h) => h.id !== id));
          setApproved((prev) => [hospital, ...prev]);
          setStats((s) => ({
            ...s,
            pendingHospitals: s.pendingHospitals - 1,
            approvedHospitals: s.approvedHospitals + 1,
          }));
        }
      }
    });
  };

  const handleReject = (id: string) => {
    startTransition(async () => {
      const result = await rejectHospital(id);
      if (result.success) {
        setPending((prev) => prev.filter((h) => h.id !== id));
        setStats((s) => ({
          ...s,
          pendingHospitals: s.pendingHospitals - 1,
        }));
      }
    });
  };

  const statCards = [
    {
      label: "Pending Review",
      value: stats.pendingHospitals,
      icon: "hourglass_empty",
      color: "text-amber-600 bg-amber-50",
      onClick: () => setActiveTab("pending"),
    },
    {
      label: "Approved Hospitals",
      value: stats.approvedHospitals,
      icon: "domain",
      color: "text-primary bg-primary/5",
      onClick: () => setActiveTab("hospitals"),
    },
    {
      label: "Registered Patients",
      value: stats.totalPatients,
      icon: "people",
      color: "text-secondary bg-secondary/5",
      onClick: undefined as (() => void) | undefined,
    },
    {
      label: "Hospital Links",
      value: stats.totalLinks,
      icon: "link",
      color: "text-green-600 bg-green-50",
      onClick: undefined as (() => void) | undefined,
    },
  ];

  /* ── Render helpers ── */

  const renderPendingTable = () => (
    <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/10 shadow-sm overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-surface-container-low border-b border-outline-variant/10">
          <tr>
            <th className="px-6 py-4 font-headline font-bold text-sm text-on-surface">Hospital</th>
            <th className="px-6 py-4 font-headline font-bold text-sm text-on-surface hidden sm:table-cell">Contact</th>
            <th className="px-6 py-4 font-headline font-bold text-sm text-on-surface hidden md:table-cell">Registered</th>
            <th className="px-6 py-4 font-headline font-bold text-sm text-on-surface text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/10">
          {pending.map((h) => (
            <tr key={h.id} className="hover:bg-surface-container-lowest transition-colors">
              <td className="px-6 py-5 font-bold text-on-surface">{h.name}</td>
              <td className="px-6 py-5 hidden sm:table-cell">
                <p className="text-sm text-on-surface">{h.email}</p>
                <p className="text-xs text-on-surface-variant">{h.phone ?? "No phone"}</p>
              </td>
              <td className="px-6 py-5 text-sm text-on-surface-variant hidden md:table-cell">
                {new Date(h.createdAt).toLocaleDateString("en-NG", {
                  day: "numeric", month: "short", year: "numeric",
                })}
              </td>
              <td className="px-6 py-5 text-right">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleApprove(h.id)}
                    disabled={isPending}
                    className="aura-gradient-bg text-white px-5 py-2 rounded-xl font-bold text-sm shadow-sm hover:scale-[1.03] transition-transform disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(h.id)}
                    disabled={isPending}
                    className="bg-error-container text-on-error-container px-5 py-2 rounded-xl font-bold text-sm hover:scale-[1.03] transition-transform disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {pending.length === 0 && (
            <tr>
              <td colSpan={4} className="px-6 py-16 text-center text-on-surface-variant italic text-sm">
                No pending applications.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderApprovedTable = () => (
    <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/10 shadow-sm overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-surface-container-low border-b border-outline-variant/10">
          <tr>
            <th className="px-6 py-4 font-headline font-bold text-sm text-on-surface">Hospital</th>
            <th className="px-6 py-4 font-headline font-bold text-sm text-on-surface hidden sm:table-cell">Contact</th>
            <th className="px-6 py-4 font-headline font-bold text-sm text-on-surface hidden md:table-cell">Approved Since</th>
            <th className="px-6 py-4 font-headline font-bold text-sm text-on-surface text-right">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/10">
          {approved.map((h) => (
            <tr key={h.id} className="hover:bg-surface-container-lowest transition-colors">
              <td className="px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-sm">domain</span>
                  </div>
                  <span className="font-bold text-on-surface">{h.name}</span>
                </div>
              </td>
              <td className="px-6 py-5 hidden sm:table-cell">
                <p className="text-sm text-on-surface">{h.email}</p>
                <p className="text-xs text-on-surface-variant">{h.phone ?? "No phone"}</p>
              </td>
              <td className="px-6 py-5 text-sm text-on-surface-variant hidden md:table-cell">
                {new Date(h.createdAt).toLocaleDateString("en-NG", {
                  day: "numeric", month: "short", year: "numeric",
                })}
              </td>
              <td className="px-6 py-5 text-right">
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase tracking-widest">
                  Active
                </span>
              </td>
            </tr>
          ))}
          {approved.length === 0 && (
            <tr>
              <td colSpan={4} className="px-6 py-16 text-center text-on-surface-variant italic text-sm">
                No approved hospitals yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardNav
        user={{ name: adminName, email: adminEmail, role: "admin" }}
      />

      <div className="flex flex-1 max-w-screen-2xl mx-auto w-full px-4 py-6 gap-6">
        {/* ── Sidebar ── */}
        <aside className="hidden md:flex flex-col w-56 shrink-0 gap-1 sticky top-20 self-start">
          {/* Admin identity */}
          <div className="mb-4 px-3 py-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/10">
            <div className="w-10 h-10 rounded-xl bg-[#0f172a] flex items-center justify-center mb-2">
              <span className="material-symbols-outlined text-white text-xl">admin_panel_settings</span>
            </div>
            <p className="font-bold text-sm text-on-surface leading-tight truncate">{adminName}</p>
            <p className="text-xs text-on-surface-variant truncate">{adminEmail}</p>
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
              {item.id === "pending" && pending.length > 0 && (
                <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === "pending" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-700"}`}>
                  {pending.length}
                </span>
              )}
              {item.id === "hospitals" && (
                <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === "hospitals" ? "bg-white/20 text-white" : "bg-green-100 text-green-700"}`}>
                  {approved.length}
                </span>
              )}
            </button>
          ))}
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 min-w-0 space-y-6">

          {/* Overview */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-extrabold text-on-surface font-headline tracking-tight">
                  Control Panel
                </h1>
                <p className="text-on-surface-variant">
                  Manage hospital partnerships and platform activity.
                </p>
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((s) => {
                  const Wrapper = s.onClick ? "button" : "div";
                  return (
                    <Wrapper
                      key={s.label}
                      type={s.onClick ? "button" : undefined}
                      onClick={s.onClick}
                      className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/10 text-left hover:shadow-md transition-all active:scale-[0.98] group"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                        <span className="material-symbols-outlined text-xl">{s.icon}</span>
                      </div>
                      <p className="text-3xl font-extrabold text-on-surface">{s.value}</p>
                      <p className="text-xs text-on-surface-variant font-medium mt-0.5">{s.label}</p>
                    </Wrapper>
                  );
                })}
              </div>

              {/* Pending preview */}
              {pending.length > 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-bold text-amber-800 flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-600">hourglass_empty</span>
                      {pending.length} hospital{pending.length !== 1 ? "s" : ""} awaiting approval
                    </h2>
                    <button type="button" onClick={() => setActiveTab("pending")} className="text-xs text-amber-700 font-bold hover:underline">
                      Review →
                    </button>
                  </div>
                  <div className="space-y-1">
                    {pending.slice(0, 3).map((h) => (
                      <p key={h.id} className="text-sm text-amber-700 font-medium">{h.name} · {h.email}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent approved */}
              <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/10">
                  <h2 className="font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">domain</span>
                    Approved Partners
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActiveTab("hospitals")}
                    className="text-xs text-primary font-bold hover:underline"
                  >
                    View all →
                  </button>
                </div>
                {approved.length === 0 ? (
                  <p className="text-sm text-on-surface-variant text-center py-10 italic">No approved hospitals yet</p>
                ) : (
                  <div className="divide-y divide-outline-variant/10">
                    {approved.slice(0, 4).map((h) => (
                      <div key={h.id} className="flex items-center gap-4 px-6 py-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-primary text-sm">domain</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm text-on-surface truncate">{h.name}</p>
                          <p className="text-xs text-on-surface-variant truncate">{h.email}</p>
                        </div>
                        <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-green-100 text-green-700">
                          Active
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pending Applications */}
          {activeTab === "pending" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="text-3xl font-extrabold text-on-surface font-headline tracking-tight">
                    Pending Applications
                  </h1>
                  <p className="text-on-surface-variant">Review and approve hospital partnership requests</p>
                </div>
                {pending.length > 0 && (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                    {pending.length}
                  </span>
                )}
              </div>
              {renderPendingTable()}
            </div>
          )}

          {/* Approved Hospitals */}
          {activeTab === "hospitals" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="text-3xl font-extrabold text-on-surface font-headline tracking-tight">
                    Approved Partners
                  </h1>
                  <p className="text-on-surface-variant">All hospitals currently active on the platform</p>
                </div>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                  {approved.length}
                </span>
              </div>
              {renderApprovedTable()}
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
            {item.id === "pending" && pending.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                {pending.length}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
