"use server";

import { and, eq, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { emrRecord, patientHospitalLink, user } from "@/lib/db/schema";

/**
 * After a patient registers, call this to check if their email or phone
 * matches any EMR record in an approved hospital.
 *
 * Returns the hospital IDs they were auto-linked to (could be multiple).
 */
export async function matchAndLinkPatientToHospitals(
  patientId: string,
): Promise<string[]> {
  try {
    const patient = await db
      .select({ email: user.email, phone: user.phoneNumber })
      .from(user)
      .where(eq(user.id, patientId))
      .then((r) => r[0]);

    if (!patient) return [];

    // Find EMR records that match this patient's email or phone
    const matches = await db
      .select({ hospitalId: emrRecord.hospitalId })
      .from(emrRecord)
      .where(
        or(
          patient.email
            ? eq(emrRecord.patientEmail, patient.email)
            : undefined,
          patient.phone
            ? eq(emrRecord.patientPhone, patient.phone)
            : undefined,
        ),
      );

    const linkedHospitalIds: string[] = [];
    const now = new Date();

    for (const { hospitalId } of matches) {
      // Don't create duplicate links
      const existing = await db
        .select({ id: patientHospitalLink.id })
        .from(patientHospitalLink)
        .where(
          and(
            eq(patientHospitalLink.patientId, patientId),
            eq(patientHospitalLink.hospitalId, hospitalId),
          ),
        )
        .then((r) => r[0]);

      if (existing) continue;

      await db.insert(patientHospitalLink).values({
        id: `link-${patientId}-${hospitalId}-${Date.now()}`,
        patientId,
        hospitalId,
        status: "auto",
        requestedAt: now,
        approvedAt: now,
      });

      linkedHospitalIds.push(hospitalId);
    }

    revalidatePath("/dashboard/patient");
    return linkedHospitalIds;
  } catch (error) {
    console.error("Patient-hospital match failed:", error);
    return [];
  }
}

/** All approved hospitals (for the hospital-selection dropdown) */
export async function getApprovedHospitals() {
  return db
    .select({ id: user.id, name: user.name, email: user.email })
    .from(user)
    .where(and(eq(user.role, "hospital"), eq(user.isApproved, true)));
}

/** Patient manually requests to be linked to a hospital */
export async function requestHospitalLink(
  patientId: string,
  hospitalId: string,
) {
  try {
    // Check for an existing link
    const existing = await db
      .select({ id: patientHospitalLink.id })
      .from(patientHospitalLink)
      .where(
        and(
          eq(patientHospitalLink.patientId, patientId),
          eq(patientHospitalLink.hospitalId, hospitalId),
        ),
      )
      .then((r) => r[0]);

    if (existing) {
      return { success: false, message: "Request already exists." };
    }

    await db.insert(patientHospitalLink).values({
      id: `link-${patientId}-${hospitalId}-${Date.now()}`,
      patientId,
      hospitalId,
      status: "pending",
      requestedAt: new Date(),
    });

    revalidatePath("/dashboard/patient");
    return { success: true, message: "Request sent to hospital for approval." };
  } catch (error) {
    console.error("Request hospital link failed:", error);
    return { success: false, message: "Failed to send request." };
  }
}

/** Get all hospital links for a patient (any status) */
export async function getPatientHospitalLinks(patientId: string) {
  return db
    .select({
      linkId: patientHospitalLink.id,
      status: patientHospitalLink.status,
      requestedAt: patientHospitalLink.requestedAt,
      approvedAt: patientHospitalLink.approvedAt,
      hospitalId: user.id,
      hospitalName: user.name,
      hospitalEmail: user.email,
    })
    .from(patientHospitalLink)
    .innerJoin(user, eq(patientHospitalLink.hospitalId, user.id))
    .where(eq(patientHospitalLink.patientId, patientId));
}
