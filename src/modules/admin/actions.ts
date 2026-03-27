"use server";

import { and, count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { patientHospitalLink, user } from "@/lib/db/schema";

export async function getPendingHospitals() {
  try {
    return await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phoneNumber,
        status: user.isApproved,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(and(eq(user.role, "hospital"), eq(user.isApproved, false)));
  } catch (error) {
    console.error("Failed to fetch pending hospitals:", error);
    return [];
  }
}

export async function getApprovedHospitals() {
  try {
    return await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phoneNumber,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(and(eq(user.role, "hospital"), eq(user.isApproved, true)));
  } catch (error) {
    console.error("Failed to fetch approved hospitals:", error);
    return [];
  }
}

export async function getAdminStats() {
  try {
    const [[pendingCount], [approvedCount], [patientCount], [linkCount]] =
      await Promise.all([
        db
          .select({ value: count() })
          .from(user)
          .where(and(eq(user.role, "hospital"), eq(user.isApproved, false))),
        db
          .select({ value: count() })
          .from(user)
          .where(and(eq(user.role, "hospital"), eq(user.isApproved, true))),
        db
          .select({ value: count() })
          .from(user)
          .where(eq(user.role, "patient")),
        db.select({ value: count() }).from(patientHospitalLink),
      ]);

    return {
      pendingHospitals: pendingCount?.value ?? 0,
      approvedHospitals: approvedCount?.value ?? 0,
      totalPatients: patientCount?.value ?? 0,
      totalLinks: linkCount?.value ?? 0,
    };
  } catch (error) {
    console.error("Failed to fetch admin stats:", error);
    return {
      pendingHospitals: 0,
      approvedHospitals: 0,
      totalPatients: 0,
      totalLinks: 0,
    };
  }
}

export async function approveHospital(id: string) {
  try {
    await db.update(user).set({ isApproved: true }).where(eq(user.id, id));
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to approve hospital:", error);
    return { success: false, error: "Failed to approve hospital" };
  }
}

export async function rejectHospital(id: string) {
  try {
    await db.delete(user).where(eq(user.id, id));
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to reject hospital:", error);
    return { success: false, error: "Failed to reject hospital" };
  }
}
