"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateTriageStatus } from "@/modules/triage/actions";
import { releaseEscrow } from "@/modules/escrow/actions";

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
  createdAt: Date | string;
}

function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    critical: "bg-red-100 text-red-700 border border-red-200",
    high: "bg-orange-100 text-orange-700 border border-orange-200",
    medium: "bg-amber-100 text-amber-700 border border-amber-200",
    low: "bg-green-100 text-green-700 border border-green-200",
  };
  return (
    <span
      className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-widest ${styles[severity] ?? "bg-slate-100 text-slate-600"}`}
    >
      {severity}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    in_progress: "bg-blue-100 text-blue-700",
    resolved: "bg-green-100 text-green-700",
  };
  return (
    <span
      className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-widest ${styles[status] ?? "bg-slate-100 text-slate-600"}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function severityBorder(severity: string) {
  if (severity === "critical") return "border-red-300 shadow-red-50";
  if (severity === "high") return "border-orange-200";
  return "border-outline-variant/10";
}

interface TriageInboxProps {
  hospitalId: string;
  initialTriages: TriageItem[];
}

export function TriageInbox({ hospitalId, initialTriages }: TriageInboxProps) {
  const [triages, setTriages] = useState<TriageItem[]>(initialTriages);
  const [newAlert, setNewAlert] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    const es = new EventSource(`/api/triage/stream?hospitalId=${hospitalId}`);

    es.onmessage = (e) => {
      const data = JSON.parse(e.data as string) as {
        type: string;
        triages?: TriageItem[];
        count?: number;
      };
      if (data.type === "init") {
        setTriages(data.triages ?? []);
      } else if (data.type === "new") {
        setTriages((prev) => [...(data.triages ?? []), ...prev]);
        setNewAlert(true);
        setTimeout(() => setNewAlert(false), 6000);
      } else if (data.type === "updated") {
        setTriages((prev) =>
          prev.map((t) => {
            const updated = (data.triages ?? []).find((u) => u.id === t.id);
            return updated ? { ...t, ...updated } : t;
          }),
        );
      } else if (data.type === "patient-approved") {
        router.refresh();
      }
    };

    return () => es.close();
  }, [hospitalId, router]);

  const handleStatus = (id: string, status: "in_progress" | "resolved") => {
    startTransition(async () => {
      await updateTriageStatus(id, status);
      setTriages((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status } : t)),
      );
    });
  };

  const handleRelease = (escrowRef: string) => {
    startTransition(async () => {
      await releaseEscrow(escrowRef);
    });
  };

  const active = triages.filter(
    (t) => t.status === "pending" || t.status === "in_progress",
  );
  const resolved = triages.filter((t) => t.status === "resolved");

  return (
    <section className="lg:col-span-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-on-surface font-headline flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">
            medical_services
          </span>
          Triage Inbox
        </h2>
        {active.length > 0 && (
          <span className="px-2.5 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full animate-pulse">
            {active.length} active
          </span>
        )}
        {newAlert && (
          <span className="px-3 py-1 aura-gradient-bg text-white text-xs font-bold rounded-full">
            New alert!
          </span>
        )}
        <span className="ml-auto text-xs text-on-surface-variant">
          Live updates every 5s
        </span>
      </div>

      {/* Empty state */}
      {triages.length === 0 && (
        <div className="bg-white rounded-2xl p-16 border border-outline-variant/10 text-center">
          <span className="material-symbols-outlined text-5xl text-slate-200 block mb-3">
            inbox
          </span>
          <p className="font-semibold text-on-surface-variant">
            No triage requests yet
          </p>
          <p className="text-sm text-on-surface-variant mt-1">
            New patient requests will appear here in real-time.
          </p>
        </div>
      )}

      {/* Active triages */}
      {active.length > 0 && (
        <div className="space-y-4">
          {active.map((t) => (
            <div
              key={t.id}
              className={`bg-white rounded-2xl p-5 border shadow-sm ${severityBorder(t.severity)}`}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="font-bold text-on-surface">{t.patientName}</p>
                  <p className="text-xs text-on-surface-variant">
                    {t.patientEmail}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0 items-center">
                  <SeverityBadge severity={t.severity} />
                  <StatusBadge status={t.status} />
                </div>
              </div>

              <p className="text-sm text-on-surface bg-surface-container-low px-4 py-3 rounded-xl mb-4 leading-relaxed">
                {t.symptoms}
              </p>

              {(t.differentials || t.clinicalSummary) && (
                <details className="mb-4">
                  <summary className="cursor-pointer text-xs font-bold text-blue-700 flex items-center gap-1.5 select-none list-none mb-2">
                    <span className="material-symbols-outlined text-sm">psychology</span>
                    Clinical AI Assessment
                  </summary>
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2">
                    {t.differentials && (() => {
                      try {
                        const diffs = JSON.parse(t.differentials) as string[];
                        return diffs.length > 0 ? (
                          <div>
                            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Differentials</p>
                            <p className="text-sm text-blue-900">{diffs.join(", ")}</p>
                          </div>
                        ) : null;
                      } catch {
                        return null;
                      }
                    })()}
                    {t.clinicalSummary && (
                      <div>
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Clinical Summary</p>
                        <p className="text-sm text-blue-900 leading-relaxed">{t.clinicalSummary}</p>
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="flex items-center justify-between flex-wrap gap-3">
                <p className="text-xs text-on-surface-variant">
                  {new Date(t.createdAt).toLocaleTimeString("en-NG", {
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "numeric",
                    month: "short",
                  })}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {t.escrowRef && (
                    <button
                      type="button"
                      onClick={() => handleRelease(t.escrowRef!)}
                      disabled={isPending}
                      className="px-4 py-2 bg-green-100 text-green-700 text-xs font-bold rounded-xl hover:bg-green-200 transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">
                        payments
                      </span>
                      Release Escrow
                    </button>
                  )}
                  {t.status === "pending" && (
                    <button
                      type="button"
                      onClick={() => handleStatus(t.id, "in_progress")}
                      disabled={isPending}
                      className="px-4 py-2 bg-primary/10 text-primary text-xs font-bold rounded-xl hover:bg-primary/20 transition-colors disabled:opacity-50"
                    >
                      Start Treatment
                    </button>
                  )}
                  {t.status === "in_progress" && (
                    <button
                      type="button"
                      onClick={() => handleStatus(t.id, "resolved")}
                      disabled={isPending}
                      className="px-4 py-2 aura-gradient-bg text-white text-xs font-bold rounded-xl hover:scale-[1.02] transition-transform disabled:opacity-50"
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resolved (collapsed) */}
      {resolved.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-sm font-bold text-on-surface-variant flex items-center gap-2 list-none select-none mb-3">
            <span className="material-symbols-outlined text-base transition-transform group-open:rotate-90">
              chevron_right
            </span>
            {resolved.length} resolved case{resolved.length !== 1 ? "s" : ""}
          </summary>
          <div className="space-y-2">
            {resolved.map((t) => (
              <div
                key={t.id}
                className="bg-surface-container-low rounded-xl p-4 flex items-center justify-between opacity-60"
              >
                <div className="min-w-0">
                  <p className="font-bold text-sm text-on-surface">
                    {t.patientName}
                  </p>
                  <p className="text-xs text-on-surface-variant truncate max-w-xs">
                    {t.symptoms}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0 ml-4">
                  <SeverityBadge severity={t.severity} />
                  <StatusBadge status={t.status} />
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </section>
  );
}
