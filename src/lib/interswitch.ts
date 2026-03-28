/**
 * Interswitch QuickTeller Business — Sandbox integration
 *
 * Sandbox base:      https://sandbox.interswitchng.com
 * OAuth token:       POST /passport/oauth/token
 * Payment page:      https://sandbox.interswitchng.com/collections/w/pay
 * Transaction query: GET  /collections/api/v1/gettransaction.json
 *
 * Required environment variables (set in Vercel + .env.local):
 *   INTERSWITCH_CLIENT_ID      — from Interswitch dashboard (API/SDK → Client ID)
 *   INTERSWITCH_SECRET         — from Interswitch dashboard (API/SDK → Secret key)
 *   INTERSWITCH_MERCHANT_CODE  — from Interswitch dashboard (Merchant Credentials)
 *   INTERSWITCH_PAY_ITEM_ID    — from Interswitch dashboard (Pay item ID)
 *   INTERSWITCH_PRODUCT_ID     — numeric product ID from Interswitch dashboard
 *   INTERSWITCH_MAC_KEY        — MAC key from Interswitch (sandbox demo key below)
 *   NEXT_PUBLIC_INTERSWITCH_ENV— "sandbox" (default) or "production"
 *
 * Sandbox demo MAC key (use until Interswitch provides a merchant-specific one):
 *   D3D1D05AFE42AD50818167EAC73C109168A0F108F32645C8B59E897FA930DA44F9230910DAC9E20641823799A107A02068F7BC0F4CC41D2952E249552255710F
 */

import crypto from "node:crypto";

const IS_PRODUCTION =
  process.env.NEXT_PUBLIC_INTERSWITCH_ENV === "production";

const SANDBOX_BASE = "https://sandbox.interswitchng.com";
const PROD_BASE    = "https://webpay.interswitchng.com";

export const ISW_CONFIG = {
  base:         IS_PRODUCTION ? PROD_BASE : SANDBOX_BASE,
  clientId:     process.env.INTERSWITCH_CLIENT_ID    ?? "",
  secret:       process.env.INTERSWITCH_SECRET       ?? "",
  merchantCode: process.env.INTERSWITCH_MERCHANT_CODE ?? "",
  payItemId:    process.env.INTERSWITCH_PAY_ITEM_ID   ?? "",
  /** Numeric product ID — find this on the Interswitch dashboard */
  productId:    process.env.INTERSWITCH_PRODUCT_ID    ?? "",
  /**
   * MAC key — provided by Interswitch; for sandbox testing use the
   * demo key documented at sandbox.interswitchng.com/docbase
   */
  macKey:       process.env.INTERSWITCH_MAC_KEY ?? "",
  paymentPageUrl: IS_PRODUCTION
    ? "https://webpay.interswitchng.com/collections/w/pay"
    : "https://sandbox.interswitchng.com/collections/w/pay",
};

/** Generate a unique transaction reference (max 15 chars alphanumeric) */
export function generateTxnRef(): string {
  const ts  = Date.now().toString().slice(-8);
  const rnd = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `AUR${ts}${rnd}`;
}

/**
 * SHA-512 hash required by QuickTeller Web.
 *
 * Official formula (Interswitch DocBase — request-hash-calculation):
 *   SHA512( txn_ref + product_id + pay_item_id + amount + site_redirect_url + MacKey )
 *
 * Amount must be in kobo (₦ × 100). No separators between values.
 */
export function buildPaymentHash(params: {
  txnRef: string;
  amountKobo: string;
  redirectUrl: string;
}): string {
  const raw = [
    params.txnRef,
    ISW_CONFIG.productId,
    ISW_CONFIG.payItemId,
    params.amountKobo,
    params.redirectUrl,
    ISW_CONFIG.macKey,
  ].join("");

  return crypto.createHash("sha512").update(raw).digest("hex");
}

/**
 * Build the POST body / query string for the Interswitch hosted payment page.
 * Amount is in Naira — converted to kobo internally.
 *
 * Official field names per Interswitch DocBase — http-post-form-fields:
 *   merchant_code, pay_item_id, txn_ref, amount (kobo), currency (566=NGN),
 *   site_redirect_url, cust_id, hash, mode
 */
export function buildPaymentRedirectUrl(params: {
  txnRef: string;
  amountNaira: number;
  customerEmail: string;
  customerName: string;
  description: string;
  redirectUrl: string;
}): string {
  const amountKobo = String(params.amountNaira * 100);

  const hash = buildPaymentHash({
    txnRef: params.txnRef,
    amountKobo,
    redirectUrl: params.redirectUrl,
  });

  const qs = new URLSearchParams({
    merchant_code:      ISW_CONFIG.merchantCode,
    pay_item_id:        ISW_CONFIG.payItemId,
    txn_ref:            params.txnRef,
    amount:             amountKobo,
    currency:           "566",           // NGN ISO 4217 numeric
    site_redirect_url:  params.redirectUrl,
    cust_id:            params.customerEmail,
    cust_name:          params.customerName,
    pay_item_name:      params.description,
    hash,
    mode: IS_PRODUCTION ? "LIVE" : "TEST",
  });

  return `${ISW_CONFIG.paymentPageUrl}?${qs.toString()}`;
}

/** Get a short-lived OAuth bearer token from Interswitch Passport */
export async function getAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(`${ISW_CONFIG.base}/passport/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${ISW_CONFIG.clientId}:${ISW_CONFIG.secret}`,
        ).toString("base64")}`,
      },
      body: new URLSearchParams({ grant_type: "client_credentials" }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { access_token?: string };
    return json.access_token ?? null;
  } catch {
    return null;
  }
}

export interface ISWTransactionStatus {
  ResponseCode:         string;
  ResponseDescription:  string;
  Amount:               string;
  TransactionReference: string;
  PaymentReference:     string;
  MerchantStoreId:      string;
}

/**
 * Verify a completed transaction with Interswitch.
 * Call from /api/escrow/callback after the user returns from the payment page.
 *
 * Uses: GET /collections/api/v1/gettransaction.json (Bearer token auth)
 * Amount must be in kobo.
 */
export async function queryTransactionStatus(
  txnRef: string,
  amountKobo: string,
): Promise<ISWTransactionStatus | null> {
  try {
    const token = await getAccessToken();
    if (!token) return null;

    const url = new URL(
      `${ISW_CONFIG.base}/collections/api/v1/gettransaction.json`,
    );
    url.searchParams.set("merchantcode",         ISW_CONFIG.merchantCode);
    url.searchParams.set("transactionreference", txnRef);
    url.searchParams.set("amount",               amountKobo);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return (await res.json()) as ISWTransactionStatus;
  } catch {
    return null;
  }
}

/** ResponseCode "00" = successful payment */
export function isPaymentSuccessful(status: ISWTransactionStatus): boolean {
  return status.ResponseCode === "00";
}
