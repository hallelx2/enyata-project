import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { matchAndLinkPatientToHospitals } from "@/modules/patient/actions";
import {
  type VapiToolCallBody,
  parseToolArgs,
  toolResult,
  verifyVapiSecret,
} from "@/lib/vapi-tool-auth";

/**
 * VAPI Tool: registerPatient
 *
 * Creates a new AuraHealth patient account for the caller. A temporary random
 * password is generated — the patient uses the "Forgot password" flow in the
 * app to set their own. After creation the patient is automatically matched
 * and linked to any hospitals that have their EMR on file.
 *
 * VAPI sends:  POST /api/vapi/tools/register-patient
 *              x-vapi-secret: <VAPI_TOOL_SECRET>
 */
export async function POST(request: Request) {
  if (!verifyVapiSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as VapiToolCallBody;
  const toolCallId = body.message.toolCallList[0]?.id ?? "";
  const args = parseToolArgs(body);

  const name = typeof args.name === "string" ? args.name.trim() : "";
  const email = typeof args.email === "string" ? args.email.trim().toLowerCase() : "";
  const phoneNumber = typeof args.phoneNumber === "string" ? args.phoneNumber.trim() : "";

  if (!name || !email) {
    return NextResponse.json(
      toolResult(toolCallId, "I need your full name and email address to create your account. Could you provide those?"),
    );
  }

  // Basic email format check
  if (!email.includes("@")) {
    return NextResponse.json(
      toolResult(toolCallId, "That email address doesn't look right. Could you spell it out for me again?"),
    );
  }

  try {
    // Generate a secure temporary password — patient must reset via app
    const tempPassword = `Aura${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}!`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await auth.api.signUpEmail({ body: { name, email, password: tempPassword, role: "patient", phoneNumber: phoneNumber || undefined, isApproved: true } as any });

    // Better Auth returns the user object directly (not a Response)
    const patientId = (response as { user?: { id?: string } } | null)?.user?.id;

    if (!patientId) {
      return NextResponse.json(
        toolResult(toolCallId, "Your account was created but I had trouble retrieving it. Please open the AuraHealth app and use Forgot Password to set your password."),
      );
    }

    // Auto-link to any hospitals that have the patient's EMR data
    const linkedHospitalIds = await matchAndLinkPatientToHospitals(patientId);

    const linkMsg =
      linkedHospitalIds.length > 0
        ? `You've been automatically linked to ${linkedHospitalIds.length} hospital${linkedHospitalIds.length > 1 ? "s" : ""} based on your medical records.`
        : "You can link to a hospital from the app once you've set your password.";

    return NextResponse.json(
      toolResult(
        toolCallId,
        JSON.stringify({
          registered: true,
          patientId,
          name,
          message: `Your AuraHealth account has been created, ${name}. ${linkMsg} Please check your email — use the Forgot Password option in the app to set your password and complete your profile.`,
        }),
      ),
    );
  } catch (error) {
    console.error("[vapi/tools/register-patient] error:", error);
    return NextResponse.json(
      toolResult(toolCallId, "Something went wrong while creating your account. Please try signing up directly in the AuraHealth app."),
    );
  }
}
