import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { escrowTransaction } from "@/lib/db/schema";

/**
 * Interswitch Webhook — receives POST notifications for transaction status changes.
 *
 * Set this URL in QuickTeller Business → Settings → Webhooks:
 *   https://aurahealth-five.vercel.app/api/interswitch/webhook
 *
 * Enable toggles: Transactions, Payout
 *
 * Interswitch POSTs a JSON payload when a transaction status changes.
 * We use this as a backup verification — even if the patient closes
 * their browser before the redirect, this webhook will still fire.
 */

interface InterswitchWebhookPayload {
  transactionReference?: string;
  amount?: number;
  responseCode?: string;
  responseDescription?: string;
  paymentReference?: string;
  channel?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as InterswitchWebhookPayload;

    const txnRef = body.transactionReference;
    if (!txnRef) {
      return NextResponse.json({ received: true, error: "No transaction reference" }, { status: 400 });
    }

    // Find the escrow record
    const txn = await db
      .select()
      .from(escrowTransaction)
      .where(eq(escrowTransaction.transactionRef, txnRef))
      .then((r) => r[0]);

    if (!txn) {
      return NextResponse.json({ received: true, error: "Transaction not found" });
    }

    // Only process if still pending — avoid overwriting held/released/refunded
    if (txn.status !== "pending") {
      return NextResponse.json({ received: true, status: txn.status });
    }

    // ResponseCode "00" = successful payment
    if (body.responseCode === "00") {
      await db
        .update(escrowTransaction)
        .set({
          status: "held",
          interswitchRef: body.paymentReference ?? null,
          updatedAt: new Date(),
        })
        .where(eq(escrowTransaction.transactionRef, txnRef));

      return NextResponse.json({ received: true, status: "held" });
    }

    // Any other response code = payment failed
    return NextResponse.json({
      received: true,
      status: "pending",
      responseCode: body.responseCode,
      responseDescription: body.responseDescription,
    });
  } catch (error) {
    console.error("Interswitch webhook error:", error);
    return NextResponse.json({ received: true, error: "Processing failed" }, { status: 500 });
  }
}
