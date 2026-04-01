import { NextResponse } from "next/server";
import { and, eq, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { patientHospitalLink, user } from "@/lib/db/schema";
import {
  type VapiToolCallBody,
  parseToolArgs,
  toolResult,
  verifyVapiSecret,
} from "@/lib/vapi-tool-auth";

/**
 * VAPI Tool: checkPatient
 *
 * Looks up a caller by phone number or email to determine whether they have
 * an AuraHealth account. Returns registration status, patientId, name, and
 * their approved linked hospitals so the assistant can personalise the call.
 *
 * VAPI sends:  POST /api/vapi/tools/check-patient
 *              x-vapi-secret: <VAPI_TOOL_SECRET>
 */
export async function POST(request: Request) {
  if (!verifyVapiSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as VapiToolCallBody;
  const toolCallId = body.message.toolCallList[0]?.id ?? "";
  const args = parseToolArgs(body);

  const phoneNumber = typeof args.phoneNumber === "string" ? args.phoneNumber.trim() : "";
  const email = typeof args.email === "string" ? args.email.trim().toLowerCase() : "";

  if (!phoneNumber && !email) {
    return NextResponse.json(
      toolResult(toolCallId, "I need either a phone number or email address to look you up. Could you please provide one?"),
    );
  }

  try {
    const conditions: ReturnType<typeof eq>[] = [];
    if (email) conditions.push(eq(user.email, email));
    if (phoneNumber) conditions.push(eq(user.phoneNumber, phoneNumber));

    const patient = await db
      .select({ id: user.id, name: user.name, email: user.email, phoneNumber: user.phoneNumber })
      .from(user)
      .where(and(eq(user.role, "patient"), or(...conditions)))
      .then((r) => r[0] ?? null);

    if (!patient) {
      return NextResponse.json(
        toolResult(
          toolCallId,
          JSON.stringify({
            registered: false,
            message:
              "I couldn't find an AuraHealth account with those details. Would you like me to create one for you right now?",
          }),
        ),
      );
    }

    // Fetch approved hospital links
    const links = await db
      .select({ hospitalName: user.name, status: patientHospitalLink.status })
      .from(patientHospitalLink)
      .innerJoin(user, eq(patientHospitalLink.hospitalId, user.id))
      .where(
        and(
          eq(patientHospitalLink.patientId, patient.id),
          or(
            eq(patientHospitalLink.status, "approved"),
            eq(patientHospitalLink.status, "auto"),
          ),
        ),
      );

    const hospitals = links.map((l) => l.hospitalName);

    const hospitalMsg =
      hospitals.length > 0
        ? `You are linked to ${hospitals.join(" and ")}.`
        : "You are not yet linked to a hospital.";

    return NextResponse.json(
      toolResult(
        toolCallId,
        JSON.stringify({
          registered: true,
          patientId: patient.id,
          name: patient.name,
          linkedHospitals: hospitals,
          message: `Welcome back, ${patient.name}. ${hospitalMsg}`,
        }),
      ),
    );
  } catch (error) {
    console.error("[vapi/tools/check-patient] error:", error);
    return NextResponse.json(
      toolResult(toolCallId, "I'm having trouble looking up your account right now. Please try again in a moment."),
    );
  }
}
