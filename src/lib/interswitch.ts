/**
 * Interswitch QuickTeller Business — Integration
 *
 * Based on official Interswitch API documentation:
 *   https://docs.interswitchgroup.com
 *
 * Three APIs used:
 *
 * 1. Accept Payments — Pay Bill API (server-side payment link creation)
 *    POST /collections/api/v1/pay-bill
 *    Returns a paymentUrl the patient is redirected to.
 *
 * 2. Transaction Verification — confirm payment before giving value
 *    GET /collections/api/v1/gettransaction.json
 *    ResponseCode "00" = success.
 *
 * 3. Payouts — disburse escrow funds to hospital bank account
 *    POST /api/v1/payouts
 *    Transfer from our QuickTeller wallet to hospital's bank account.
 *
 * OAuth:
 *    POST /passport/oauth/token (Basic auth, client_credentials)
 *
 * Sandbox base URLs:
 *    API:          https://qa.interswitchng.com
 *    Payment page: https://newwebpay.qa.interswitchng.com
 *
 * Production base URLs:
 *    API:          https://webpay.interswitchng.com
 *    Payment page: https://newwebpay.interswitchng.com
 *
 * Required environment variables (set in Vercel + .env.local):
 *   INTERSWITCH_CLIENT_ID      — from Developer Tools → API/SDK Integration
 *   INTERSWITCH_SECRET         — from Developer Tools → API/SDK Integration
 *   INTERSWITCH_MERCHANT_CODE  — from Developer Tools → Merchant Credentials
 *   INTERSWITCH_PAY_ITEM_ID    — from Developer Tools → Merchant Credentials
 *   NEXT_PUBLIC_INTERSWITCH_ENV— "sandbox" (default) or "production"
 */

const IS_PRODUCTION =
  process.env.NEXT_PUBLIC_INTERSWITCH_ENV === "production";

const SANDBOX_API_BASE = "https://qa.interswitchng.com";
const PROD_API_BASE = "https://webpay.interswitchng.com";

const SANDBOX_PAYMENT_PAGE = "https://newwebpay.qa.interswitchng.com/collections/w/pay";
const PROD_PAYMENT_PAGE = "https://newwebpay.interswitchng.com/collections/w/pay";

export const ISW_CONFIG = {
  apiBase: IS_PRODUCTION ? PROD_API_BASE : SANDBOX_API_BASE,
  clientId: process.env.INTERSWITCH_CLIENT_ID ?? "",
  secret: process.env.INTERSWITCH_SECRET ?? "",
  merchantCode: process.env.INTERSWITCH_MERCHANT_CODE ?? "",
  payItemId: process.env.INTERSWITCH_PAY_ITEM_ID ?? "",
  paymentPageUrl: IS_PRODUCTION ? PROD_PAYMENT_PAGE : SANDBOX_PAYMENT_PAGE,
};

// ─── Transaction reference ──────────────────────────────────────────────────

/** Generate a unique transaction reference */
export function generateTxnRef(): string {
  const ts = Date.now().toString().slice(-8);
  const rnd = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `AUR${ts}${rnd}`;
}

// ─── OAuth 2.0 ──────────────────────────────────────────────────────────────

/** Get a short-lived OAuth bearer token from Interswitch Passport */
export async function getAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(
      `${ISW_CONFIG.apiBase}/passport/oauth/token?grant_type=client_credentials`,
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
    if (!res.ok) return null;
    const json = (await res.json()) as { access_token?: string };
    return json.access_token ?? null;
  } catch {
    return null;
  }
}

// ─── Accept Payments — Pay Bill API (Path C from Interswitch docs) ──────────

export interface PayBillResponse {
  id: number;
  merchantCode: string;
  payableCode: string;
  amount: number;
  code: string;
  reference: string;
  paymentUrl: string;
  redirectUrl: string;
  customerId: string;
  customerEmail: string;
  currencyCode: string;
}

/**
 * Create a payment link via the Pay Bill API.
 * Returns a paymentUrl to redirect the patient to.
 *
 * POST /collections/api/v1/pay-bill
 */
