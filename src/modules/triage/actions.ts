"use server";

import { and, desc, eq, gt, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { patientHospitalLink, triageRequest, user } from "@/lib/db/schema";

function assessSeverity(
  symptoms: string,
): "low" | "medium" | "high" | "critical" {
  const text = symptoms.toLowerCase();
  const critical = [
    "chest pain",
    "heart attack",
    "stroke",
    "not breathing",
    "difficulty breathing",
    "unconscious",
    "severe bleeding",
    "seizure",
    "cardiac arrest",
  ];
  const high = [
    "high fever",
    "broken bone",
    "deep cut",
    "severe pain",
    "head injury",
    "allergic reaction",
    "can't walk",
    "cannot walk",
    "fracture",
    "heavy bleeding",
  ];
  const medium = [
    "fever",
    "vomiting",
    "dizziness",
    "moderate pain",
    "infection",
    "swelling",
    "nausea",
    "cramps",
    "headache",
    "shortness of breath",
  ];

  if (critical.some((k) => text.includes(k))) return "critical";
  if (high.some((k) => text.includes(k))) return "high";
  if (medium.some((k) => text.includes(k))) return "medium";
  return "low";
}

export async function createTriageRequest(patientId: string, symptoms: string) {
  try {
    const link = await db
      .select({ hospitalId: patientHospitalLink.hospitalId })
      .from(patientHospitalLink)
      .where(
        and(
          eq(patientHospitalLink.patientId, patientId),
          or(
            eq(patientHospitalLink.status, "approved"),
            eq(patientHospitalLink.status, "auto"),
          ),
        ),
      )
      .then((r) => r[0]);

    if (!link) {
      return {
        success: false as const,
        message:
          "You are not linked to any hospital. Please link to a hospital first.",
      };
    }

    const severity = assessSeverity(symptoms);
    const now = new Date();
    const id = `triage-${patientId.slice(-6)}-${Date.now()}`;

    await db.insert(triageRequest).values({
      id,
      patientId,
      hospitalId: link.hospitalId,
      symptoms,
      severity,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    revalidatePath("/dashboard/patient");
    revalidatePath("/dashboard/hospital");
    return {
      success: true as const,
      id,
      severity,
      hospitalId: link.hospitalId,
    };
  } catch (error) {
    console.error("Create triage failed:", error);
    return { success: false as const, message: "Failed to submit triage request." };
  }
}

export async function getTriageRequestsForHospital(
  hospitalId: string,
  since?: Date | null,
) {
  return db
    .select({
      id: triageRequest.id,
      symptoms: triageRequest.symptoms,
      severity: triageRequest.severity,
      status: triageRequest.status,
      notes: triageRequest.notes,
      escrowRef: triageRequest.escrowRef,
      createdAt: triageRequest.createdAt,
      patientId: triageRequest.patientId,
      patientName: user.name,
      patientEmail: user.email,
    })
    .from(triageRequest)
    .innerJoin(user, eq(triageRequest.patientId, user.id))
    .where(
      since
        ? and(
            eq(triageRequest.hospitalId, hospitalId),
            gt(triageRequest.createdAt, since),
          )
        : eq(triageRequest.hospitalId, hospitalId),
    )
    .orderBy(desc(triageRequest.createdAt));
}

export async function getPatientTriageRequests(patientId: string) {
  return db
    .select({
      id: triageRequest.id,
      symptoms: triageRequest.symptoms,
      severity: triageRequest.severity,
      status: triageRequest.status,
      escrowRef: triageRequest.escrowRef,
      createdAt: triageRequest.createdAt,
      hospitalId: triageRequest.hospitalId,
      hospitalName: user.name,
    })
    .from(triageRequest)
    .innerJoin(user, eq(triageRequest.hospitalId, user.id))
    .where(eq(triageRequest.patientId, patientId))
    .orderBy(desc(triageRequest.createdAt));
}

export async function updateTriageStatus(
  id: string,
  status: "in_progress" | "resolved",
  notes?: string,
) {
  try {
    await db
      .update(triageRequest)
      .set({ status, notes: notes ?? null, updatedAt: new Date() })
      .where(eq(triageRequest.id, id));
    revalidatePath("/dashboard/hospital");
    return { success: true };
  } catch (error) {
    console.error("Update triage status failed:", error);
    return { success: false };
  }
}

export async function getLatestTriageForPatient(patientId: string) {
  return db
    .select({
      id: triageRequest.id,
      hospitalId: triageRequest.hospitalId,
      hospitalName: user.name,
    })
    .from(triageRequest)
    .innerJoin(user, eq(triageRequest.hospitalId, user.id))
    .where(
      and(
        eq(triageRequest.patientId, patientId),
        or(
          eq(triageRequest.status, "pending"),
          eq(triageRequest.status, "in_progress"),
        ),
      ),
    )
    .orderBy(desc(triageRequest.createdAt))
    .limit(1)
    .then((r) => r[0] ?? null);
}

export async function linkEscrowToTriage(triageId: string, escrowRef: string) {
  try {
    await db
      .update(triageRequest)
      .set({ escrowRef, updatedAt: new Date() })
      .where(eq(triageRequest.id, triageId));
    revalidatePath("/dashboard/patient");
    return { success: true };
  } catch (error) {
    console.error("Link escrow to triage failed:", error);
    return { success: false };
  }
}
