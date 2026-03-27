"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  importEMRData,
  getPendingPatientRequests,
  approvePatientLink,
  rejectPatientLink,
} from "@/modules/hospital/actions";

interface PendingRequest {
  linkId: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string | null;
  status: string;
  requestedAt: Date;
}

interface EMRSyncPanelProps {
  hospitalId: string;
  initialEmrCount: number;
  initialPendingRequests: PendingRequest[];
}

export function EMRSyncPanel({
  hospitalId,
  initialEmrCount,
  initialPendingRequests,
}: EMRSyncPanelProps) {
  const [emrCount, setEmrCount] = useState(initialEmrCount);
  const [pendingRequests, setPendingRequests] = useState(
    initialPendingRequests,
  );
  const [syncMsg, setSyncMsg] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSync = () => {
    startTransition(async () => {
      const result = await importEMRData(hospitalId);
      setSyncMsg(result.message);
      if (result.success && result.imported > 0) {
        setEmrCount((c) => c + result.imported);
      }
    });
  };

  const handleApprove = (linkId: string) => {
    startTransition(async () => {
      const result = await approvePatientLink(linkId);
      if (result.success) {
        setPendingRequests((prev) => prev.filter((r) => r.linkId !== linkId));
        router.refresh();
      }
    });
  };

  const handleReject = (linkId: string) => {
    startTransition(async () => {
      const result = await rejectPatientLink(linkId);
      if (result.success) {
        setPendingRequests((prev) => prev.filter((r) => r.linkId !== linkId));
      }
    });
  };

  return (
    <section className="lg:col-span-4 space-y-6">
      {/* EMR Sync Card */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/10">
        <div className="flex items-center gap-3 mb-4">
          <span className="material-symbols-outlined text-primary text-2xl">
            sync
          </span>
          <h3 className="font-bold text-lg text-on-surface">EMR Integration</h3>
        </div>
        <div className="flex items-center justify-between mb-4 p-4 bg-surface-container-low rounded-xl">
          <div>
            <p className="text-sm text-on-surface-variant">Imported Records</p>
            <p className="text-3xl font-extrabold text-primary">{emrCount}</p>
          </div>
          <span className="material-symbols-outlined text-4xl text-primary/20">
            folder_shared
          </span>
        </div>
        {syncMsg && (
          <p className="text-xs text-secondary mb-3 font-semibold">{syncMsg}</p>
        )}
        <button
          onClick={handleSync}
          disabled={isPending}
          className="w-full py-3 bg-primary text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-lg">sync</span>
          {isPending ? "Syncing..." : "Sync from EMR"}
        </button>
        <p className="text-[10px] text-on-surface-variant mt-2 text-center">
          Pulls patient records from your hospital's external EMR system
        </p>
      </div>

      {/* Pending Patient Requests */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/10">
        <div className="flex items-center gap-3 mb-4">
          <span className="material-symbols-outlined text-amber-500 text-2xl">
            person_add
          </span>
          <h3 className="font-bold text-lg text-on-surface">
            Patient Requests
          </h3>
          {pendingRequests.length > 0 && (
            <span className="ml-auto px-2 py-0.5 text-xs bg-amber-100 text-amber-700 font-bold rounded-full">
              {pendingRequests.length}
            </span>
          )}
        </div>

        {pendingRequests.length === 0 ? (
          <p className="text-sm text-on-surface-variant text-center py-6 italic">
            No pending requests
          </p>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <div
                key={req.linkId}
                className="p-4 bg-surface-container-low rounded-xl border border-amber-100"
              >
                <p className="font-bold text-sm text-on-surface">
                  {req.patientName}
                </p>
                <p className="text-xs text-on-surface-variant mb-3">
                  {req.patientEmail}
                  {req.patientPhone ? ` • ${req.patientPhone}` : ""}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(req.linkId)}
                    disabled={isPending}
                    className="flex-1 py-2 bg-primary text-white text-xs font-bold rounded-lg active:scale-95 transition-all disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(req.linkId)}
                    disabled={isPending}
                    className="flex-1 py-2 bg-error-container text-on-error-container text-xs font-bold rounded-lg active:scale-95 transition-all disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
