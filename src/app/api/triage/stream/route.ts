import { and, desc, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { triageRequest, user } from "@/lib/db/schema";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hospitalId = searchParams.get("hospitalId");

  if (!hospitalId) {
    return new Response("Missing hospitalId", { status: 400 });
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

      const fetchTriages = (since?: Date) =>
        db
          .select({
            id: triageRequest.id,
            symptoms: triageRequest.symptoms,
            severity: triageRequest.severity,
            status: triageRequest.status,
            notes: triageRequest.notes,
            escrowRef: triageRequest.escrowRef,
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

      // Send initial state
      const initial = await fetchTriages();
      send({ type: "init", triages: initial });

      let lastCheck = new Date();

      // Poll every 5 seconds for new triages
      const interval = setInterval(async () => {
        try {
          const newTriages = await fetchTriages(lastCheck);
          lastCheck = new Date();
          if (newTriages.length > 0) {
            send({ type: "new", triages: newTriages });
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
