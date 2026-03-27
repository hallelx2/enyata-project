"use client";

import { useState, useTransition } from "react";
import { DashboardNav } from "../../components/DashboardNav";
import { VoiceTriage } from "@/components/VoiceTriage";
import { requestHospitalLink } from "@/modules/patient/actions";
import { createTriageRequest, linkEscrowToTriage } from "@/modules/triage/actions";
import { initializeMockEscrow } from "@/modules/escrow/actions";

interface HospitalLink {
  linkId: string;
  status: string;
  requestedAt: Date;
  approvedAt: Date | null;
  hospitalId: string;
  hospitalName: string;
  hospitalEmail: string;
}

interface Hospital {
  id: string;
  name: string;
  email: string;
}

interface EscrowTxn {
  id: string;
  status: string;
  amount: string;
  transactionRef: string;
  description: string | null;
  createdAt: Date;
}

interface TriageReq {
  id: string;
  symptoms: string;
  severity: string;
  status: string;
  escrowRef: string | null;
  createdAt: Date;
  hospitalId: string;
  hospitalName: string;
}

interface PatientDashboardViewProps {
  patientId: string;
  patientName: string;
  patientEmail: string;
  hospitalLinks: HospitalLink[];
  allHospitals: Hospital[];
  escrows: EscrowTxn[];
  triageRequests: TriageReq[];
}

