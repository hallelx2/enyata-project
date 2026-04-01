import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createVertex } from "@ai-sdk/google-vertex";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { triageRequest } from "@/lib/db/schema";
import {
  createTriageRequest,
  getHospitalResourcesForRouting,
  getLatestTriageForPatient,
} from "@/modules/triage/actions";
import {
  type VapiToolCallBody,
  parseToolArgs,
  toolResult,
  verifyVapiSecret,
} from "@/lib/vapi-tool-auth";

/**
 * VAPI Tool: routeToHospital
 *
 * Accepts patient symptoms, creates a triage request in the database, runs
 * Gemini to generate a warm patient-facing routing message plus differential
 * diagnoses for the hospital, and returns the message to read aloud.
 *
 * VAPI sends:  POST /api/vapi/tools/route-to-hospital
 *              x-vapi-secret: <VAPI_TOOL_SECRET>
 */

function getVertex() {
  return createVertex({
    project: process.env.GOOGLE_VERTEX_PROJECT ?? "",
    location: process.env.GOOGLE_VERTEX_LOCATION ?? "us-central1",
    googleAuthOptions: {
      credentials: JSON.parse(process.env.GOOGLE_VERTEX_CREDENTIALS ?? "{}"),
    },
  });
}

interface RoutingResult {
  message: string;
  differentials: string[];
  clinicalSummary: string;
}

async function generateRoutingMessage(
  symptoms: string,
  severity: string,
  hospitalName: string,
  resources: Array<{
    name: string;
    category: string;
    availableCount: number | null;
    priceNaira: number | null;
    unit: string | null;
  }>,
): Promise<RoutingResult> {
  const urgency =
    severity === "critical" || severity === "high"
      ? " Given the urgency of your symptoms, please proceed immediately."
      : "";
  const fallback: RoutingResult = {
    message: `I've assessed your symptoms and you're being routed to ${hospitalName}. They've been notified and are expecting you.${urgency} Please make your way there as soon as you can.`,
    differentials: [],
    clinicalSummary: "",
  };

  try {
    const resourcesText =
      resources.length > 0
        ? `\nHospital available resources:\n${resources.map((r) => `- ${r.name} (${r.category}): ${r.availableCount ?? 0} available @ ₦${r.priceNaira ?? 0}/${r.unit ?? "unit"}`).join("\n")}`
        : "";

    const { text } = await generateText({
      model: getVertex()("gemini-2.5-pro"),
      prompt: `
You are generating a clinical routing response for AuraHealth's triage assistant.

Patient symptoms: "${symptoms}"
Severity level: ${severity}
Routed to: ${hospitalName}${resourcesText}

Return a JSON object with these exact keys:
- "message": warm 2-3 sentence routing message to read aloud to the patient (no clinical labels)
- "differentials": array of 3-5 differential diagnosis strings (medical terms)
- "clinicalSummary": 2-3 sentence clinical summary for the receiving doctor/nurse

Rules for message:
- Do NOT use clinical severity labels (low/medium/high/critical) directly
- Be reassuring and professional
- Tell them to proceed to the hospital
- If severity is critical or high, add a note about urgency

Respond ONLY with valid JSON, no markdown.
      `.trim(),
    });

    try {
      const parsed = JSON.parse(text) as Partial<RoutingResult>;
      return {
        message: typeof parsed.message === "string" ? parsed.message : fallback.message,
        differentials: Array.isArray(parsed.differentials) ? (parsed.differentials as string[]) : [],
        clinicalSummary: typeof parsed.clinicalSummary === "string" ? parsed.clinicalSummary : "",
      };
    } catch {
      return fallback;
    }
  } catch {
    return fallback;
  }
}

export async function POST(request: Request) {
  if (!verifyVapiSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as VapiToolCallBody;
  const toolCallId = body.message.toolCallList[0]?.id ?? "";
  const args = parseToolArgs(body);

  const patientId = typeof args.patientId === "string" ? args.patientId.trim() : "";
  const symptoms = typeof args.symptoms === "string" ? args.symptoms.trim() : "";

  if (!patientId) {
    return NextResponse.json(
      toolResult(toolCallId, "I need to identify you before routing. Could you tell me your phone number or email so I can look you up?"),
    );
  }

  if (!symptoms) {
    return NextResponse.json(
      toolResult(toolCallId, "I didn't catch your symptoms. Could you describe what you're experiencing?"),
    );
  }

  try {
    const triage = await createTriageRequest(patientId, symptoms);

    if (!triage.success) {
      return NextResponse.json(
        toolResult(
          toolCallId,
          triage.message ??
            "I was unable to route you right now. Please ensure you are linked to a hospital in the AuraHealth app, then try again.",
        ),
      );
    }

    const latest = await getLatestTriageForPatient(patientId);
    const hospitalName = latest?.hospitalName ?? "your linked hospital";
    const resources = latest ? await getHospitalResourcesForRouting(latest.hospitalId) : [];

    const routing = await generateRoutingMessage(symptoms, triage.severity, hospitalName, resources);

    // Store AI-generated differentials and clinical summary on the triage record
    if (latest) {
      await db
        .update(triageRequest)
        .set({
          differentials: JSON.stringify(routing.differentials),
          clinicalSummary: routing.clinicalSummary,
          updatedAt: new Date(),
        })
        .where(eq(triageRequest.id, latest.id));
    }

    return NextResponse.json(toolResult(toolCallId, routing.message));
  } catch (error) {
    console.error("[vapi/tools/route-to-hospital] error:", error);
    return NextResponse.json(
      toolResult(toolCallId, "I encountered a problem routing you. Please call back or use the AuraHealth app."),
    );
  }
}
