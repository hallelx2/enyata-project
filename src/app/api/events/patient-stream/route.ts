import { and, desc, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { patientHospitalLink, triageRequest, user } from "@/lib/db/schema";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patientId");

  if (!patientId) {
    return new Response("Missing patientId", { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
          );
        } catch {
          // controller already closed
        }
      };

      let lastCheck = new Date();

      const interval = setInterval(async () => {
        try {
          const now = new Date();

          // Poll for approved hospital links
          const approvedLinks = await db
            .select({ id: patientHospitalLink.id })
            .from(patientHospitalLink)
            .where(
              and(
                eq(patientHospitalLink.patientId, patientId),
                gt(patientHospitalLink.approvedAt, lastCheck),
              ),
            );

          if (approvedLinks.length > 0) {
            send({ type: "link-updated" });
          }

          // Poll for updated triage requests
          const updatedTriages = await db
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
            .where(
              and(
                eq(triageRequest.patientId, patientId),
                gt(triageRequest.updatedAt, lastCheck),
              ),
            )
            .orderBy(desc(triageRequest.createdAt));

          lastCheck = now;

          if (updatedTriages.length > 0) {
            send({ type: "triage-updated", triages: updatedTriages });
          }
        } catch {
          // ignore transient DB errors
        }
      }, 5000);

      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
