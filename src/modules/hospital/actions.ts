"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { FAKE_EMR_PATIENTS } from "@/lib/emr-fake-data";
import { emrRecord, patientHospitalLink, user } from "@/lib/db/schema";

// ─── EMR ─────────────────────────────────────────────────────────────────────

/**
 * Seed the hospital's EMR table with the fake dataset.
 * In production this would call an external HL7/FHIR endpoint.
 * Safe to call multiple times — existing records are left untouched.
 */
export async function importEMRData(hospitalId: string) {
  try {
    // Check how many records already exist
    const existing = await db
      .select({ id: emrRecord.id })
      .from(emrRecord)
      .where(eq(emrRecord.hospitalId, hospitalId));

    if (existing.length >= FAKE_EMR_PATIENTS.length) {
      return { success: true, imported: 0, message: "Already up to date." };
    }

    const now = new Date();
    const records = FAKE_EMR_PATIENTS.map((p, i) => ({
      id: `emr-${hospitalId}-${i}-${Date.now()}`,
      hospitalId,
      patientName: p.patientName,
      patientEmail: p.patientEmail,
      patientPhone: p.patientPhone,
      dateOfBirth: p.dateOfBirth,
      bloodType: p.bloodType,
      allergies: p.allergies,
      conditions: p.conditions,
      lastVisit: p.lastVisit,
      auraId: `AUR-${1000 + i}`,
      createdAt: now,
    }));

    await db.insert(emrRecord).values(records);

    revalidatePath("/dashboard/hospital");
    return {
      success: true,
      imported: records.length,
      message: `${records.length} patient records imported.`,
    };
  } catch (error) {
    console.error("EMR import failed:", error);
    return { success: false, imported: 0, message: "EMR import failed." };
  }
}

export async function getEMRRecords(hospitalId: string) {
  return db
    .select()
    .from(emrRecord)
    .where(eq(emrRecord.hospitalId, hospitalId));
}

// ─── Patient links ────────────────────────────────────────────────────────────

/** All patients linked to a hospital (approved + auto), with user details */
export async function getLinkedPatients(hospitalId: string) {
  const links = await db
    .select({
      linkId: patientHospitalLink.id,
      status: patientHospitalLink.status,
      requestedAt: patientHospitalLink.requestedAt,
      approvedAt: patientHospitalLink.approvedAt,
      patientId: user.id,
      patientName: user.name,
      patientEmail: user.email,
      patientPhone: user.phoneNumber,
    })
    .from(patientHospitalLink)
    .innerJoin(user, eq(patientHospitalLink.patientId, user.id))
    .where(
      and(
        eq(patientHospitalLink.hospitalId, hospitalId),
        eq(patientHospitalLink.status, "approved"),
      ),
    );

  return links;
}

/** Pending patient link requests awaiting hospital approval */
export async function getPendingPatientRequests(hospitalId: string) {
  const links = await db
    .select({
      linkId: patientHospitalLink.id,
      status: patientHospitalLink.status,
      requestedAt: patientHospitalLink.requestedAt,
      patientId: user.id,
      patientName: user.name,
      patientEmail: user.email,
      patientPhone: user.phoneNumber,
    })
    .from(patientHospitalLink)
    .innerJoin(user, eq(patientHospitalLink.patientId, user.id))
    .where(
      and(
        eq(patientHospitalLink.hospitalId, hospitalId),
        eq(patientHospitalLink.status, "pending"),
      ),
    );

  return links;
}

/** Hospital approves a patient's link request */
export async function approvePatientLink(linkId: string) {
  try {
    await db
      .update(patientHospitalLink)
      .set({ status: "approved", approvedAt: new Date() })
      .where(eq(patientHospitalLink.id, linkId));

    revalidatePath("/dashboard/hospital");
    return { success: true };
  } catch (error) {
    console.error("Approve patient link failed:", error);
    return { success: false };
  }
}

/** Hospital rejects / removes a patient's link request */
export async function rejectPatientLink(linkId: string) {
  try {
    await db
      .delete(patientHospitalLink)
      .where(eq(patientHospitalLink.id, linkId));

    revalidatePath("/dashboard/hospital");
    return { success: true };
  } catch (error) {
    console.error("Reject patient link failed:", error);
    return { success: false };
  }
}
