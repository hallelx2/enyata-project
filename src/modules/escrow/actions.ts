"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { escrowTransaction } from "@/lib/db/schema";
import {
  buildPaymentRedirectUrl,
  generateTxnRef,
  queryTransactionStatus,
  isPaymentSuccessful,
} from "@/lib/interswitch";

// ─── Initialize escrow ────────────────────────────────────────────────────────

/**
 * Create a pending escrow record and return the Interswitch payment URL
 * to redirect the patient to. Amount is in Naira (converted to kobo internally).
 */
export async function initializeEscrow(params: {
  patientId: string;
  patientEmail: string;
  patientName: string;
  hospitalId: string;
  amountNaira: number;
  description: string;
  baseUrl: string; // e.g. https://aurahealth.com
}) {
  try {
    const txnRef = generateTxnRef();
    const amountKobo = String(params.amountNaira * 100);
    const redirectUrl = `${params.baseUrl}/api/escrow/callback?txnRef=${txnRef}`;

    const now = new Date();
    await db.insert(escrowTransaction).values({
      id: `escrow-${txnRef}`,
      patientId: params.patientId,
      hospitalId: params.hospitalId,
      amount: amountKobo,
      status: "pending",
      transactionRef: txnRef,
      description: params.description,
      createdAt: now,
      updatedAt: now,
    });

    const paymentUrl = buildPaymentRedirectUrl({
      txnRef,
      amountNaira: params.amountNaira,
      customerEmail: params.patientEmail,
      customerName: params.patientName,
      description: params.description,
      redirectUrl,
    });

    return { success: true, txnRef, paymentUrl };
  } catch (error) {
    console.error("Escrow init failed:", error);
    return { success: false, txnRef: null, paymentUrl: null };
  }
}

// ─── Release escrow (hospital confirms service rendered) ──────────────────────

export async function releaseEscrow(transactionRef: string) {
  try {
    const txn = await db
      .select()
      .from(escrowTransaction)
      .where(eq(escrowTransaction.transactionRef, transactionRef))
      .then((r) => r[0]);

    if (!txn || txn.status !== "held") {
      return { success: false, message: "Transaction not in held state." };
    }

    await db
      .update(escrowTransaction)
      .set({ status: "released", updatedAt: new Date() })
      .where(eq(escrowTransaction.transactionRef, transactionRef));

    revalidatePath("/dashboard/hospital");
    revalidatePath("/dashboard/patient");
    return { success: true };
  } catch (error) {
    console.error("Release escrow failed:", error);
    return { success: false, message: "Release failed." };
  }
}

// ─── Refund escrow ────────────────────────────────────────────────────────────

export async function refundEscrow(transactionRef: string) {
  try {
    const txn = await db
      .select()
      .from(escrowTransaction)
      .where(eq(escrowTransaction.transactionRef, transactionRef))
      .then((r) => r[0]);

    if (!txn || txn.status !== "held") {
      return { success: false, message: "Transaction not in held state." };
    }

    await db
      .update(escrowTransaction)
      .set({ status: "refunded", updatedAt: new Date() })
      .where(eq(escrowTransaction.transactionRef, transactionRef));

    revalidatePath("/dashboard/hospital");
    revalidatePath("/dashboard/patient");
    return { success: true };
  } catch (error) {
    console.error("Refund escrow failed:", error);
    return { success: false, message: "Refund failed." };
  }
}

// ─── Mock escrow (no payment gateway — for dev/testing) ──────────────────────

export async function initializeMockEscrow(params: {
  patientId: string;
  hospitalId: string;
  amountNaira: number;
  description: string;
}) {
  try {
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    const txnRef = `MOCK-${Date.now()}-${rand}`;
    const amountKobo = String(params.amountNaira * 100);
    const now = new Date();

    await db.insert(escrowTransaction).values({
      id: `escrow-${txnRef}`,
      patientId: params.patientId,
      hospitalId: params.hospitalId,
      amount: amountKobo,
      status: "held",
      transactionRef: txnRef,
      description: params.description,
      createdAt: now,
      updatedAt: now,
    });

    revalidatePath("/dashboard/patient");
    revalidatePath("/dashboard/hospital");
    return { success: true, txnRef };
  } catch (error) {
    console.error("Mock escrow failed:", error);
    return { success: false, txnRef: null };
  }
}

// ─── Query patient's escrow transactions ──────────────────────────────────────

export async function getPatientEscrows(patientId: string) {
  return db
    .select()
    .from(escrowTransaction)
    .where(eq(escrowTransaction.patientId, patientId));
}

export async function getHospitalEscrows(hospitalId: string) {
  return db
    .select()
    .from(escrowTransaction)
    .where(eq(escrowTransaction.hospitalId, hospitalId));
}

// ─── Verify payment and mark as held (called from callback route) ─────────────

export async function verifyAndHoldEscrow(txnRef: string) {
  try {
    const txn = await db
      .select()
      .from(escrowTransaction)
      .where(eq(escrowTransaction.transactionRef, txnRef))
      .then((r) => r[0]);

    if (!txn) return { success: false, message: "Transaction not found." };
    if (txn.status !== "pending") {
      return { success: true, message: "Already processed." };
    }

    // Query Interswitch to verify payment
    const status = await queryTransactionStatus(txnRef, txn.amount);

    if (!status || !isPaymentSuccessful(status)) {
      return { success: false, message: "Payment not confirmed by Interswitch." };
    }

    await db
      .update(escrowTransaction)
      .set({
        status: "held",
        interswitchRef: status.PaymentReference,
        updatedAt: new Date(),
      })
      .where(eq(escrowTransaction.transactionRef, txnRef));

    return { success: true };
  } catch (error) {
    console.error("Verify escrow failed:", error);
    return { success: false, message: "Verification failed." };
  }
}

