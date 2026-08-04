/**
 * Paystack Payment Integration
 *
 * Simple fetch-based integration — no SDK needed.
 * Paystack uses the same https://api.paystack.co for both test and live;
 * the key prefix (sk_test_ vs sk_live_) determines the mode.
 *
 * Required environment variables:
 *   PAYSTACK_SECRET_KEY  — from Paystack Dashboard → Settings → API Keys
 *   PAYSTACK_PUBLIC_KEY  — (optional, only needed for inline.js which we don't use)
 */

import crypto from "node:crypto";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY ?? "";
const BASE = "https://api.paystack.co";

function headers() {
  return {
    Authorization: `Bearer ${PAYSTACK_SECRET}`,
    "Content-Type": "application/json",
  };
}

// ─── Initialize Transaction ─────────────────────────────────────────────────

export interface PaystackInitResponse {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

/**
 * Initialize a Paystack transaction — returns a hosted checkout URL.
 *
 * POST /transaction/initialize
 */
export async function initializePaystackTransaction(params: {
  txnRef: string;
  amountKobo: number;
  customerEmail: string;
  callbackUrl: string;
}): Promise<PaystackInitResponse | null> {
  try {
    const res = await fetch(`${BASE}/transaction/initialize`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        email: params.customerEmail,
        amount: params.amountKobo,
        reference: params.txnRef,
        callback_url: params.callbackUrl,
        currency: "NGN",
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Paystack initialize failed:", res.status, errText);
      return null;
    }

    const json = (await res.json()) as {
      status: boolean;
      data?: { authorization_url?: string; access_code?: string; reference?: string };
    };

    if (!json.status || !json.data?.authorization_url) {
      console.error("Paystack initialize failed: unexpected response", json);
      return null;
    }

    return {
      authorizationUrl: json.data.authorization_url,
      accessCode: json.data.access_code ?? "",
      reference: json.data.reference ?? params.txnRef,
    };
  } catch (error) {
    console.error("Paystack initialize error:", error);
    return null;
  }
}

// ─── Verify Transaction ─────────────────────────────────────────────────────

export interface PaystackVerifyResponse {
  status: string; // "success" | "failed" | "abandoned"
  amount: number; // kobo
  reference: string;
  gatewayResponse: string;
}

/**
 * Verify a completed Paystack transaction.
 *
 * GET /transaction/verify/:reference
 *
 * CRITICAL: Always verify:
 *   1. status is "success"
 *   2. amount matches what you charged
 */
export async function verifyPaystackTransaction(
  reference: string,
): Promise<PaystackVerifyResponse | null> {
  try {
    const res = await fetch(
      `${BASE}/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: headers() },
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error("Paystack verify failed:", res.status, errText);
      return null;
    }

    const json = (await res.json()) as {
      status: boolean;
      data?: {
        status?: string;
        amount?: number;
        reference?: string;
        gateway_response?: string;
      };
    };

    if (!json.status || !json.data) {
      console.error("Paystack verify failed: unexpected response", json);
      return null;
    }

    return {
      status: json.data.status ?? "failed",
      amount: json.data.amount ?? 0,
      reference: json.data.reference ?? reference,
      gatewayResponse: json.data.gateway_response ?? "",
    };
  } catch (error) {
    console.error("Paystack verify error:", error);
    return null;
  }
}

// ─── Webhook Signature Verification ─────────────────────────────────────────

/**
 * Verify Paystack webhook signature (HMAC-SHA-512).
 * The signature is sent in the `x-paystack-signature` header.
 * Paystack uses the secret key itself as the HMAC key.
 */
export function verifyPaystackWebhookSignature(
  rawBody: string,
  signature: string | null,
): boolean {
  if (!PAYSTACK_SECRET || !signature) return false;
  const expected = crypto
    .createHmac("sha512", PAYSTACK_SECRET)
    .update(rawBody)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(signature, "hex"),
    );
  } catch {
    return false;
  }
}
