import { Clock, Target } from "lucide-react";
import { DURATIONS, SECTORS, type SectorId } from "@/lib/interview-plan";

export function SessionSetup({
  sector,
  onSector,
  custom,
  onCustom,
  minutes,
  onMinutes,
  disabled,
}: {
  sector: SectorId;
  onSector: (s: SectorId) => void;
  custom: string;
  onCustom: (v: string) => void;
  minutes: number;
  onMinutes: (m: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-[18px] border border-black/[0.07] dark:border-white/10 bg-white dark:bg-white/[0.03] p-5 space-y-6 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.35)]">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="size-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 grid place-items-center">
            <Target className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Target sector</h2>
            <p className="text-xs text-muted-foreground">Drives the technical half of your question queue.</p>
          </div>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {SECTORS.map((s) => (
            <button
              key={s.id}
              type="button"
              disabled={disabled}
              onClick={() => onSector(s.id)}
              className={`text-left rounded-xl border px-4 py-3 transition-colors disabled:opacity-50 ${
                sector === s.id
                  ? "border-indigo-500/70 bg-indigo-500/10"
                  : "border-black/10 dark:border-white/12 hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
              }`}
            >
              <span className="block text-sm font-medium text-foreground">{s.label}</span>
              <span className="block text-xs text-muted-foreground mt-0.5">{s.blurb}</span>
            </button>
          ))}
        </div>
        {sector === "custom" && (
          <input
            value={custom}
            disabled={disabled}
            onChange={(e) => onCustom(e.target.value)}
            placeholder="e.g. Biomedical Devices, Civil Structural Design, Product Marketing"
            className="mt-3 w-full rounded-xl border border-black/10 dark:border-white/15 bg-transparent px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-indigo-500/60"
          />
        )}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="size-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-300 grid place-items-center">
            <Clock className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Session duration</h2>
            <p className="text-xs text-muted-foreground">A live countdown runs for the whole call.</p>
          </div>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-3">
          {DURATIONS.map((d) => (
            <button
              key={d.minutes}
              type="button"
              disabled={disabled}
              onClick={() => onMinutes(d.minutes)}
              className={`rounded-xl border px-4 py-3 text-left transition-colors disabled:opacity-50 ${
                minutes === d.minutes
                  ? "border-teal-500/70 bg-teal-500/10"
                  : "border-black/10 dark:border-white/12 hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
              }`}
            >
              <span className="block text-sm font-medium text-foreground">{d.label}</span>
              <span className="block text-xs text-muted-foreground mt-0.5">{d.hint}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
