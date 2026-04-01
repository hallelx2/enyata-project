/**
 * scripts/setup-vapi-tools.ts
 *
 * Registers all AuraHealth VAPI tools with the VAPI platform and attaches
 * them to the Aura assistant. Safe to re-run — existing tools are deleted
 * and recreated so definitions stay in sync.
 *
 * Usage:
 *   bun run scripts/setup-vapi-tools.ts
 *
 * Required env vars (from .env):
 *   VAPI_API_KEY
 *   NEXT_PUBLIC_VAPI_ASSISTANT_ID
 *   NEXT_PUBLIC_APP_URL            (must be publicly reachable — use deployed URL)
 *   VAPI_TOOL_SECRET
 */

const VAPI_API_KEY = process.env.VAPI_API_KEY ?? "";
const ASSISTANT_ID = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID ?? "";
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
const TOOL_SECRET = process.env.VAPI_TOOL_SECRET ?? "";

if (!VAPI_API_KEY || !ASSISTANT_ID || !APP_URL || !TOOL_SECRET) {
  console.error("Missing required env vars. Ensure VAPI_API_KEY, NEXT_PUBLIC_VAPI_ASSISTANT_ID, NEXT_PUBLIC_APP_URL, and VAPI_TOOL_SECRET are set.");
  process.exit(1);
}

const VAPI_BASE = "https://api.vapi.ai";
const HEADERS = {
  Authorization: `Bearer ${VAPI_API_KEY}`,
  "Content-Type": "application/json",
};

// ─── Tool definitions ─────────────────────────────────────────────────────────

interface ToolDef {
  name: string;
  description: string;
  endpoint: string;
  parameters: {
    type: "object";
    properties: Record<string, { type: string; description: string }>;
    required?: string[];
  };
}

const TOOL_DEFS: ToolDef[] = [
  {
    name: "checkPatient",
    description:
      "Check if a caller is registered in AuraHealth by phone number or email address. Returns registration status, patient ID, name, and linked hospitals. Always call this first to identify the caller.",
    endpoint: "/api/vapi/tools/check-patient",
    parameters: {
      type: "object",
      properties: {
        phoneNumber: {
          type: "string",
          description: "Caller's phone number including country code, e.g. +2348012345678",
        },
        email: {
          type: "string",
          description: "Caller's email address",
        },
      },
    },
  },
  {
    name: "registerPatient",
    description:
      "Create a new AuraHealth patient account for the caller. Use this when checkPatient returns registered=false and the caller wants to sign up. A temporary password is generated — patient sets their own via the app.",
    endpoint: "/api/vapi/tools/register-patient",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Patient's full name",
        },
        email: {
          type: "string",
          description: "Patient's email address (will be used for login)",
        },
        phoneNumber: {
          type: "string",
          description: "Patient's phone number including country code",
        },
      },
      required: ["name", "email"],
    },
  },
  {
    name: "routeToHospital",
    description:
      "Submit the patient's symptoms, create a triage request, and route them to their linked hospital. Returns a warm voice-friendly message to read aloud. Only call this after you have confirmed the patient's ID.",
    endpoint: "/api/vapi/tools/route-to-hospital",
    parameters: {
      type: "object",
      properties: {
        patientId: {
          type: "string",
          description: "Patient ID returned by checkPatient or registerPatient",
        },
        symptoms: {
          type: "string",
          description: "Full description of the patient's symptoms as they described them",
        },
      },
      required: ["patientId", "symptoms"],
    },
  },
  {
    name: "preauthorizePayment",
    description:
      "Pre-authorise a ₦5,000 escrow hold for the patient's hospital care. Call this after routeToHospital and only after the patient explicitly confirms they agree to the hold. confirmed must be true.",
    endpoint: "/api/vapi/tools/preauthorize-payment",
    parameters: {
      type: "object",
      properties: {
        patientId: {
          type: "string",
          description: "Patient ID returned by checkPatient or registerPatient",
        },
        confirmed: {
          type: "boolean",
          description: "true only if the patient explicitly said yes to the ₦5,000 pre-authorisation",
        },
      },
      required: ["patientId", "confirmed"],
    },
  },
  {
    name: "getPatientStatus",
    description:
      "Retrieve a summary of the patient's active triage requests and any pending escrow holds. Use when the patient asks about the status of their request or when you need to re-establish context.",
    endpoint: "/api/vapi/tools/get-patient-status",
    parameters: {
      type: "object",
      properties: {
        patientId: {
          type: "string",
          description: "Patient ID returned by checkPatient or registerPatient",
        },
      },
      required: ["patientId"],
    },
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function vapiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${VAPI_BASE}${path}`, { headers: HEADERS });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}

async function vapiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${VAPI_BASE}${path}`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} → ${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}

