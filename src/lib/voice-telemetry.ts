// Lightweight client-side telemetry for the chat voice-input flow.
// Events are console-logged (visible in production logs) and kept in a
// bounded in-memory ring buffer exposed as window.__voiceLog for debugging.

export type VoiceEventName =
  | "voice_toggle_off"
  | "voice_unsupported"
  | "voice_insecure_context"
  | "voice_permission_granted"
  | "voice_permission_denied"
  | "voice_start"
  | "voice_result"
  | "voice_error"
  | "voice_end"
  | "voice_start_failed";

export type VoiceEvent = {
  name: VoiceEventName;
  at: string;
  detail?: Record<string, unknown>;
};

const MAX_EVENTS = 100;
const buffer: VoiceEvent[] = [];

export function trackVoiceEvent(name: VoiceEventName, detail?: Record<string, unknown>) {
  const event: VoiceEvent = { name, at: new Date().toISOString(), detail };
  buffer.push(event);
  if (buffer.length > MAX_EVENTS) buffer.shift();

  if (typeof window !== "undefined") {
    (window as unknown as { __voiceLog?: VoiceEvent[] }).__voiceLog = buffer;
  }

  const line = `[voice] ${name}`;
  if (name === "voice_error" || name === "voice_permission_denied" || name === "voice_start_failed") {
    console.error(line, detail ?? {});
  } else {
    console.info(line, detail ?? {});
  }
}

export function getVoiceEvents(): VoiceEvent[] {
  return [...buffer];
}
