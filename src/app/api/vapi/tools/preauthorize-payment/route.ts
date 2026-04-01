import { NextResponse } from "next/server";
import { initializeMockEscrow } from "@/modules/escrow/actions";
import { getLatestTriageForPatient, linkEscrowToTriage } from "@/modules/triage/actions";
import {
  type VapiToolCallBody,
  parseToolArgs,
  toolResult,
  verifyVapiSecret,
} from "@/lib/vapi-tool-auth";

/**
 * VAPI Tool: preauthorizePayment
 *
 * Pre-authorises ₦5,000 escrow against the patient's latest active triage.
 * Uses a mock escrow (no card redirect) appropriate for voice calls — the
 * patient confirms verbally, and the hold is recorded immediately.
 *
 * VAPI sends:  POST /api/vapi/tools/preauthorize-payment
 *              x-vapi-secret: <VAPI_TOOL_SECRET>
 */
export async function POST(request: Request) {
  if (!verifyVapiSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as VapiToolCallBody;
  const toolCallId = body.message.toolCallList[0]?.id ?? "";
  const args = parseToolArgs(body);

  const patientId = typeof args.patientId === "string" ? args.patientId.trim() : "";
  const confirmed = Boolean(args.confirmed);

  if (!patientId) {
    return NextResponse.json(
      toolResult(toolCallId, "I need to identify you before pre-authorising payment. Could you provide your phone number or email?"),
    );
  }

  if (!confirmed) {
    return NextResponse.json(
      toolResult(
        toolCallId,
        "Pre-authorisation was not confirmed. You can authorise the ₦5,000 care hold at any time from the AuraHealth app.",
      ),
    );
  }

  try {
    const latest = await getLatestTriageForPatient(patientId);

    if (!latest) {
      return NextResponse.json(
        toolResult(
          toolCallId,
          "I couldn't find an active triage request for you. Please complete a triage assessment first.",
        ),
      );
    }

    const escrow = await initializeMockEscrow({
      patientId,
      hospitalId: latest.hospitalId,
      amountNaira: 5000,
      description: "Voice triage care pre-authorisation",
    });

    if (!escrow.success || !escrow.txnRef) {
      return NextResponse.json(
        toolResult(
          toolCallId,
          "I was unable to process the pre-authorisation right now. You can complete it from the AuraHealth app.",
        ),
      );
    }

    await linkEscrowToTriage(latest.id, escrow.txnRef);

    return NextResponse.json(
      toolResult(
        toolCallId,
        `Five thousand Naira has been pre-authorised for your care at ${latest.hospitalName}. You will not face any billing delays on arrival. Your reference number is ${escrow.txnRef}.`,
      ),
    );
  } catch (error) {
    console.error("[vapi/tools/preauthorize-payment] error:", error);
    return NextResponse.json(
      toolResult(
        toolCallId,
        "Something went wrong with the pre-authorisation. You can complete it from the AuraHealth app before you arrive.",
      ),
    );
  }
}
