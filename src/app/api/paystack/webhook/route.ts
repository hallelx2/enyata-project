import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { escrowTransaction } from "@/lib/db/schema";
import { verifyPaystackWebhookSignature } from "@/lib/paystack";

/**
 * Paystack Webhook — receives POST notifications for transaction events.
 *
 * Set this URL in Paystack Dashboard → Settings → API Keys & Webhooks:
 *   https://aurahealth-five.vercel.app/api/paystack/webhook
 *
 * Paystack sends a JSON payload when a charge succeeds (event: "charge.success").
 * We use this as backup verification — even if the patient closes their
 * browser before the redirect callback fires, this webhook will still update
 * the escrow record.
 *
 * The signature is verified via HMAC-SHA-512 using the Paystack secret key.
 * Always return 200 to Paystack — they retry on non-200.
 */

interface PaystackWebhookPayload {
  event: string;
  data?: {
    reference?: string;
    amount?: number;
    status?: string;
    gateway_response?: string;
  };
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-paystack-signature");

    // Verify webhook signature
    if (!verifyPaystackWebhookSignature(rawBody, signature)) {
      return NextResponse.json(
        { received: false, error: "Invalid signature" },
        { status: 401 },
      );
    }

    const body = JSON.parse(rawBody) as PaystackWebhookPayload;

    // Only process charge.success events
    if (body.event !== "charge.success") {
      return NextResponse.json({ received: true });
    }

    const reference = body.data?.reference;
    if (!reference) {
      return NextResponse.json(
        { received: true, error: "No reference" },
        { status: 400 },
      );
    }

    // Find the escrow record
    const txn = await db
      .select()
      .from(escrowTransaction)
      .where(eq(escrowTransaction.transactionRef, reference))
      .then((r) => r[0]);

    if (!txn) {
      return NextResponse.json({
        received: true,
        error: "Transaction not found",
      });
    }

    // Only process if still pending — avoid overwriting held/released/refunded
    if (txn.status !== "pending") {
      return NextResponse.json({ received: true, status: txn.status });
    }

    // Verify amount matches
    if (body.data?.amount != null && String(body.data.amount) !== txn.amount) {
      return NextResponse.json({
        received: true,
        error: "Amount mismatch",
        status: "pending",
      });
    }

    // Mark escrow as held
    if (body.data?.status === "success") {
      await db
        .update(escrowTransaction)
        .set({
          status: "held",
          providerRef: reference,
          updatedAt: new Date(),
        })
        .where(eq(escrowTransaction.transactionRef, reference));

      return NextResponse.json({ received: true, status: "held" });
    }

    // Payment not successful
    return NextResponse.json({
      received: true,
      status: "pending",
      gatewayResponse: body.data?.gateway_response,
    });
  } catch (error) {
    console.error("Paystack webhook error:", error);
    return NextResponse.json(
      { received: true, error: "Processing failed" },
      { status: 500 },
    );
  }
}
