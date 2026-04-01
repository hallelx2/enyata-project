"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { VoiceTriage } from "@/components/VoiceTriage";
import { initializeEscrow } from "@/modules/escrow/actions";
import { requestHospitalLink } from "@/modules/patient/actions";
import { createTriageRequest, linkEscrowToTriage } from "@/modules/triage/actions";
import { DashboardNav } from "../../components/DashboardNav";

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
  vapiPhone?: string;
}

type Tab = "overview" | "triage" | "hospitals" | "payments";

const NAV_ITEMS: { id: Tab; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "dashboard" },
  { id: "triage", label: "Triage", icon: "medical_services" },
  { id: "hospitals", label: "Hospitals", icon: "local_hospital" },
  { id: "payments", label: "Payments", icon: "account_balance_wallet" },
];

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
  vapiPhone,
}: PatientDashboardViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [selectedHospital, setSelectedHospital] = useState("");
  const [linkMsg, setLinkMsg] = useState("");
  const [escrowBanner, setEscrowBanner] = useState<
    | { type: "success"; ref: string }
    | { type: "error"; message: string; ref?: string }
    | null
  >(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [triageOpen, setTriageOpen] = useState(false);
  const [symptoms, setSymptoms] = useState("");
  const [triageResult, setTriageResult] = useState<{ id: string; severity: string; hospitalId: string } | null>(null);
  const [triageMsg, setTriageMsg] = useState("");
  const [triages, setTriages] = useState(initialTriages);
  const [escrowingId, setEscrowingId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("escrow");
    const ref = params.get("ref") ?? "";
    if (status === "held") {
      setEscrowBanner({ type: "success", ref });
      window.history.replaceState({}, "", window.location.pathname);
      router.refresh();
    } else if (status === "failed" || status === "error") {
      setEscrowBanner({
        type: "error",
        ref,
        message: "Payment was not completed. Please try again.",
      });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [router]);

  useEffect(() => {
    const es = new EventSource(`/api/events/patient-stream?patientId=${patientId}`);
    es.onmessage = (e) => {
      const data = JSON.parse(e.data as string) as {
        type: string;
        triages?: TriageReq[];
      };
      if (data.type === "link-updated") {
        router.refresh();
      } else if (data.type === "triage-updated" && data.triages) {
        setTriages((prev) =>
          prev.map((t) => {
            const updated = data.triages?.find((u) => u.id === t.id);
            return updated ? { ...t, ...updated } : t;
          }),
        );
      }
    };
    return () => es.close();
  }, [patientId, router]);

  const linkedIds = new Set(hospitalLinks.map((l) => l.hospitalId));
  const unlinkedHospitals = allHospitals.filter((h) => !linkedIds.has(h.id));
  const approvedLinks = hospitalLinks.filter((l) => l.status === "approved" || l.status === "auto");
  const totalHeld = escrows.filter((e) => e.status === "held").reduce((sum, e) => sum + Number(e.amount), 0);
  const activeTriages = triages.filter((t) => t.status !== "resolved").length;

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
        setTriageResult({ id: result.id, severity: result.severity, hospitalId: result.hospitalId });
        setTriageMsg("");
        const hospital = approvedLinks.find((l) => l.hospitalId === result.hospitalId);
        setTriages((prev) => [
          { id: result.id, symptoms, severity: result.severity, status: "pending", escrowRef: null, createdAt: new Date(), hospitalId: result.hospitalId, hospitalName: hospital?.hospitalName ?? "your hospital" },
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
      const escrow = await initializeEscrow({
        patientId, patientEmail, patientName, hospitalId, amountNaira: 5000,
        description: "Triage care pre-authorization", baseUrl: window.location.origin,
      });
      if (escrow.success && escrow.txnRef && escrow.paymentUrl) {
        await linkEscrowToTriage(triageId, escrow.txnRef);
        window.location.href = escrow.paymentUrl;
      } else {
        setEscrowBanner({
          type: "error",
          ref: escrow.txnRef ?? undefined,
          message:
            escrow.message ??
            "Could not initialize payment checkout. Please try again shortly.",
        });
      }
      setEscrowingId(null);
    });
  };

  const closeModal = () => { setTriageOpen(false); setSymptoms(""); setTriageResult(null); setTriageMsg(""); };

  // ─── Tab Content ──────────────────────────────────────────────────────────

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Emergency CTA */}
      <div className="aura-gradient-bg p-8 rounded-3xl text-on-primary shadow-xl shadow-primary/20">
        <h2 className="text-2xl font-bold mb-4 font-headline">Emergency Ready</h2>
        <p className="mb-6 opacity-90 font-body">Speak to Aura to assess your symptoms and connect you with the right care instantly.</p>
        <VoiceTriage patientId={patientId} patientName={patientName} onComplete={() => window.location.reload()} />
        <button type="button" onClick={() => setTriageOpen(true)} className="mt-4 text-white/70 hover:text-white text-sm flex items-center gap-1 transition-colors">
          <span className="material-symbols-outlined text-base">keyboard</span>
          Can&apos;t use voice? Type instead
        </button>
        {vapiPhone && (
          <div className="mt-4 flex items-center gap-2 text-white/70 text-sm">
            <span className="material-symbols-outlined text-base">call</span>
            <span>Call AuraHealth Doctor: <strong className="text-white">{vapiPhone}</strong></span>
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Aura ID", value: `AUR-${patientId.slice(-4).toUpperCase()}`, icon: "badge", color: "text-primary", bg: "bg-primary/5" },
          { label: "Linked Hospitals", value: approvedLinks.length, icon: "local_hospital", color: "text-green-600", bg: "bg-green-50" },
          { label: "Active Triages", value: activeTriages, icon: "medical_services", color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Escrow Hold", value: `₦${(totalHeld / 100).toLocaleString()}`, icon: "account_balance_wallet", color: "text-secondary", bg: "bg-secondary/5" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-outline-variant/10 shadow-sm">
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
              <span className={`material-symbols-outlined ${s.color}`}>{s.icon}</span>
            </div>
            <p className="text-xl font-extrabold text-on-surface">{s.value}</p>
            <p className="text-xs text-on-surface-variant font-semibold mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Triage Preview */}
      {triages.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-outline-variant/10 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg font-headline">Recent Triages</h3>
            <button type="button" onClick={() => setActiveTab("triage")} className="text-primary text-sm font-semibold hover:underline">View all</button>
          </div>
          <div className="space-y-3">
            {triages.slice(0, 3).map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-on-surface truncate">{t.hospitalName}</p>
                  <p className="text-xs text-on-surface-variant truncate">{t.symptoms}</p>
                </div>
                <div className="flex gap-1.5 shrink-0 ml-3">
                  <span className={`text-[10px] font-bold uppercase ${severityColor(t.severity)}`}>{t.severity}</span>
                  {triageStatusBadge(t.status)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderTriage = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold font-headline">My Triage Requests</h2>
        <button type="button" onClick={() => setTriageOpen(true)} className="px-4 py-2 aura-gradient-bg text-white text-sm font-bold rounded-xl shadow-sm">
          New Triage
        </button>
      </div>
      {triages.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-outline-variant/10 text-center">
          <span className="material-symbols-outlined text-4xl text-slate-300 block mb-3">medical_services</span>
          <p className="text-on-surface-variant text-sm">No triage requests yet. Speak to Aura or type your symptoms.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {triages.map((t) => (
            <div key={t.id} className="bg-white p-5 rounded-2xl border border-outline-variant/10 shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-on-surface truncate">{t.hospitalName}</p>
                  <p className="text-xs text-on-surface-variant">
                    {new Date(t.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <span className={`text-[10px] font-bold uppercase ${severityColor(t.severity)}`}>{t.severity}</span>
                  {triageStatusBadge(t.status)}
                </div>
              </div>
              <p className="text-sm text-on-surface-variant line-clamp-2 mb-3">{t.symptoms}</p>
              {t.escrowRef ? (
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-green-600">verified</span>
                  <span className="text-xs text-green-700 font-semibold">₦5,000 pre-authorized</span>
                </div>
              ) : (
                t.status !== "resolved" && (
                  <button type="button" onClick={() => handlePreAuthorize(t.id, t.hospitalId)} disabled={isPending && escrowingId === t.id} className="text-xs font-bold text-primary flex items-center gap-1 hover:underline disabled:opacity-50">
                    <span className="material-symbols-outlined text-sm">account_balance_wallet</span>
                    {escrowingId === t.id ? "Processing..." : "Pre-authorize ₦5,000 care"}
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderHospitals = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold font-headline">My Hospitals</h2>
      {hospitalLinks.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-outline-variant/10 text-center">
          <span className="material-symbols-outlined text-4xl text-slate-300 block mb-3">local_hospital</span>
          <p className="text-on-surface-variant text-sm">You are not linked to any hospital yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {hospitalLinks.map((link) => (
            <div key={link.linkId} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-outline-variant/10 shadow-sm">
              <div>
                <p className="font-bold text-sm text-on-surface">{link.hospitalName}</p>
                <p className="text-xs text-on-surface-variant">{link.hospitalEmail}</p>
              </div>
              {statusBadge(link.status)}
            </div>
          ))}
        </div>
      )}

      {unlinkedHospitals.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-outline-variant/10 shadow-sm">
          <p className="text-sm font-semibold text-on-surface-variant mb-3">Request access to a hospital</p>
          <div className="flex gap-3">
            <select value={selectedHospital} onChange={(e) => setSelectedHospital(e.target.value)} className="flex-1 bg-surface-container-high border-none rounded-xl py-3 px-4 text-sm text-on-surface focus:ring-2 focus:ring-primary-fixed">
              <option value="">Select hospital...</option>
              {unlinkedHospitals.map((h) => (<option key={h.id} value={h.id}>{h.name}</option>))}
            </select>
            <button type="button" onClick={handleRequestLink} disabled={!selectedHospital || isPending} className="px-5 py-3 bg-primary text-white text-sm font-bold rounded-xl shadow-sm active:scale-95 transition-all disabled:opacity-50">
              {isPending ? "Sending..." : "Request"}
            </button>
          </div>
          {linkMsg && <p className="text-xs text-secondary mt-2 font-semibold">{linkMsg}</p>}
        </div>
      )}
    </div>
  );

  const renderPayments = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold font-headline">Escrow Transactions</h2>
      {escrows.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-outline-variant/10 text-center">
          <span className="material-symbols-outlined text-4xl text-slate-300 block mb-3">account_balance_wallet</span>
          <p className="text-on-surface-variant text-sm">No escrow transactions yet. Pre-authorize payment during triage.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {escrows.map((e) => (
            <div key={e.id} className="flex items-center justify-between p-5 bg-white rounded-2xl border border-outline-variant/10 shadow-sm">
              <div>
                <p className="font-bold text-sm text-on-surface">{e.description ?? "Care pre-authorization"}</p>
                <p className="text-xs text-on-surface-variant font-mono">{e.transactionRef}</p>
                <p className="text-xs text-on-surface-variant mt-1">
                  {new Date(e.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <div className="text-right space-y-1">
                <p className="font-bold text-sm text-primary">₦{(Number(e.amount) / 100).toLocaleString()}</p>
                {escrowBadge(e.status)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const tabContent: Record<Tab, () => React.ReactNode> = {
    overview: renderOverview,
    triage: renderTriage,
    hospitals: renderHospitals,
    payments: renderPayments,
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav user={{ name: patientName, email: patientEmail, role: "patient" }} />

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-outline-variant/10 min-h-[calc(100vh-73px)] sticky top-[73px] p-4 gap-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === item.id
                  ? "bg-primary/10 text-primary"
                  : "text-on-surface-variant hover:bg-surface-container-low"
              }`}
            >
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              {item.label}
              {item.id === "triage" && activeTriages > 0 && (
                <span className="ml-auto px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">{activeTriages}</span>
              )}
              {item.id === "payments" && escrows.length > 0 && (
                <span className="ml-auto px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full">{escrows.length}</span>
              )}
            </button>
          ))}
        </aside>

        {/* Main Content */}
        <main className="flex-1 max-w-5xl mx-auto px-6 py-8">
          {escrowBanner && (
            <div className={`mb-6 flex items-center justify-between gap-3 px-5 py-4 rounded-2xl text-sm font-semibold ${escrowBanner.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base">{escrowBanner.type === "success" ? "check_circle" : "error"}</span>
                {escrowBanner.type === "success"
                  ? `Payment confirmed — ₦5,000 held in escrow. Ref: ${escrowBanner.ref}`
                  : `${escrowBanner.message}${escrowBanner.ref ? ` Ref: ${escrowBanner.ref}` : ""}`}
              </div>
              <button type="button" onClick={() => setEscrowBanner(null)} className="material-symbols-outlined text-base opacity-60 hover:opacity-100">close</button>
            </div>
          )}

          <header className="mb-8">
            <h1 className="text-3xl font-extrabold text-on-surface tracking-tight font-headline">
              Welcome back, {patientName.split(" ")[0]}
            </h1>
            <p className="text-on-surface-variant font-medium text-base font-body mt-1">Your health and security are our priority.</p>
          </header>

          {tabContent[activeTab]()}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-outline-variant/10 z-50 flex">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            className={`flex-1 flex flex-col items-center py-3 text-[10px] font-bold transition-colors relative ${
              activeTab === item.id ? "text-primary" : "text-on-surface-variant"
            }`}
          >
            <span className="material-symbols-outlined text-xl mb-0.5">{item.icon}</span>
            {item.label}
            {item.id === "triage" && activeTriages > 0 && (
              <span className="absolute top-2 right-[calc(50%-16px)] w-2 h-2 bg-amber-500 rounded-full" />
            )}
          </button>
        ))}
      </nav>

      {/* Triage Modal */}
      {triageOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg">
            {triageResult ? (
              <div className="p-8 text-center">
                <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${triageResult.severity === "critical" ? "bg-red-100" : triageResult.severity === "high" ? "bg-orange-100" : "bg-amber-100"}`}>
                  <span className={`material-symbols-outlined text-3xl ${severityColor(triageResult.severity)}`}>
                    {triageResult.severity === "critical" || triageResult.severity === "high" ? "emergency" : "check_circle"}
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-on-surface font-headline mb-2">Triage Submitted</h3>
                <p className="text-on-surface-variant mb-1">
                  Severity assessed as <span className={`font-bold uppercase ${severityColor(triageResult.severity)}`}>{triageResult.severity}</span>
                </p>
                <p className="text-sm text-on-surface-variant mb-6">
                  Your request has been routed to <span className="font-semibold text-on-surface">{approvedLinks.find((l) => l.hospitalId === triageResult.hospitalId)?.hospitalName ?? "your hospital"}</span>. They will be notified immediately.
                </p>
                <button type="button" onClick={closeModal} className="w-full py-3 aura-gradient-bg text-white font-bold rounded-xl">Done</button>
              </div>
            ) : (
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-extrabold text-on-surface font-headline">Describe your symptoms</h3>
                  <button type="button" onClick={closeModal} className="material-symbols-outlined text-slate-400 hover:text-slate-600 transition-colors">close</button>
                </div>
                {approvedLinks.length === 0 ? (
                  <div className="text-center py-6">
                    <span className="material-symbols-outlined text-4xl text-slate-300 block mb-3">local_hospital</span>
                    <p className="text-on-surface-variant text-sm">You need to be linked to a hospital before submitting a triage request.</p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-on-surface-variant mb-4">Will be routed to <span className="font-semibold text-on-surface">{approvedLinks[0].hospitalName}</span></p>
                    <textarea value={symptoms} onChange={(e) => setSymptoms(e.target.value)} placeholder="e.g. I have chest pain and difficulty breathing for the past 30 minutes..." rows={5} className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary resize-none mb-4" />
                    {triageMsg && <p className="text-xs text-error mb-3 font-semibold">{triageMsg}</p>}
                    <div className="flex gap-3">
                      <button type="button" onClick={closeModal} className="flex-1 py-3 bg-surface-container text-on-surface font-bold rounded-xl">Cancel</button>
                      <button type="button" onClick={handleTriageSubmit} disabled={!symptoms.trim() || isPending} className="flex-1 py-3 aura-gradient-bg text-white font-bold rounded-xl disabled:opacity-50 hover:scale-[1.02] transition-transform">
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
