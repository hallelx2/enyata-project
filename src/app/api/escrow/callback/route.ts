import { type NextRequest, NextResponse } from "next/server";
import { verifyAndHoldEscrow } from "@/modules/escrow/actions";

/**
 * Shared payment callback — handles redirects from both Interswitch and Paystack.
 *
 * URL: /api/escrow/callback?txnRef=AUR-...&provider=paystack|interswitch[&resp=...]
 *
 * We verify with the appropriate provider, mark escrow as "held" if successful,
 * then redirect the patient to their dashboard with a status message.
 *
 * Note: Paystack appends &trxref=...&reference=... to the callback URL.
 * This doesn't conflict since we read txnRef by our own param name.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const txnRef = searchParams.get("txnRef");
  const provider = searchParams.get("provider") as "interswitch" | "paystack" | null;

  if (!txnRef) {
    return NextResponse.redirect(
      new URL("/dashboard/patient?escrow=error", request.url),
    );
  }

  // Verify server-side via the provider's status API.
  const result = await verifyAndHoldEscrow(txnRef, provider ?? undefined);

  if (result.success) {
    return NextResponse.redirect(
      new URL(
        `/dashboard/patient?escrow=held&ref=${txnRef}`,
        request.url,
      ),
    );
  }

  // Payment failed or not confirmed
  return NextResponse.redirect(
    new URL(
      `/dashboard/patient?escrow=failed&ref=${txnRef}`,
      request.url,
    ),
  );
}
