"use client";

import Vapi from "@vapi-ai/web";
import { useEffect, useRef, useState } from "react";

type CallStatus = "idle" | "connecting" | "active" | "ending";

interface VoiceTriageProps {
  patientId: string;
  patientName: string;
  onComplete?: () => void;
}

export function VoiceTriage({ patientId, patientName, onComplete }: VoiceTriageProps) {
  const vapiRef = useRef<Vapi | null>(null);
  const [status, setStatus] = useState<CallStatus>("idle");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [assistantText, setAssistantText] = useState("");

  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    if (!publicKey) return;

    const vapi = new Vapi(publicKey);
    vapiRef.current = vapi;

    vapi.on("call-start", () => {
      setStatus("active");
    });

    vapi.on("call-end", () => {
      setStatus("idle");
      setIsSpeaking(false);
      setAssistantText("");
      onComplete?.();
    });

    vapi.on("speech-start", () => setIsSpeaking(true));
    vapi.on("speech-end", () => setIsSpeaking(false));

    // biome-ignore lint/suspicious/noExplicitAny: VAPI message types are loose
    vapi.on("message", (msg: any) => {
      if (
        msg?.type === "transcript" &&
        msg?.role === "assistant" &&
        msg?.transcriptType === "final"
      ) {
        setAssistantText(msg.transcript as string);
      }
    });

    return () => {
      vapi.stop();
    };
  }, [onComplete]);

  const startCall = () => {
    const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
    if (!assistantId || !vapiRef.current) return;

    setStatus("connecting");
    setAssistantText("");

    vapiRef.current.start(assistantId, {
      metadata: { patientId, patientName },
    } as Parameters<Vapi["start"]>[1]);
  };

  const endCall = () => {
    setStatus("ending");
    vapiRef.current?.stop();
  };

  if (status === "idle") {
    return (
      <button
        type="button"
        onClick={startCall}
        className="bg-white text-primary px-8 py-4 rounded-xl font-bold text-lg hover:scale-[1.02] transition-transform flex items-center gap-2 shadow-sm"
      >
        <span className="material-symbols-outlined">mic</span>
        Start Voice Triage
      </button>
    );
  }

  return (
    <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-6 border border-white/20 w-full">
      {status === "connecting" && (
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          <span className="text-white font-semibold text-sm">
            Connecting to Aura...
          </span>
        </div>
      )}

      {(status === "active" || status === "ending") && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Animated pulse rings when speaking */}
              <div className="relative w-8 h-8">
                <div
                  className={`absolute inset-0 rounded-full bg-white ${isSpeaking ? "animate-ping opacity-40" : "opacity-0"}`}
                />
                <div className="relative w-8 h-8 rounded-full bg-white/20 border-2 border-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-sm">
                    {isSpeaking ? "volume_up" : "mic"}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-white font-bold text-sm">Aura</p>
                <p className="text-white/70 text-xs">
                  {isSpeaking ? "Speaking..." : "Listening..."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={endCall}
              disabled={status === "ending"}
              className="bg-red-500/80 hover:bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">call_end</span>
              {status === "ending" ? "Ending..." : "End Call"}
            </button>
          </div>

          {assistantText && (
            <p className="text-white/80 text-sm leading-relaxed border-l-2 border-white/30 pl-3 italic">
              &ldquo;{assistantText}&rdquo;
            </p>
          )}
        </div>
      )}
    </div>
  );
}
