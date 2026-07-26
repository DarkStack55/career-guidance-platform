import { Check, Mic2 } from "lucide-react";
import type { VoiceId } from "@/lib/interview-room-client";

const OPTIONS: Array<{ id: VoiceId; name: string; tag: string; blurb: string }> = [
  { id: "elena", name: "Elena", tag: "Girl voice", blurb: "Warm, measured, asks precise follow-ups." },
  { id: "kira", name: "Kira", tag: "Boy voice", blurb: "Direct, brisk, pushes hard for metrics." },
];

export function VoicePicker({
  value,
  onChange,
  disabled,
}: {
  value: VoiceId;
  onChange: (v: VoiceId) => void;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-[18px] border border-black/[0.07] dark:border-white/10 bg-white dark:bg-white/[0.03] p-5 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.35)]">
      <div className="flex items-center gap-2 mb-1">
        <Mic2 className="size-4 text-indigo-500 dark:text-indigo-300" />
        <h3 className="text-sm font-semibold text-foreground">Interviewer voice</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">Saved to your profile for future sessions.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {OPTIONS.map((o) => {
          const active = value === o.id;
          return (
            <button
              key={o.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(o.id)}
              className={`text-left rounded-[18px] border p-4 transition-colors disabled:opacity-50 ${
                active
                  ? "border-indigo-400/60 bg-indigo-500/10"
                  : "border-black/10 dark:border-white/10 hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-foreground">{o.name}</span>
                {active && <Check className="size-4 text-indigo-500 dark:text-indigo-300" />}
              </div>
              <span className="mt-0.5 block text-[11px] uppercase tracking-widest text-muted-foreground">{o.tag}</span>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{o.blurb}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
