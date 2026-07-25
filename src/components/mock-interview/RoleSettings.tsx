import { useState } from "react";
import { ChevronDown, FileText, Sparkles } from "lucide-react";
import { LEVELS, Level, TRACKS, TrackId } from "@/lib/mock-interview-data";

export type RoleSettingsValue = {
  track: TrackId;
  role: string;
  level: Level;
  count: number;
  highlights: string;
};

export function RoleSettings({
  value,
  onChange,
  disabled,
}: {
  value: RoleSettingsValue;
  onChange: (v: RoleSettingsValue) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const trackLabel = TRACKS.find((t) => t.id === value.track)?.label ?? "";

  return (
    <div className="rounded-2xl border border-black/[0.07] dark:border-white/10 bg-white dark:bg-white/[0.03] shadow-[0_10px_30px_-20px_rgba(15,23,42,0.35)] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <span className="flex items-center gap-3 min-w-0">
          <span className="size-9 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 grid place-items-center shrink-0">
            <FileText className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-foreground">Resume &amp; Role Settings</span>
            <span className="block text-xs text-muted-foreground truncate">
              {trackLabel} · {value.role || "role not set"} · {value.level} · {value.count} questions
            </span>
          </span>
        </span>
        <ChevronDown className={`size-4 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="border-t border-black/[0.06] dark:border-white/10 px-5 py-5 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Track</span>
            <select
              disabled={disabled}
              value={value.track}
              onChange={(e) => {
                const track = e.target.value as TrackId;
                const preset = TRACKS.find((t) => t.id === track);
                onChange({ ...value, track, role: preset?.defaultRole ?? value.role });
              }}
              className="mt-1.5 w-full rounded-lg border border-black/10 dark:border-white/15 bg-white dark:bg-white/[0.05] px-3 py-2 text-sm text-foreground disabled:opacity-50"
            >
              {TRACKS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Target role</span>
            <input
              disabled={disabled}
              value={value.role}
              onChange={(e) => onChange({ ...value, role: e.target.value })}
              placeholder="e.g. Graduate Design Engineer"
              className="mt-1.5 w-full rounded-lg border border-black/10 dark:border-white/15 bg-white dark:bg-white/[0.05] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground disabled:opacity-50"
            />
          </label>

          <div>
            <span className="text-xs font-medium text-muted-foreground">Experience level</span>
            <div className="mt-1.5 inline-flex rounded-lg border border-black/10 dark:border-white/15 overflow-hidden">
              {LEVELS.map((l) => (
                <button
                  key={l}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange({ ...value, level: l })}
                  className={`px-3.5 py-2 text-sm transition-colors disabled:opacity-50 ${
                    value.level === l
                      ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Questions ({value.count})</span>
            <input
              type="range"
              min={3}
              max={5}
              step={1}
              disabled={disabled}
              value={value.count}
              onChange={(e) => onChange({ ...value, count: Number(e.target.value) })}
              className="mt-3 w-full accent-cyan-500 disabled:opacity-50"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">Resume highlights</span>
            <textarea
              disabled={disabled}
              value={value.highlights}
              onChange={(e) => onChange({ ...value, highlights: e.target.value })}
              rows={3}
              placeholder="Paste 3-4 bullet highlights — projects, tools, internships. Drag a resume file here later once uploads are enabled."
              className="mt-1.5 w-full rounded-lg border border-dashed border-black/15 dark:border-white/15 bg-neutral-50 dark:bg-white/[0.04] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground disabled:opacity-50"
            />
            <span className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Sparkles className="size-3" /> Highlights personalise the follow-up questions your interviewer asks.
            </span>
          </label>
        </div>
      )}
    </div>
  );
}
