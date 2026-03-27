/**
 * Interswitch QuickTeller Web payment integration (sandbox).
 *
 * Sandbox base:  https://sandbox.interswitchng.com
 * OAuth token:   POST /passport/oauth/token
 * Pay status:    GET  /collections/api/v1/gettransaction.json?merchantcode=&transactionreference=&amount=
 *
 * Default test credentials (publicly documented by Interswitch):
 *   Client ID:     IKIAB23A4E2756605C1ABC33CE3C287E27267F660D61
 *   Secret:        secret
 *   Merchant Code: MX6072
 *   Pay Item ID:   9405967
 *
 * To use live credentials, set INTERSWITCH_CLIENT_ID, INTERSWITCH_SECRET,
 * INTERSWITCH_MERCHANT_CODE, INTERSWITCH_PAY_ITEM_ID in .env.local and
 * NEXT_PUBLIC_INTERSWITCH_ENV=production.
 */

import crypto from "crypto";

const IS_PRODUCTION =
  process.env.NEXT_PUBLIC_INTERSWITCH_ENV === "production";

const SANDBOX_BASE = "https://sandbox.interswitchng.com";
const PROD_BASE = "https://webpay.interswitchng.com";

export const ISW_CONFIG = {
  base: IS_PRODUCTION ? PROD_BASE : SANDBOX_BASE,
  clientId:
    process.env.INTERSWITCH_CLIENT_ID ??
    "IKIAB23A4E2756605C1ABC33CE3C287E27267F660D61",
  secret: process.env.INTERSWITCH_SECRET ?? "secret",
  merchantCode: process.env.INTERSWITCH_MERCHANT_CODE ?? "MX6072",
  payItemId: process.env.INTERSWITCH_PAY_ITEM_ID ?? "9405967",
  // Payment page URL (redirect approach)
  paymentPageUrl: IS_PRODUCTION
    ? "https://webpay.interswitchng.com/collections/w/pay"
    : "https://sandbox.interswitchng.com/collections/w/pay",
};

/** Generate a unique transaction reference */
export function generateTxnRef(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `AUR-${timestamp}-${random}`;
}

/**
 * Build the SHA-512 hash required by Interswitch for the payment page.
 * hash = SHA512(txnRef + productId + payItemId + amount + site_redirect_url + merchantCode + clientId + secret)
 */
export function buildPaymentHash(params: {
  txnRef: string;
  amount: string; // in kobo
  redirectUrl: string;
}): string {
  const raw = [
    params.txnRef,
    ISW_CONFIG.payItemId,
    ISW_CONFIG.payItemId,
    params.amount,
    params.redirectUrl,
    ISW_CONFIG.merchantCode,
    ISW_CONFIG.clientId,
    ISW_CONFIG.secret,
  ].join("");

  return crypto.createHash("sha512").update(raw).digest("hex");
}

/**
 * Build the full set of query params to redirect the user to the
 * Interswitch hosted payment page.
 */
export function buildPaymentRedirectUrl(params: {
  txnRef: string;
  amount: string; // in kobo
  customerEmail: string;
  customerName: string;
  description: string;
  redirectUrl: string;
}): string {
  const hash = buildPaymentHash({
    txnRef: params.txnRef,
    amount: params.amount,
    redirectUrl: params.redirectUrl,
  });

  const qs = new URLSearchParams({
    merchantCode: ISW_CONFIG.merchantCode,
    payItemID: ISW_CONFIG.payItemId,
    amount: params.amount,
    transactionreference: params.txnRef,
    customer_id: params.customerEmail,
    customer_lastname: params.customerName,
    site_redirect_url: params.redirectUrl,
    pay_item_name: params.description,
    hash,
    mode: "TEST",
  });

  return `${ISW_CONFIG.paymentPageUrl}?${qs.toString()}`;
}

export interface ISWTransactionStatus {
  ResponseCode: string;
  ResponseDescription: string;
  Amount: string;
  TransactionReference: string;
  PaymentReference: string;
  MerchantStoreId: string;
}

/**
 * Query Interswitch sandbox to verify transaction status.
 * Used in the webhook/callback handler after the user returns from payment page.
 */
export async function queryTransactionStatus(
  txnRef: string,
  amountInKobo: string,
): Promise<ISWTransactionStatus | null> {
  try {
    // OAuth token first
    const tokenRes = await fetch(
      `${ISW_CONFIG.base}/passport/oauth/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(
            `${ISW_CONFIG.clientId}:${ISW_CONFIG.secret}`,
          ).toString("base64")}`,
        },
        body: new URLSearchParams({ grant_type: "client_credentials" }),
      },
    );

    if (!tokenRes.ok) return null;
    const { access_token } = (await tokenRes.json()) as {
      access_token: string;
    };

    // Query transaction status
    const statusUrl = new URL(
      `${ISW_CONFIG.base}/collections/api/v1/gettransaction.json`,
    );
    statusUrl.searchParams.set("merchantcode", ISW_CONFIG.merchantCode);
    statusUrl.searchParams.set("transactionreference", txnRef);
    statusUrl.searchParams.set("amount", amountInKobo);

    const statusRes = await fetch(statusUrl.toString(), {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!statusRes.ok) return null;
    return (await statusRes.json()) as ISWTransactionStatus;
  } catch {
    return null;
  }
}

/** ResponseCode "00" means successful payment in Interswitch */
export function isPaymentSuccessful(status: ISWTransactionStatus): boolean {
  return status.ResponseCode === "00";
}
