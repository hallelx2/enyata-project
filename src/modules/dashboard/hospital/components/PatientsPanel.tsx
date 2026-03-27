"use client";

import { useState } from "react";

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

interface PatientsPanelProps {
  linkedPatients: LinkedPatient[];
  emrRecords: EMRRecord[];
  totalLinked?: number;
}

export function PatientsPanel({ linkedPatients, emrRecords, totalLinked }: PatientsPanelProps) {
  const auraCount = totalLinked ?? linkedPatients.length;
  const [tab, setTab] = useState<"linked" | "emr">("linked");

  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
      {/* Header + tabs */}
      <div className="px-6 pt-6 pb-0">
        <div className="flex items-center gap-3 mb-2">
          <span className="material-symbols-outlined text-primary text-2xl">
            groups
          </span>
          <h3 className="font-bold text-lg text-on-surface">Patients</h3>
          <span className="ml-auto text-xs text-on-surface-variant font-medium">
            {tab === "linked" ? linkedPatients.length : emrRecords.length} records
          </span>
        </div>
        <p className="text-xs text-on-surface-variant mb-4">
          {emrRecords.length} EMR records · {auraCount} AuraHealth patient{auraCount !== 1 ? "s" : ""} linked
        </p>
        <div className="flex border-b border-outline-variant/20">
          <button
            type="button"
            onClick={() => setTab("linked")}
            className={`px-4 py-2 text-sm font-bold transition-colors border-b-2 -mb-px ${
              tab === "linked"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            AuraHealth Patients
            {linkedPatients.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-primary text-white rounded-full">
                {linkedPatients.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setTab("emr")}
            className={`px-4 py-2 text-sm font-bold transition-colors border-b-2 -mb-px ${
              tab === "emr"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            EMR Records
            {emrRecords.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-secondary text-white rounded-full">
                {emrRecords.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="divide-y divide-outline-variant/10 max-h-[480px] overflow-y-auto">
        {tab === "linked" && (
          <>
            {linkedPatients.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl opacity-30">person_off</span>
                <p className="text-sm italic">No linked patients yet</p>
                <p className="text-xs">Approve patient requests to see them here</p>
              </div>
            ) : (
              linkedPatients.map((p) => (
                <div key={p.linkId} className="flex items-center gap-4 px-6 py-4 hover:bg-surface-container-low transition-colors">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-lg">person</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-on-surface truncate">{p.patientName}</p>
                    <p className="text-xs text-on-surface-variant truncate">{p.patientEmail}</p>
                    {p.patientPhone && (
                      <p className="text-xs text-on-surface-variant">{p.patientPhone}</p>
                    )}
                  </div>
                  <span className="shrink-0 px-2 py-0.5 text-[10px] bg-green-100 text-green-700 font-bold rounded-full uppercase tracking-wide">
                    Linked
                  </span>
                </div>
              ))
            )}
          </>
        )}

        {tab === "emr" && (
          <>
            {emrRecords.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl opacity-30">folder_open</span>
                <p className="text-sm italic">No EMR records imported</p>
                <p className="text-xs">Use "Sync from EMR" to import records</p>
              </div>
            ) : (
              emrRecords.map((r) => (
                <div key={r.id} className="flex items-center gap-4 px-6 py-4 hover:bg-surface-container-low transition-colors">
                  <div className="w-9 h-9 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-secondary text-lg">medical_information</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-on-surface truncate">{r.patientName}</p>
                      {r.auraId && (
                        <span className="text-[10px] text-primary font-bold">{r.auraId}</span>
                      )}
                    </div>
                    {r.patientEmail && (
                      <p className="text-xs text-on-surface-variant truncate">{r.patientEmail}</p>
                    )}
                    <div className="flex items-center gap-3 mt-0.5">
                      {r.bloodType && (
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                          {r.bloodType}
                        </span>
                      )}
                      {r.conditions && (
                        <span className="text-[10px] text-on-surface-variant truncate max-w-[180px]">
                          {r.conditions}
                        </span>
                      )}
                      {r.lastVisit && (
                        <span className="text-[10px] text-on-surface-variant ml-auto shrink-0">
                          Last: {r.lastVisit}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
