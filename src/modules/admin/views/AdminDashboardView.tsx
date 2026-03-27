"use client";

import { useState, useTransition } from "react";
import { AuraLogo } from "@/components/AuraLogo";
import { ProfileMenu } from "@/modules/dashboard/components/ProfileMenu";
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

export function AdminDashboardView({
  adminName,
  adminEmail,
  pendingHospitals: initialPending,
  approvedHospitals: initialApproved,
  stats: initialStats,
}: AdminDashboardViewProps) {
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
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Approved Hospitals",
      value: stats.approvedHospitals,
      icon: "domain",
      color: "text-primary",
      bg: "bg-primary/5",
    },
    {
      label: "Registered Patients",
      value: stats.totalPatients,
      icon: "people",
      color: "text-secondary",
      bg: "bg-secondary/5",
    },
    {
      label: "Hospital Links",
      value: stats.totalLinks,
      icon: "link",
      color: "text-green-600",
      bg: "bg-green-50",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Nav */}
      <nav className="bg-[#0f172a] border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AuraLogo className="w-7 h-7" />
            <span className="text-white font-headline font-extrabold tracking-tighter">
              AuraHealth{" "}
              <span className="text-primary font-medium text-sm ml-1">
                Admin
              </span>
            </span>
          </div>
          <ProfileMenu name={adminName} email={adminEmail} userRole="admin" />
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {/* Header */}
        <header>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight font-headline">
            Control Panel
          </h1>
          <p className="text-on-surface-variant mt-1">
            Manage hospital partnerships and platform activity.
          </p>
        </header>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-2xl p-5 border border-outline-variant/10 shadow-sm"
            >
              <div
                className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3`}
              >
                <span className={`material-symbols-outlined ${s.color}`}>
                  {s.icon}
                </span>
              </div>
              <p className="text-2xl font-extrabold text-on-surface">
                {s.value}
              </p>
              <p className="text-xs text-on-surface-variant font-semibold mt-0.5">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Pending Hospitals */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl font-bold text-on-surface font-headline">
              Pending Applications
            </h2>
            {pending.length > 0 && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                {pending.length}
              </span>
            )}
          </div>
          <div className="bg-white rounded-3xl border border-outline-variant/10 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-surface-container-low border-b border-outline-variant/10">
                <tr>
                  <th className="px-6 py-4 font-headline font-bold text-sm text-on-surface">Hospital</th>
                  <th className="px-6 py-4 font-headline font-bold text-sm text-on-surface">Contact</th>
                  <th className="px-6 py-4 font-headline font-bold text-sm text-on-surface">Registered</th>
                  <th className="px-6 py-4 font-headline font-bold text-sm text-on-surface text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {pending.map((h) => (
                  <tr key={h.id} className="hover:bg-surface-container-lowest transition-colors">
                    <td className="px-6 py-5 font-bold text-on-surface">{h.name}</td>
                    <td className="px-6 py-5">
                      <p className="text-sm text-on-surface">{h.email}</p>
                      <p className="text-xs text-on-surface-variant">{h.phone ?? "No phone"}</p>
                    </td>
                    <td className="px-6 py-5 text-sm text-on-surface-variant">
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
        </section>

        {/* Approved Hospitals */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl font-bold text-on-surface font-headline">
              Approved Partners
            </h2>
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
              {approved.length}
            </span>
          </div>
          <div className="bg-white rounded-3xl border border-outline-variant/10 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-surface-container-low border-b border-outline-variant/10">
                <tr>
                  <th className="px-6 py-4 font-headline font-bold text-sm text-on-surface">Hospital</th>
                  <th className="px-6 py-4 font-headline font-bold text-sm text-on-surface">Contact</th>
                  <th className="px-6 py-4 font-headline font-bold text-sm text-on-surface">Approved Since</th>
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
                    <td className="px-6 py-5">
                      <p className="text-sm text-on-surface">{h.email}</p>
                      <p className="text-xs text-on-surface-variant">{h.phone ?? "No phone"}</p>
                    </td>
                    <td className="px-6 py-5 text-sm text-on-surface-variant">
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
        </section>
      </main>
    </div>
  );
}
