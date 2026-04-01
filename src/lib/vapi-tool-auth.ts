/**
 * Shared authentication helper for VAPI external tool endpoints.
 *
 * VAPI sends the tool's configured `server.secret` value as the
 * `x-vapi-secret` header on every inbound tool-call request.
 * Each tool endpoint calls verifyVapiSecret() before processing.
 */

export interface VapiToolCallBody {
  message: {
    type: string;
    toolCallList: Array<{
      id: string;
      type?: string;
      function: {
        name: string;
        arguments: string; // JSON-encoded string
      };
    }>;
    call?: {
      id?: string;
      metadata?: Record<string, string>;
    };
  };
}

/** Returns true if the incoming request carries the correct VAPI tool secret. */
export function verifyVapiSecret(request: Request): boolean {
  const expected = process.env.VAPI_TOOL_SECRET;
  if (!expected) return false;
  return request.headers.get("x-vapi-secret") === expected;
}

/** Parse the first tool call arguments from a VAPI body. Returns {} on failure. */
export function parseToolArgs(body: VapiToolCallBody): Record<string, unknown> {
  const raw = body.message.toolCallList[0]?.function.arguments ?? "{}";
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/** Build the standard VAPI tool response envelope. */
export function toolResult(toolCallId: string, result: string) {
  return { results: [{ toolCallId, result }] };
}