async function vapiDelete(path: string): Promise<void> {
  const res = await fetch(`${VAPI_BASE}${path}`, { method: "DELETE", headers: HEADERS });
  if (!res.ok) throw new Error(`DELETE ${path} → ${res.status} ${await res.text()}`);
}

async function vapiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${VAPI_BASE}${path}`, {
    method: "PATCH",
    headers: HEADERS,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH ${path} → ${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🎤 AuraHealth VAPI Tools Setup`);
  console.log(`   App URL    : ${APP_URL}`);
  console.log(`   Assistant  : ${ASSISTANT_ID}\n`);

  // 1. List existing tools and delete any with matching names (idempotent)
  console.log("1️⃣  Cleaning up existing AuraHealth tools...");
  const existingTools = await vapiGet<Array<{ id: string; function?: { name?: string } }>>("/tool");
  const auraNames = new Set(TOOL_DEFS.map((t) => t.name));

  for (const t of existingTools) {
    if (t.function?.name && auraNames.has(t.function.name)) {
      await vapiDelete(`/tool/${t.id}`);
      console.log(`   ✗ Deleted old tool: ${t.function.name} (${t.id})`);
    }
  }

  // 2. Create each tool
  console.log("\n2️⃣  Creating tools...");
  const toolIds: string[] = [];

  for (const def of TOOL_DEFS) {
    const created = await vapiPost<{ id: string }>("/tool", {
      type: "function",
      async: false,
      function: {
        name: def.name,
        description: def.description,
        strict: false,
        parameters: def.parameters,
      },
      server: {
        url: `${APP_URL}${def.endpoint}`,
        secret: TOOL_SECRET,
        timeoutSeconds: 25,
      },
    });

    toolIds.push(created.id);
    console.log(`   ✔ ${def.name} → ${created.id}`);
  }

  // 3. Get current assistant to preserve its model config
  console.log("\n3️⃣  Fetching current assistant...");
  const assistant = await vapiGet<{
    id: string;
    name?: string;
    model?: { provider?: string; model?: string; systemPrompt?: string };
  }>(`/assistant/${ASSISTANT_ID}`);
  console.log(`   Found: ${assistant.name ?? ASSISTANT_ID}`);

  // 4. Update assistant with new toolIds and refreshed system prompt
  console.log("\n4️⃣  Updating assistant with tools and system prompt...");

  const systemPrompt = `You are Aura, an empathetic AI health triage assistant for AuraHealth — a Nigerian digital health platform that connects patients to hospitals and emergency care.

You handle incoming patient calls and help them access medical care quickly and safely.

## Your Tools
- **checkPatient** — identify a caller by phone or email (always call this first)
- **registerPatient** — create a new account for unregistered callers
- **routeToHospital** — submit symptoms and route to their linked hospital
- **preauthorizePayment** — pre-authorise a ₦5,000 escrow hold for care (ask for consent first)
- **getPatientStatus** — retrieve active triages and payment status

## Conversation Flow
1. Greet warmly and ask for the caller's name and phone number or email to identify them
2. Call **checkPatient** — if registered, address them by name and proceed
3. If not registered, offer to create an account via **registerPatient** (ask for name, email, phone)
4. Listen carefully to their symptoms; ask clarifying questions if needed
5. Call **routeToHospital** when you have a clear picture of their situation
6. After routing, ask if they'd like to pre-authorise payment to avoid billing delays on arrival
7. If they say yes, call **preauthorizePayment** with confirmed=true
8. Confirm everything is in order and wish them a safe trip to the hospital

## Important Guidelines
- Keep all responses concise — this is a voice call, not a chat
- Never use clinical severity labels (critical/high/medium/low) when speaking to the patient
- If symptoms suggest an emergency (chest pain, stroke, difficulty breathing), emphasise urgency
- Always get explicit verbal confirmation before calling preauthorizePayment
- If a tool returns an error, acknowledge it calmly and offer the AuraHealth app as an alternative
- Speak in a warm, calm, professional tone — patients may be frightened or in pain`;

  await vapiPatch(`/assistant/${ASSISTANT_ID}`, {
    model: {
      ...(assistant.model ?? {}),
      toolIds,
      systemPrompt,
    },
  });

  console.log(`   ✔ Assistant updated with ${toolIds.length} tools`);
  console.log("\n✅ Setup complete!\n");
  console.log("Tool IDs attached:");
  TOOL_DEFS.forEach((def, i) => {
    console.log(`   ${def.name}: ${toolIds[i]}`);
  });
  console.log(`\nAssistant: https://dashboard.vapi.ai/assistants/${ASSISTANT_ID}`);
}

main().catch((err) => {
  console.error("\n❌ Setup failed:", err);
  process.exit(1);
});
