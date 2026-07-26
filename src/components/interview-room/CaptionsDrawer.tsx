import { X } from "lucide-react";
import { VOICE_NAME, type VoiceId } from "@/lib/interview-room-client";

export type CaptionLine = { speaker: "ai" | "candidate"; text: string; at: number };

export function CaptionsDrawer({
  open,
  lines,
  voice,
  onClose,
}: {
  open: boolean;
  lines: CaptionLine[];
  voice: VoiceId;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[110] flex justify-end bg-neutral-950/60 backdrop-blur-sm" onClick={onClose}>
      <aside
        className="h-full w-full max-w-md overflow-y-auto border-l border-white/10 bg-neutral-900/95 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Live transcript</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-white/60 hover:bg-white/10">
            <X className="size-4" />
          </button>
        </div>
        {lines.length === 0 ? (
          <p className="text-xs text-white/50">Nothing captured yet — the transcript fills up as you talk.</p>
        ) : (
          <ol className="space-y-3">
            {lines.map((l, i) => (
              <li key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span
                    className={`text-[11px] font-semibold uppercase tracking-widest ${
                      l.speaker === "ai" ? "text-indigo-300" : "text-teal-300"
                    }`}
                  >
                    {l.speaker === "ai" ? VOICE_NAME[voice] : "You"}
                  </span>
                  <span className="text-[10px] font-mono text-white/40">
                    {new Date(l.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                </div>
                <p className="text-sm text-white/85 leading-relaxed">{l.text}</p>
              </li>
            ))}
          </ol>
        )}
      </aside>
    </div>
  );
}