function statusBadge(status: string) {
  if (status === "approved" || status === "auto") {
    return (
      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase tracking-widest">
        {status === "auto" ? "Auto-linked" : "Approved"}
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full uppercase tracking-widest">
      Pending
    </span>
  );
}

function escrowBadge(status: string) {
  const map: Record<string, string> = {
    pending: "bg-slate-100 text-slate-600",
    held: "bg-blue-100 text-blue-700",
    released: "bg-green-100 text-green-700",
    refunded: "bg-amber-100 text-amber-700",
  };
  return (
    <span
      className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-widest ${map[status] ?? "bg-slate-100 text-slate-600"}`}
    >
      {status}
    </span>
  );
}

function severityColor(severity: string) {
  if (severity === "critical") return "text-red-600";
  if (severity === "high") return "text-orange-600";
  if (severity === "medium") return "text-amber-600";
  return "text-green-600";
}

function triageStatusBadge(status: string) {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    in_progress: "bg-blue-100 text-blue-700",
    resolved: "bg-green-100 text-green-700",
  };
  return (
    <span
      className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-widest ${map[status] ?? "bg-slate-100 text-slate-600"}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

export function PatientDashboardView({
  patientId,
  patientName,
  patientEmail,
  hospitalLinks,
  allHospitals,
  escrows,
  triageRequests: initialTriages,
}: PatientDashboardViewProps) {
  const [selectedHospital, setSelectedHospital] = useState("");
  const [linkMsg, setLinkMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  // Triage modal state
  const [triageOpen, setTriageOpen] = useState(false);
  const [symptoms, setSymptoms] = useState("");
  const [triageResult, setTriageResult] = useState<{
    id: string;
    severity: string;
    hospitalId: string;
  } | null>(null);
  const [triageMsg, setTriageMsg] = useState("");
  const [triages, setTriages] = useState(initialTriages);

  // Escrow pre-auth state
  const [escrowingId, setEscrowingId] = useState<string | null>(null);

  const linkedIds = new Set(hospitalLinks.map((l) => l.hospitalId));
  const unlinkedHospitals = allHospitals.filter((h) => !linkedIds.has(h.id));
  const approvedLinks = hospitalLinks.filter(
    (l) => l.status === "approved" || l.status === "auto",
  );

  const totalHeld = escrows
    .filter((e) => e.status === "held")
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const handleRequestLink = () => {
    if (!selectedHospital) return;
    startTransition(async () => {
      const result = await requestHospitalLink(patientId, selectedHospital);
      setLinkMsg(result.message);
      setSelectedHospital("");
    });
  };

  const handleTriageSubmit = () => {
    if (!symptoms.trim()) return;
    startTransition(async () => {
      const result = await createTriageRequest(patientId, symptoms);
      if (result.success) {
        setTriageResult({
          id: result.id,
          severity: result.severity,
          hospitalId: result.hospitalId,
        });
        setTriageMsg("");
        const hospital = approvedLinks.find(
          (l) => l.hospitalId === result.hospitalId,
        );
        const hospitalName = hospital?.hospitalName ?? "your hospital";
        // add to local triage list
        setTriages((prev) => [
          {
            id: result.id,
            symptoms,
            severity: result.severity,
            status: "pending",
            escrowRef: null,
            createdAt: new Date(),
            hospitalId: result.hospitalId,
            hospitalName,
          },
          ...prev,
        ]);
      } else {
        setTriageMsg(result.message ?? "Failed to submit.");
      }
    });
  };

  const handlePreAuthorize = (triageId: string, hospitalId: string) => {
    setEscrowingId(triageId);
    startTransition(async () => {
      const escrow = await initializeMockEscrow({
        patientId,
        hospitalId,
        amountNaira: 5000,
        description: "Triage care pre-authorization",
      });
      if (escrow.success && escrow.txnRef) {
        await linkEscrowToTriage(triageId, escrow.txnRef);
        setTriages((prev) =>
          prev.map((t) =>
            t.id === triageId ? { ...t, escrowRef: escrow.txnRef } : t,
          ),
        );
      }
      setEscrowingId(null);
    });
  };

  const closeModal = () => {
    setTriageOpen(false);
    setSymptoms("");
    setTriageResult(null);
    setTriageMsg("");
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav
        user={{ name: patientName, email: patientEmail, role: "patient" }}
      />
      <main className="max-w-7xl mx-auto px-6 py-12">
        <header className="mb-12">
          <h1 className="text-4xl font-extrabold text-on-surface tracking-tight mb-2 font-headline">
            Welcome back, {patientName.split(" ")[0]}
          </h1>
          <p className="text-on-surface-variant font-medium text-lg font-body">
            Your health and security are our priority.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left: Quick Actions */}
          <div className="md:col-span-2 space-y-8">
            {/* Emergency CTA */}
            <div className="aura-gradient-bg p-8 rounded-3xl text-on-primary shadow-xl shadow-primary/20">
              <h2 className="text-2xl font-bold mb-4 font-headline">
                Emergency Ready
              </h2>
              <p className="mb-6 opacity-90 font-body">
                Speak to Aura to assess your symptoms and connect you with the
                right care instantly.
              </p>
              <VoiceTriage
                patientId={patientId}
                patientName={patientName}
                onComplete={() => {
                  // refresh triage list after call ends
                  window.location.reload();
                }}
              />
              <button
                type="button"
                onClick={() => setTriageOpen(true)}
                className="mt-4 text-white/70 hover:text-white text-sm flex items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-base">
                  keyboard
                </span>
                Can&apos;t use voice? Type instead
              </button>
            </div>

            {/* Triage History */}
            {triages.length > 0 && (
              <div className="bg-white p-6 rounded-2xl border border-outline-variant/10 shadow-sm">
                <h3 className="font-bold text-xl mb-4 font-headline flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">
                    history_edu
                  </span>
                  My Triage Requests
                </h3>
                <div className="space-y-3">
                  {triages.map((t) => (
                    <div
                      key={t.id}
                      className="p-4 bg-surface-container-low rounded-xl"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-on-surface truncate">
                            {t.hospitalName}
                          </p>
                          <p className="text-xs text-on-surface-variant">
                            {new Date(t.createdAt).toLocaleDateString("en-NG", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <span
                            className={`text-[10px] font-bold uppercase ${severityColor(t.severity)}`}
                          >
                            {t.severity}
                          </span>
                          {triageStatusBadge(t.status)}
                        </div>
                      </div>
                      <p className="text-sm text-on-surface-variant line-clamp-2 mb-3">
                        {t.symptoms}
                      </p>
                      {t.escrowRef ? (
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-green-600">
                            verified
                          </span>
                          <span className="text-xs text-green-700 font-semibold">
                            ₦5,000 pre-authorized
                          </span>
                        </div>
                      ) : (
                        t.status !== "resolved" && (
                          <button
                            type="button"
                            onClick={() =>
                              handlePreAuthorize(t.id, t.hospitalId)
                            }
                            disabled={isPending && escrowingId === t.id}
                            className="text-xs font-bold text-primary flex items-center gap-1 hover:underline disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-sm">
                              account_balance_wallet
                            </span>
                            {escrowingId === t.id
                              ? "Processing..."
                              : "Pre-authorize ₦5,000 care"}
                          </button>
                        )
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* My Hospitals */}
            <div className="bg-white p-6 rounded-2xl border border-outline-variant/10 shadow-sm">
              <h3 className="font-bold text-xl mb-4 font-headline flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">
                  local_hospital
                </span>
                My Hospitals
              </h3>

              {hospitalLinks.length === 0 ? (
                <p className="text-sm text-on-surface-variant italic mb-4">
                  You are not linked to any hospital yet.
                </p>
              ) : (
                <div className="space-y-3 mb-6">
                  {hospitalLinks.map((link) => (
                    <div
                      key={link.linkId}
                      className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl"
                    >
                      <div>
                        <p className="font-bold text-sm text-on-surface">
                          {link.hospitalName}
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          {link.hospitalEmail}
                        </p>
                      </div>
                      {statusBadge(link.status)}
                    </div>
                  ))}
                </div>
              )}

              {unlinkedHospitals.length > 0 && (
                <div className="border-t border-outline-variant/10 pt-4">
                  <p className="text-sm font-semibold text-on-surface-variant mb-3">
                    Request access to a hospital
                  </p>
                  <div className="flex gap-3">
                    <select
                      value={selectedHospital}
                      onChange={(e) => setSelectedHospital(e.target.value)}
                      className="flex-1 bg-surface-container-high border-none rounded-xl py-3 px-4 text-sm text-on-surface focus:ring-2 focus:ring-primary-fixed"
                    >
                      <option value="">Select hospital...</option>
                      {unlinkedHospitals.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleRequestLink}
                      disabled={!selectedHospital || isPending}
                      className="px-5 py-3 bg-primary text-white text-sm font-bold rounded-xl shadow-sm active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isPending ? "Sending..." : "Request"}
                    </button>
                  </div>
                  {linkMsg && (
                    <p className="text-xs text-secondary mt-2 font-semibold">
                      {linkMsg}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Escrow History */}
            <div className="bg-white p-6 rounded-2xl border border-outline-variant/10 shadow-sm">
              <h3 className="font-bold text-xl mb-4 font-headline flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">
                  account_balance_wallet
                </span>
                Escrow Transactions
              </h3>
              {escrows.length === 0 ? (
                <p className="text-sm text-on-surface-variant italic">
                  No escrow transactions yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {escrows.map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl"
                    >
                      <div>
                        <p className="font-bold text-sm text-on-surface">
                          {e.description ?? "Care pre-authorization"}
                        </p>
                        <p className="text-xs text-on-surface-variant font-mono">
                          {e.transactionRef}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="font-bold text-sm text-primary">
                          ₦{(Number(e.amount) / 100).toLocaleString()}
                        </p>
                        {escrowBadge(e.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Sidebar */}
          <div className="space-y-6">
            <div className="glass-widget p-6 rounded-2xl border border-outline-variant/20 shadow-lg">
              <h3 className="font-bold text-lg mb-4 font-headline">
                Vital Stats
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-outline-variant/10">
                  <span className="text-on-surface-variant text-sm">
                    Aura ID
                  </span>
                  <span className="font-bold text-primary font-mono text-sm">
                    AUR-{patientId.slice(-4).toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-outline-variant/10">
                  <span className="text-on-surface-variant text-sm">
                    Linked Hospitals
                  </span>
                  <span className="font-bold text-primary">
                    {approvedLinks.length}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-outline-variant/10">
                  <span className="text-on-surface-variant text-sm">
                    Triage Requests
                  </span>
                  <span className="font-bold text-primary">
                    {triages.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant text-sm">
                    Escrow Hold
                  </span>
                  <span className="font-bold text-secondary">
                    ₦{(totalHeld / 100).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-outline-variant/10 shadow-sm">
              <span className="material-symbols-outlined text-primary text-3xl mb-4 block">
                history
              </span>
              <h3 className="font-bold text-xl mb-2 font-headline">
                Recent Visits
              </h3>
              <p className="text-on-surface-variant text-sm font-body">
                View your medical history and past pre-authorizations.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Triage Modal */}
      {triageOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg">
            {triageResult ? (
              /* Success state */
              <div className="p-8 text-center">
                <div
                  className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                    triageResult.severity === "critical"
                      ? "bg-red-100"
                      : triageResult.severity === "high"
                        ? "bg-orange-100"
                        : "bg-amber-100"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-3xl ${severityColor(triageResult.severity)}`}
                  >
                    {triageResult.severity === "critical" ||
                    triageResult.severity === "high"
                      ? "emergency"
                      : "check_circle"}
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-on-surface font-headline mb-2">
                  Triage Submitted
                </h3>
                <p className="text-on-surface-variant mb-1">
                  Severity assessed as{" "}
                  <span
                    className={`font-bold uppercase ${severityColor(triageResult.severity)}`}
                  >
                    {triageResult.severity}
                  </span>
                </p>
                <p className="text-sm text-on-surface-variant mb-6">
                  Your request has been routed to{" "}
                  <span className="font-semibold text-on-surface">
                    {approvedLinks.find(
                      (l) => l.hospitalId === triageResult.hospitalId,
                    )?.hospitalName ?? "your hospital"}
                  </span>
                  . They will be notified immediately.
                </p>
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-full py-3 aura-gradient-bg text-white font-bold rounded-xl"
                >
                  Done
                </button>
              </div>
            ) : (
              /* Form state */
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-extrabold text-on-surface font-headline">
                    Describe your symptoms
                  </h3>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="material-symbols-outlined text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    close
                  </button>
                </div>

                {approvedLinks.length === 0 ? (
                  <div className="text-center py-6">
                    <span className="material-symbols-outlined text-4xl text-slate-300 block mb-3">
                      local_hospital
                    </span>
                    <p className="text-on-surface-variant text-sm">
                      You need to be linked to a hospital before submitting a
                      triage request.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-on-surface-variant mb-4">
                      Will be routed to{" "}
                      <span className="font-semibold text-on-surface">
                        {approvedLinks[0].hospitalName}
                      </span>
                    </p>
                    <textarea
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      placeholder="e.g. I have chest pain and difficulty breathing for the past 30 minutes..."
                      rows={5}
                      className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary resize-none mb-4"
                    />
                    {triageMsg && (
                      <p className="text-xs text-error mb-3 font-semibold">
                        {triageMsg}
                      </p>
                    )}
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="flex-1 py-3 bg-surface-container text-on-surface font-bold rounded-xl"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleTriageSubmit}
                        disabled={!symptoms.trim() || isPending}
                        className="flex-1 py-3 aura-gradient-bg text-white font-bold rounded-xl disabled:opacity-50 hover:scale-[1.02] transition-transform"
                      >
                        {isPending ? "Submitting..." : "Submit Triage"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
