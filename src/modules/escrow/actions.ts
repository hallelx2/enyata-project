"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { escrowTransaction } from "@/lib/db/schema";
import {
  buildPaymentRedirectUrl,
  createPayBillLink,
  generateTxnRef,
  isPaymentSuccessful,
  queryTransactionStatus,
} from "@/lib/interswitch";
import {
  initializePaystackTransaction,
  verifyPaystackTransaction,
} from "@/lib/paystack";

// ─── Initialize escrow ────────────────────────────────────────────────────────

/**
 * Create a pending escrow record and return a payment URL (Interswitch or Paystack)
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
  provider?: "interswitch" | "paystack";
}) {
  const provider = params.provider ?? "paystack";
  try {
    const txnRef = generateTxnRef();
    const amountKobo = String(params.amountNaira * 100);
    const redirectUrl = `${params.baseUrl}/api/escrow/callback?txnRef=${txnRef}&provider=${provider}`;

    const now = new Date();
    await db.insert(escrowTransaction).values({
      id: `escrow-${txnRef}`,
      patientId: params.patientId,
      hospitalId: params.hospitalId,
      amount: amountKobo,
      status: "pending",
      transactionRef: txnRef,
      paymentProvider: provider,
      description: params.description,
      createdAt: now,
      updatedAt: now,
    });

    let paymentUrl: string;

    if (provider === "paystack") {
      const ps = await initializePaystackTransaction({
        txnRef,
        amountKobo: params.amountNaira * 100,
        customerEmail: params.patientEmail,
        callbackUrl: redirectUrl,
      });
      if (!ps) {
        return {
          success: false,
          txnRef: null,
          paymentUrl: null,
          message: "Failed to initialize Paystack payment.",
        };
      }
      paymentUrl = ps.authorizationUrl;
    } else {
      // Interswitch — Web Redirect (Path B) with SHA-512 hash so Interswitch
      // uses our exact amount instead of the pay item's configured fixed price.
      paymentUrl = await buildPaymentRedirectUrl({
        txnRef,
        amountNaira: params.amountNaira,
        customerEmail: params.patientEmail,
        customerName: params.patientName,
        description: params.description,
        redirectUrl,
      });
    }

    return { success: true, txnRef, paymentUrl };
  } catch (error) {
    console.error("Escrow init failed:", error);
    return {
      success: false,
      txnRef: null,
      paymentUrl: null,
      message: "Failed to initialize escrow payment.",
    };
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
      paymentProvider: "mock",
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

export async function verifyAndHoldEscrow(
  txnRef: string,
  provider?: "interswitch" | "paystack",
) {
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

    const resolvedProvider = provider ?? txn.paymentProvider ?? "interswitch";

    if (resolvedProvider === "paystack") {
      // Verify via Paystack
      const psResult = await verifyPaystackTransaction(txnRef);

      if (!psResult || psResult.status !== "success") {
        return { success: false, message: "Payment not confirmed by Paystack." };
      }

      // Verify amount matches
      if (String(psResult.amount) !== txn.amount) {
        return { success: false, message: "Payment amount mismatch." };
      }

      await db
        .update(escrowTransaction)
        .set({
          status: "held",
          providerRef: psResult.reference,
          updatedAt: new Date(),
        })
        .where(eq(escrowTransaction.transactionRef, txnRef));
    } else {
      // Verify via Interswitch
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
    }

    return { success: true };
  } catch (error) {
    console.error("Verify escrow failed:", error);
    return { success: false, message: "Verification failed." };
  }
}

