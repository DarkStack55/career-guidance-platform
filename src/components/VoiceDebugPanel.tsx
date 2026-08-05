import { useEffect, useState } from "react";
import { Bug, Trash2, X } from "lucide-react";
import {
  clearVoiceEvents,
  getVoiceEvents,
  subscribeVoiceEvents,
  type VoiceEvent,
} from "@/lib/voice-telemetry";

const ERROR_EVENTS = new Set(["voice_error", "voice_permission_denied", "voice_start_failed"]);

function timeOf(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour12: false });
}

export function VoiceDebugPanel({
  listening,
  onClose,
}: {
  listening: boolean;
  onClose: () => void;
}) {
  const [events, setEvents] = useState<VoiceEvent[]>([]);

  useEffect(() => {
    setEvents(getVoiceEvents());
    return subscribeVoiceEvents(setEvents);
  }, []);

  const last = events[events.length - 1];
  const permission = [...events]
    .reverse()
    .find((e) => e.name === "voice_permission_granted" || e.name === "voice_permission_denied");

  return (
    <div className="absolute inset-x-0 bottom-0 top-12 z-20 flex flex-col bg-background/97 backdrop-blur-xl border-t border-border">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Bug className="size-3.5 text-primary" /> Voice debug
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => clearVoiceEvents()}
            className="text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            aria-label="Clear voice events"
          >
            <Trash2 className="size-3" /> Clear
          </button>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close voice debug panel"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 px-3 py-2 border-b border-border text-[10px] font-mono">
        <div>
          <div className="text-muted-foreground uppercase tracking-wider">Mic</div>
          <div className={listening ? "text-rose-500" : "text-foreground/80"}>
            {listening ? "LISTENING" : "IDLE"}
          </div>
        </div>
        <div>
          <div className="text-muted-foreground uppercase tracking-wider">Permission</div>
          <div className="text-foreground/80">
            {permission
              ? permission.name === "voice_permission_granted"
                ? "GRANTED"
                : "DENIED"
              : "UNKNOWN"}
          </div>
        </div>
        <div>
          <div className="text-muted-foreground uppercase tracking-wider">Events</div>
          <div className="text-foreground/80">{events.length}</div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2 space-y-1 font-mono text-[10px]">
        {events.length === 0 && (
          <div className="text-muted-foreground py-6 text-center">
            No voice events yet — tap the mic to start.
          </div>
        )}
        {[...events].reverse().map((e, i) => (
          <div
            key={`${e.at}-${i}`}
            className="rounded-md border border-border bg-muted/40 px-2 py-1.5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className={ERROR_EVENTS.has(e.name) ? "text-rose-500" : "text-primary"}>
                {e.name}
              </span>
              <span className="text-muted-foreground">{timeOf(e.at)}</span>
            </div>
            {e.detail && Object.keys(e.detail).length > 0 && (
              <div className="mt-1 text-muted-foreground break-all">
                {JSON.stringify(e.detail)}
              </div>
            )}
          </div>
        ))}
      </div>

      {last && (
        <div className="px-3 py-2 border-t border-border text-[10px] font-mono text-muted-foreground">
          Last: {last.name} @ {timeOf(last.at)}
        </div>
      )}
    </div>
  );
}
