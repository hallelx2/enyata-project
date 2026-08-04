"use server";

import { and, desc, eq, gt, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { generateText } from "ai";
import { createVertex } from "@ai-sdk/google-vertex";
import { db } from "@/lib/db";
import { hospitalResource, patientHospitalLink, triageRequest, user } from "@/lib/db/schema";

// Lazy-init Vertex so JSON.parse(GOOGLE_VERTEX_CREDENTIALS) never runs at
// module-evaluation time (crashes Vercel static page collection when absent).
function getVertex() {
  return createVertex({
    project: process.env.GOOGLE_VERTEX_PROJECT ?? "",
    location: process.env.GOOGLE_VERTEX_LOCATION ?? "us-central1",
    googleAuthOptions: {
      credentials: JSON.parse(process.env.GOOGLE_VERTEX_CREDENTIALS ?? "{}"),
    },
  });
}

/** Quick keyword check used as instant fallback when the AI call fails. */
function keywordSeverity(
  symptoms: string,
): "low" | "medium" | "high" | "critical" {
  const text = symptoms.toLowerCase();
  const critical = [
    "chest pain", "heart attack", "stroke", "not breathing",
    "difficulty breathing", "unconscious", "severe bleeding",
    "seizure", "cardiac arrest", "choking", "anaphylaxis",
  ];
  const high = [
    "high fever", "broken bone", "deep cut", "severe pain",
    "head injury", "allergic reaction", "can't walk", "cannot walk",
    "fracture", "heavy bleeding", "burns", "poisoning",
  ];
  const medium = [
    "fever", "vomiting", "dizziness", "moderate pain", "infection",
    "swelling", "nausea", "cramps", "shortness of breath",
    "abdominal pain", "persistent cough",
  ];

  if (critical.some((k) => text.includes(k))) return "critical";
  if (high.some((k) => text.includes(k))) return "high";
  if (medium.some((k) => text.includes(k))) return "medium";
  return "low";
}

interface AiTriageResult {
  severity: "low" | "medium" | "high" | "critical";
  differentials: string[];
  clinicalSummary: string;
}

/**
 * AI-powered severity assessment using Gemini 2.5 Pro.
 * Falls back to keyword matching if the AI call fails.
 */
async function assessSeverityWithAI(symptoms: string): Promise<AiTriageResult> {
  const fallbackSeverity = keywordSeverity(symptoms);
  const fallback: AiTriageResult = { severity: fallbackSeverity, differentials: [], clinicalSummary: "" };

  try {
    const { text } = await generateText({
      model: getVertex()("gemini-2.5-pro"),
      prompt: `
You are a clinical triage AI for AuraHealth. Assess the following patient symptoms and return a JSON object.

Patient symptoms: "${symptoms}"

Return a JSON object with these exact keys:
- "severity": one of "low", "medium", "high", "critical"
  - critical: immediately life-threatening (cardiac arrest, stroke, anaphylaxis, severe trauma, difficulty breathing)
  - high: urgent, needs rapid attention (broken bones, severe pain, high fever with other symptoms, head injury)
  - medium: needs attention but not immediately dangerous (moderate pain, infection signs, persistent vomiting)
  - low: minor, can wait (mild headache alone, minor cuts, cold symptoms)
- "differentials": array of 3-5 possible differential diagnoses (medical terms)
- "clinicalSummary": 1-2 sentence clinical summary for the receiving doctor

Be accurate and err on the side of caution — if uncertain, choose the higher severity.
Respond ONLY with valid JSON, no markdown.
      `.trim(),
    });

    try {
      const parsed = JSON.parse(text) as Partial<AiTriageResult>;
      const validSeverities = ["low", "medium", "high", "critical"] as const;
      const severity = validSeverities.includes(parsed.severity as typeof validSeverities[number])
        ? (parsed.severity as AiTriageResult["severity"])
        : fallbackSeverity;
      return {
        severity,
        differentials: Array.isArray(parsed.differentials) ? (parsed.differentials as string[]) : [],
        clinicalSummary: typeof parsed.clinicalSummary === "string" ? parsed.clinicalSummary : "",
      };
    } catch {
      return fallback;
    }
  } catch (error) {
    console.error("AI severity assessment failed, using keyword fallback:", error);
    return fallback;
  }
}

export async function createTriageRequest(patientId: string, symptoms: string, differentials?: string, clinicalSummary?: string) {
  try {
    const link = await db
      .select({ hospitalId: patientHospitalLink.hospitalId })
      .from(patientHospitalLink)
      .where(
        and(
          eq(patientHospitalLink.patientId, patientId),
          or(
            eq(patientHospitalLink.status, "approved"),
            eq(patientHospitalLink.status, "auto"),
          ),
        ),
      )
      .then((r) => r[0]);

    if (!link) {
      return {
        success: false as const,
        message:
          "You are not linked to any hospital. Please link to a hospital first.",
      };
    }

    // Use AI for severity + differentials when not already provided (e.g. from VAPI)
    let severity: "low" | "medium" | "high" | "critical";
    let finalDifferentials = differentials ?? null;
    let finalClinicalSummary = clinicalSummary ?? null;

    if (!differentials && !clinicalSummary) {
      // Text-based triage — run through AI
      const aiResult = await assessSeverityWithAI(symptoms);
      severity = aiResult.severity;
      if (aiResult.differentials.length > 0) {
        finalDifferentials = JSON.stringify(aiResult.differentials);
      }
      if (aiResult.clinicalSummary) {
        finalClinicalSummary = aiResult.clinicalSummary;
      }
    } else {
      severity = keywordSeverity(symptoms);
    }

    const now = new Date();
    const id = `triage-${patientId.slice(-6)}-${Date.now()}`;

    await db.insert(triageRequest).values({
      id,
      patientId,
      hospitalId: link.hospitalId,
      symptoms,
      severity,
      status: "pending",
      differentials: finalDifferentials,
      clinicalSummary: finalClinicalSummary,
      createdAt: now,
      updatedAt: now,
    });

    revalidatePath("/dashboard/patient");
    revalidatePath("/dashboard/hospital");
    return {
      success: true as const,
      id,
      severity,
      hospitalId: link.hospitalId,
      differentials: finalDifferentials,
      clinicalSummary: finalClinicalSummary,
    };
  } catch (error) {
    console.error("Create triage failed:", error);
    return { success: false as const, message: "Failed to submit triage request." };
  }
}

export async function getTriageRequestsForHospital(
  hospitalId: string,
  since?: Date | null,
) {
  return db
    .select({
      id: triageRequest.id,
      symptoms: triageRequest.symptoms,
      severity: triageRequest.severity,
      status: triageRequest.status,
      notes: triageRequest.notes,
      escrowRef: triageRequest.escrowRef,
      differentials: triageRequest.differentials,
      clinicalSummary: triageRequest.clinicalSummary,
      createdAt: triageRequest.createdAt,
      patientId: triageRequest.patientId,
      patientName: user.name,
      patientEmail: user.email,
    })
    .from(triageRequest)
    .innerJoin(user, eq(triageRequest.patientId, user.id))
    .where(
      since
        ? and(
            eq(triageRequest.hospitalId, hospitalId),
            gt(triageRequest.createdAt, since),
          )
        : eq(triageRequest.hospitalId, hospitalId),
    )
    .orderBy(desc(triageRequest.createdAt));
}

export async function getPatientTriageRequests(patientId: string) {
  return db
    .select({
      id: triageRequest.id,
      symptoms: triageRequest.symptoms,
      severity: triageRequest.severity,
      status: triageRequest.status,
      escrowRef: triageRequest.escrowRef,
      differentials: triageRequest.differentials,
      clinicalSummary: triageRequest.clinicalSummary,
      createdAt: triageRequest.createdAt,
      hospitalId: triageRequest.hospitalId,
      hospitalName: user.name,
    })
    .from(triageRequest)
    .innerJoin(user, eq(triageRequest.hospitalId, user.id))
    .where(eq(triageRequest.patientId, patientId))
    .orderBy(desc(triageRequest.createdAt));
}

export async function updateTriageStatus(
  id: string,
  status: "in_progress" | "resolved",
  notes?: string,
) {
  try {
    await db
      .update(triageRequest)
      .set({ status, notes: notes ?? null, updatedAt: new Date() })
      .where(eq(triageRequest.id, id));
    revalidatePath("/dashboard/hospital");
    return { success: true };
  } catch (error) {
    console.error("Update triage status failed:", error);
    return { success: false };
  }
}

export async function getLatestTriageForPatient(patientId: string) {
  return db
    .select({
      id: triageRequest.id,
      hospitalId: triageRequest.hospitalId,
      hospitalName: user.name,
    })
    .from(triageRequest)
    .innerJoin(user, eq(triageRequest.hospitalId, user.id))
    .where(
      and(
        eq(triageRequest.patientId, patientId),
        or(
          eq(triageRequest.status, "pending"),
          eq(triageRequest.status, "in_progress"),
        ),
      ),
    )
    .orderBy(desc(triageRequest.createdAt))
    .limit(1)
    .then((r) => r[0] ?? null);
}

export async function linkEscrowToTriage(triageId: string, escrowRef: string) {
  try {
    await db
      .update(triageRequest)
      .set({ escrowRef, updatedAt: new Date() })
      .where(eq(triageRequest.id, triageId));
    revalidatePath("/dashboard/patient");
    return { success: true };
  } catch (error) {
    console.error("Link escrow to triage failed:", error);
    return { success: false };
  }
}

export async function getPatientTriageUpdates(patientId: string, since: Date) {
  return db
    .select({
      id: triageRequest.id,
      symptoms: triageRequest.symptoms,
      severity: triageRequest.severity,
      status: triageRequest.status,
      notes: triageRequest.notes,
      escrowRef: triageRequest.escrowRef,
      differentials: triageRequest.differentials,
      clinicalSummary: triageRequest.clinicalSummary,
      createdAt: triageRequest.createdAt,
      hospitalId: triageRequest.hospitalId,
      hospitalName: user.name,
    })
    .from(triageRequest)
    .innerJoin(user, eq(triageRequest.hospitalId, user.id))
    .where(
      and(
        eq(triageRequest.patientId, patientId),
        gt(triageRequest.updatedAt, since),
      ),
    )
    .orderBy(desc(triageRequest.createdAt));
}

export async function getHospitalResourcesForRouting(hospitalId: string) {
  return db
    .select({
      name: hospitalResource.name,
      category: hospitalResource.category,
      availableCount: hospitalResource.availableCount,
      priceNaira: hospitalResource.priceNaira,
      unit: hospitalResource.unit,
    })
    .from(hospitalResource)
    .where(eq(hospitalResource.hospitalId, hospitalId));
}
