import { DashboardNav } from "../../components/DashboardNav";
import { TriageInbox } from "../components/TriageInbox";
import { ResourcePanel } from "../components/ResourcePanel";
import { EMRSyncPanel } from "../components/EMRSyncPanel";
import { PatientsPanel } from "../components/PatientsPanel";
import { HospitalProfilePanel } from "../components/HospitalProfilePanel";

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
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <DashboardNav
        user={{ name: hospitalName, email: hospitalEmail, role: "hospital" }}
      />
      <main className="max-w-screen-2xl mx-auto px-6 py-8 flex flex-col gap-10">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold text-on-surface tracking-tight font-headline">
              Hospital Dashboard
            </h1>
            <p className="text-on-surface-variant font-medium">
              {hospitalName} — General Admission
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              className="bg-error-container text-on-error-container px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-transform active:scale-95 shadow-sm"
            >
              <span className="material-symbols-outlined">emergency_home</span>
              Emergency Override
            </button>
            <button
              type="button"
              className="bg-primary text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 transition-transform active:scale-95"
            >
              <span className="material-symbols-outlined">add</span>
              Manual Admission
            </button>
          </div>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Triage inbox (8 cols) + patients panel below */}
          <div className="lg:col-span-8 space-y-8">
            <TriageInbox hospitalId={hospitalId} initialTriages={triageRequests} />
            <PatientsPanel linkedPatients={linkedPatients} emrRecords={emrRecords} totalLinked={linkedPatients.length} />
          </div>

          {/* Right column: EMR sync + resource panel + profile */}
          <div className="lg:col-span-4 space-y-8">
            <EMRSyncPanel
              hospitalId={hospitalId}
              initialEmrCount={emrRecords.length}
              initialPendingRequests={pendingRequests}
            />
            <ResourcePanel />
            <HospitalProfilePanel
              hospitalId={hospitalId}
              initialProfile={hospitalProfile}
              initialResources={hospitalResources}
            />
          </div>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-end px-8 pb-8 pt-4 bg-white/70 backdrop-blur-2xl z-50 rounded-t-[3rem] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col items-center justify-center text-primary scale-110">
          <span className="material-symbols-outlined">home</span>
          <span className="text-[10px] font-bold uppercase tracking-widest">
            Home
          </span>
        </div>
        <div className="flex flex-col items-center justify-center text-slate-400">
          <span className="material-symbols-outlined">medical_services</span>
          <span className="text-[10px] font-bold uppercase tracking-widest">
            Triage
          </span>
        </div>
        <div className="flex flex-col items-center justify-center text-slate-400">
          <span className="material-symbols-outlined">mic</span>
          <span className="text-[10px] font-bold uppercase tracking-widest">
            Scanner
          </span>
        </div>
        <div className="flex flex-col items-center justify-center text-slate-400">
          <span className="material-symbols-outlined">
            account_balance_wallet
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest">
            Escrow
          </span>
        </div>
        <div className="flex flex-col items-center justify-center text-slate-400">
          <span className="material-symbols-outlined">healing</span>
          <span className="text-[10px] font-bold uppercase tracking-widest">
            Care
          </span>
        </div>
      </div>
    </div>
  );
}
