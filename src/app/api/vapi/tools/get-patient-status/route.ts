import { NextResponse } from "next/server";
import { and, desc, eq, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { escrowTransaction, triageRequest, user } from "@/lib/db/schema";
import {
  type VapiToolCallBody,
  parseToolArgs,
  toolResult,
  verifyVapiSecret,
} from "@/lib/vapi-tool-auth";

/**
 * VAPI Tool: getPatientStatus
 *
 * Returns a summary of the patient's active triage requests and any escrow
 * holds. Useful for re-identifying call context mid-conversation or for
 * answering "what's the status of my request?" questions.
 *
 * VAPI sends:  POST /api/vapi/tools/get-patient-status
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

  if (!patientId) {
    return NextResponse.json(
      toolResult(toolCallId, "I need your patient ID to check your status. Let me look you up first — what's your phone number or email?"),
    );
  }

  try {
    // Active triages (pending or in_progress)
    const triages = await db
      .select({
        id: triageRequest.id,
        symptoms: triageRequest.symptoms,
        severity: triageRequest.severity,
        status: triageRequest.status,
        escrowRef: triageRequest.escrowRef,
        createdAt: triageRequest.createdAt,
        hospitalName: user.name,
      })
      .from(triageRequest)
      .innerJoin(user, eq(triageRequest.hospitalId, user.id))
      .where(
        and(
          eq(triageRequest.patientId, patientId),
          or(eq(triageRequest.status, "pending"), eq(triageRequest.status, "in_progress")),
        ),
      )
      .orderBy(desc(triageRequest.createdAt))
      .limit(3);

    // Held escrows
    const escrows = await db
      .select({ amount: escrowTransaction.amount, transactionRef: escrowTransaction.transactionRef })
      .from(escrowTransaction)
      .where(
        and(
          eq(escrowTransaction.patientId, patientId),
          eq(escrowTransaction.status, "held"),
        ),
      );

    if (triages.length === 0 && escrows.length === 0) {
      return NextResponse.json(
        toolResult(toolCallId, "You don't have any active triage requests or pending payments at the moment. Is there something I can help you with?"),
      );
    }

    const triageSummary = triages
      .map(
        (t) =>
          `${t.status === "in_progress" ? "In progress" : "Pending"} triage at ${t.hospitalName} (${t.severity} severity) — submitted on ${new Date(t.createdAt).toLocaleDateString("en-NG")}${t.escrowRef ? ", payment pre-authorised" : ""}`,
      )
      .join(". ");

    const escrowSummary =
      escrows.length > 0
        ? ` You have ₦${escrows.reduce((sum, e) => sum + Number(e.amount), 0) / 100} held in escrow.`
        : "";

    return NextResponse.json(
      toolResult(
        toolCallId,
        JSON.stringify({
          activeTriages: triages.length,
          heldEscrows: escrows.length,
          message: `Here is your current status: ${triageSummary || "No active triages"}.${escrowSummary}`,
        }),
      ),
    );
  } catch (error) {
    console.error("[vapi/tools/get-patient-status] error:", error);
    return NextResponse.json(
      toolResult(toolCallId, "I had trouble retrieving your status. Please try again in a moment."),
    );
  }
}
