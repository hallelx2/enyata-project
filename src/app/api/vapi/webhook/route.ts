import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createVertex } from "@ai-sdk/google-vertex";
import { createTriageRequest, getLatestTriageForPatient, getHospitalResourcesForRouting } from "@/modules/triage/actions";
import { initializeMockEscrow } from "@/modules/escrow/actions";
import { linkEscrowToTriage } from "@/modules/triage/actions";
import { db } from "@/lib/db";
import { triageRequest } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Vertex client is created lazily inside generateRoutingMessage so that
// JSON.parse(GOOGLE_VERTEX_CREDENTIALS) never runs at module-evaluation
// time (which would crash Vercel's static page collection when the env
// var is absent during the build step).
function getVertex() {
  return createVertex({
    project: process.env.GOOGLE_VERTEX_PROJECT ?? "",
    location: process.env.GOOGLE_VERTEX_LOCATION ?? "us-central1",
    googleAuthOptions: {
      credentials: JSON.parse(process.env.GOOGLE_VERTEX_CREDENTIALS ?? "{}"),
    },
  });
}

interface VapiToolCall {
  id: string;
  type: string;
  function: {
    name: string;
    arguments: string;
  };
}

interface VapiMessage {
  type: string;
  call?: {
    id: string;
    metadata?: Record<string, string>;
  };
  toolCallList?: VapiToolCall[];
}

interface VapiWebhookBody {
  message: VapiMessage;
}

interface RoutingResult {
  message: string;
  differentials: string[]; // e.g. ["STEMI", "Unstable Angina", "Pericarditis"]
  clinicalSummary: string; // 2-3 sentence clinical assessment for the doctor
}

async function generateRoutingMessage(
  symptoms: string,
  severity: string,
  hospitalName: string,
  resources: Array<{ name: string; category: string; availableCount: number | null; priceNaira: number | null; unit: string | null }>,
): Promise<RoutingResult> {
  const fallbackMessage = (() => {
    const urgency =
      severity === "critical" || severity === "high"
        ? " Given the urgency of your symptoms, please proceed immediately."
        : "";
    return `I've assessed your symptoms and you're being routed to ${hospitalName}. They've been notified and are expecting you.${urgency} Please make your way there as soon as you can.`;
  })();
  const fallback: RoutingResult = { message: fallbackMessage, differentials: [], clinicalSummary: "" };

  try {
    const resourcesText = resources.length > 0
      ? `\nHospital available resources:\n${resources.map(r => `- ${r.name} (${r.category}): ${r.availableCount ?? 0} available @ ₦${r.priceNaira ?? 0}/${r.unit ?? "unit"}`).join("\n")}`
      : "";

    const { text } = await generateText({
      model: getVertex()("gemini-2.5-pro"),
      prompt: `
You are generating a clinical routing response for AuraHealth's triage assistant.

Patient symptoms: "${symptoms}"
Severity level: ${severity}
Routed to: ${hospitalName}${resourcesText}

Return a JSON object with these exact keys:
- "message": warm 2-3 sentence routing message to read aloud to patient (no clinical labels)
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
        message: typeof parsed.message === "string" ? parsed.message : fallbackMessage,
        differentials: Array.isArray(parsed.differentials) ? parsed.differentials as string[] : [],
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
  const body = (await request.json()) as VapiWebhookBody;
  const { message } = body;

  // Non-tool messages — just acknowledge
  if (message.type !== "tool-calls") {
    return NextResponse.json({ received: true });
  }

  const patientId = message.call?.metadata?.patientId;
  const results: Array<{ toolCallId: string; result: string }> = [];

  for (const toolCall of message.toolCallList ?? []) {
    let args: Record<string, unknown> = {};
    try {
      args = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;
    } catch {
      // ignore parse error
    }

    let result = "";

    if (toolCall.function.name === "routeToHospital") {
      if (!patientId) {
        result =
          "I'm unable to identify your account. Please log in to the AuraHealth app and try again.";
      } else {
        const symptoms = String(args.symptoms ?? "");
        const severity = String(args.severity ?? "medium");

        const triage = await createTriageRequest(patientId, symptoms);

        if (triage.success) {
          // Get the hospital name from the latest triage
          const latest = await getLatestTriageForPatient(patientId);
          const hospitalName = latest?.hospitalName ?? "your linked hospital";

          // Fetch hospital resources to inform routing message
          const resources = latest
            ? await getHospitalResourcesForRouting(latest.hospitalId)
            : [];

          const routing = await generateRoutingMessage(symptoms, severity, hospitalName, resources);
          result = routing.message;

          // Update triage record with AI-generated differentials and clinical summary
          if (latest) {
            await db.update(triageRequest).set({
              differentials: JSON.stringify(routing.differentials),
              clinicalSummary: routing.clinicalSummary,
              updatedAt: new Date(),
            }).where(eq(triageRequest.id, latest.id));
          }
        } else {
          result =
            triage.message ??
            "I was unable to complete the routing. Please ensure you are linked to a hospital in the AuraHealth app, then try again.";
        }
      }
    } else if (toolCall.function.name === "createEscrow") {
      const confirmed = Boolean(args.confirmed);

      if (!patientId || !confirmed) {
        result =
          "Pre-authorization was not completed. You can do this at any time from the AuraHealth app.";
      } else {
        const latest = await getLatestTriageForPatient(patientId);

        if (!latest) {
          result =
            "I couldn't find an active triage request. Please complete triage first.";
        } else {
          const escrow = await initializeMockEscrow({
            patientId,
            hospitalId: latest.hospitalId,
            amountNaira: 5000,
            description: "Voice triage care pre-authorization",
          });

          if (escrow.success && escrow.txnRef) {
            await linkEscrowToTriage(latest.id, escrow.txnRef);
            result = `Five thousand Naira has been pre-authorized for your care at ${latest.hospitalName}. You will not face any billing delays on arrival. Your reference number is ${escrow.txnRef}.`;
          } else {
            result =
              "I was unable to process the pre-authorization right now. You can complete this in the AuraHealth app.";
          }
        }
      }
    }

    results.push({ toolCallId: toolCall.id, result });
  }

  return NextResponse.json({ results });
}