export async function createPayBillLink(params: {
  txnRef: string;
  amountKobo: number;
  customerEmail: string;
  redirectUrl: string;
}): Promise<PayBillResponse | null> {
  try {
    const token = await getAccessToken();
    if (!token) {
      console.error("Interswitch pay-bill failed: could not obtain OAuth access token");
      return null;
    }

    if (!ISW_CONFIG.merchantCode || !ISW_CONFIG.payItemId) {
      console.error("Interswitch pay-bill failed: missing merchantCode or payItemId");
      return null;
    }

    const res = await fetch(
      `${ISW_CONFIG.apiBase}/collections/api/v1/pay-bill`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          merchantCode: ISW_CONFIG.merchantCode,
          payableCode: ISW_CONFIG.payItemId,
          amount: String(params.amountKobo),
          redirectUrl: params.redirectUrl,
          customerId: params.customerEmail,
          currencyCode: "566",
          customerEmail: params.customerEmail,
        }),
      },
    );
    if (!res.ok) {
      const errText = await res.text();
      console.error("Interswitch pay-bill failed:", res.status, errText);
      return null;
    }

    const json = (await res.json()) as PayBillResponse;
    if (!json?.paymentUrl) {
      console.error("Interswitch pay-bill failed: response missing paymentUrl", json);
      return null;
    }

    return json;
  } catch {
    return null;
  }
}

/**
 * Build a direct redirect URL for the Interswitch hosted payment page.
 * Fallback if Pay Bill API is unavailable — uses Web Redirect (Path B).
 *
 * No hash required per current Interswitch QuickStart documentation.
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

  const qs = new URLSearchParams({
    merchant_code: ISW_CONFIG.merchantCode,
    pay_item_id: ISW_CONFIG.payItemId,
    txn_ref: params.txnRef,
    amount: amountKobo,
    currency: "566",
    site_redirect_url: params.redirectUrl,
    cust_email: params.customerEmail,
    cust_name: params.customerName,
    pay_item_name: params.description,
    mode: IS_PRODUCTION ? "LIVE" : "TEST",
  });

  return `${ISW_CONFIG.paymentPageUrl}?${qs.toString()}`;
}

// ─── Transaction Verification ───────────────────────────────────────────────

export interface ISWTransactionStatus {
  ResponseCode: string;
  ResponseDescription: string;
  Amount: number;
  MerchantReference: string;
  PaymentReference: string;
  TransactionDate: string;
  RetrievalReferenceNumber: string;
}

/**
 * Verify a completed transaction with Interswitch.
 *
 * GET /collections/api/v1/gettransaction.json
 *
 * CRITICAL: Always verify two things:
 *   1. ResponseCode is "00" (approved)
 *   2. Amount matches the amount originally charged
 */
export async function queryTransactionStatus(
  txnRef: string,
  amountKobo: string,
): Promise<ISWTransactionStatus | null> {
  try {
    const url = new URL(
      `${ISW_CONFIG.apiBase}/collections/api/v1/gettransaction.json`,
    );
    url.searchParams.set("merchantcode", ISW_CONFIG.merchantCode);
    url.searchParams.set("transactionreference", txnRef);
    url.searchParams.set("amount", amountKobo);

    const res = await fetch(url.toString(), {
      headers: { "Content-Type": "application/json" },
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

// ─── Payouts — disburse escrow to hospital bank account ─────────────────────

export interface PayoutResponse {
  transactionReference: string;
  status: string;
  responseCode: string;
  responseDescription: string;
  amount: number;
  recipientAccount: string;
  recipientBank: string;
  recipientName: string;
}

/**
 * Transfer funds from our QuickTeller wallet to a hospital's bank account.
 * Called when escrow is released after treatment is complete.
 *
 * POST /api/v1/payouts
 *
 * Requires:
 *   - INTERSWITCH_WALLET_ID in env (from QuickTeller Business → Wallets)
 *   - INTERSWITCH_WALLET_PIN in env
 *   - Hospital's bank account number and bank code
 */
export async function createPayout(params: {
  transactionRef: string;
  amountNaira: number;
  recipientAccount: string;
  recipientBank: string;
  narration: string;
}): Promise<PayoutResponse | null> {
  try {
    const token = await getAccessToken();
    if (!token) return null;

    const res = await fetch(`${ISW_CONFIG.apiBase}/api/v1/payouts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        transactionReference: params.transactionRef,
        payoutChannel: "BANK_TRANSFER",
        currencyCode: "NGN",
        amount: params.amountNaira,
        narration: params.narration,
        walletDetails: {
          walletId: process.env.INTERSWITCH_WALLET_ID ?? "",
          pin: process.env.INTERSWITCH_WALLET_PIN ?? "",
        },
        recipient: {
          recipientAccount: params.recipientAccount,
          recipientBank: params.recipientBank,
          currencyCode: "NGN",
        },
        singleCall: true,
      }),
    });
    if (!res.ok) return null;
    return (await res.json()) as PayoutResponse;
  } catch {
    return null;
  }
}
