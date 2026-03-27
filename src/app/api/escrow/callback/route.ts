import { type NextRequest, NextResponse } from "next/server";
import { verifyAndHoldEscrow } from "@/modules/escrow/actions";

/**
 * Interswitch redirects the customer here after payment attempt.
 * URL: /api/escrow/callback?txnRef=AUR-...&resp=...
 *
 * We verify with Interswitch, mark the escrow as "held" if successful,
 * then redirect the patient to their dashboard with a status message.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const txnRef = searchParams.get("txnRef");
  const resp = searchParams.get("resp"); // Interswitch response code

  if (!txnRef) {
    return NextResponse.redirect(
      new URL("/dashboard/patient?escrow=error", request.url),
    );
  }

  // resp === "00" is a preliminary success signal from the redirect params;
  // we still verify server-side via the status API.
  const result = await verifyAndHoldEscrow(txnRef);

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
