import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
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
 *
 * The webhook secret (from Settings → Webhooks → Notification Customization)
 * is used to verify the request signature via HMAC-SHA-512.
 */

const WEBHOOK_SECRET = process.env.INTERSWITCH_WEBHOOK_SECRET ?? "";

interface InterswitchWebhookPayload {
  transactionReference?: string;
  amount?: number;
  responseCode?: string;
  responseDescription?: string;
  paymentReference?: string;
  channel?: string;
}

function verifySignature(rawBody: string, signature: string | null): boolean {
  if (!WEBHOOK_SECRET || !signature) return !WEBHOOK_SECRET;
  const expected = crypto
    .createHmac("sha512", WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(signature, "hex"),
  );
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();

    // Verify webhook signature if secret is configured
    const signature = request.headers.get("x-interswitch-signature");
    if (WEBHOOK_SECRET && !verifySignature(rawBody, signature)) {
      return NextResponse.json({ received: false, error: "Invalid signature" }, { status: 401 });
    }

    const body = JSON.parse(rawBody) as InterswitchWebhookPayload;

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
