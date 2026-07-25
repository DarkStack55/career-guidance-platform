import { useState } from "react";
import { Download, Lock, SplitSquareHorizontal, Star, ClipboardList } from "lucide-react";
import { LiveMetrics, QA, StarScores, STAR_NOTES } from "@/lib/mock-interview-data";

const TABS = [
  { id: "star", label: "STAR Scoring", icon: Star },
  { id: "ideal", label: "Ideal Answer", icon: SplitSquareHorizontal },
  { id: "report", label: "Report Card", icon: ClipboardList },
] as const;

type TabId = (typeof TABS)[number]["id"];

function Bar({ label, value, note }: { label: string; value: number; note: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-foreground capitalize">{label}</span>
        <span className="text-sm tabular-nums text-muted-foreground">{value}/100</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-black/[0.07] dark:bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 transition-[width] duration-700"
          style={{ width: `${value}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{note}</p>
    </div>
  );
}

export function EvaluationTabs({
  completed,
  star,
  metrics,
  questions,
  onDownload,
}: {
  completed: boolean;
  star: StarScores | null;
  metrics: LiveMetrics;
  questions: QA[];
  onDownload: () => void;
}) {
  const [tab, setTab] = useState<TabId>("star");
  const [qIndex, setQIndex] = useState(0);
  const overall = star ? Math.round((star.situation + star.task + star.action + star.result) / 4) : 0;
  const current = questions[Math.min(qIndex, questions.length - 1)];

  return (
    <section className="rounded-2xl border border-black/[0.07] dark:border-white/10 bg-white dark:bg-white/[0.03] shadow-[0_10px_30px_-20px_rgba(15,23,42,0.35)] overflow-hidden">
      <div className="flex items-center gap-1 border-b border-black/[0.06] dark:border-white/10 px-3 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 px-3.5 py-3.5 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? "border-cyan-500 text-foreground font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="size-4" /> {t.label}
          </button>
        ))}
      </div>

      <div className="p-5 md:p-6">
        {!completed ? (
          <div className="py-10 text-center">
            <div className="mx-auto mb-3 size-11 rounded-full bg-black/[0.05] dark:bg-white/10 grid place-items-center">
              <Lock className="size-4 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">Evaluation unlocks after your first session</p>
            <p className="mt-1.5 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              Run a session and press End Session — your STAR breakdown, ideal-answer comparison and downloadable report
              card will appear here.
            </p>
          </div>
        ) : tab === "star" ? (
          <div className="grid gap-6 md:grid-cols-[180px_1fr] items-start">
            <div className="rounded-xl bg-neutral-950 p-5 text-center">
              <div className="text-4xl font-semibold text-white tabular-nums">{overall}</div>
              <div className="text-[10px] uppercase tracking-widest text-white/50 mt-1">Readiness</div>
              <div className="mt-3 text-xs text-cyan-300">
                {overall >= 80 ? "Interview ready" : overall >= 65 ? "Nearly there" : "Keep drilling"}
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {star &&
                (Object.keys(star) as Array<keyof StarScores>).map((k) => (
                  <Bar key={k} label={k} value={star[k]} note={STAR_NOTES[k]} />
                ))}
            </div>
          </div>
        ) : tab === "ideal" ? (
          <div>
            <div className="flex flex-wrap gap-2 mb-4">
              {questions.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setQIndex(i)}
                  className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
                    i === qIndex
                      ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                      : "bg-black/[0.05] dark:bg-white/10 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Q{i + 1}
                </button>
              ))}
            </div>
            <p className="text-sm font-medium text-foreground mb-4">{current?.q}</p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-black/[0.07] dark:border-white/10 bg-neutral-50 dark:bg-white/[0.04] p-4">
                <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">Your answer</div>
                <p className="text-sm text-foreground/80 leading-relaxed">{current?.yours}</p>
              </div>
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/[0.06] p-4">
                <div className="text-[11px] uppercase tracking-widest text-cyan-600 dark:text-cyan-300 mb-2">
                  Ideal answer
                </div>
                <p className="text-sm text-foreground/85 leading-relaxed">{current?.ideal}</p>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/[0.07] p-4">
              <div className="text-[11px] uppercase tracking-widest text-amber-600 dark:text-amber-300 mb-2">
                What was missing
              </div>
              <ul className="space-y-1.5">
                {current?.gaps.map((g) => (
                  <li key={g} className="text-sm text-foreground/80 flex gap-2">
                    <span className="text-amber-500">•</span> {g}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-[1fr_auto] items-center">
            <div className="grid gap-3 sm:grid-cols-4">
              {[
                { k: "Readiness", v: `${overall}/100` },
                { k: "Pacing", v: `${metrics.wpm} wpm` },
                { k: "Fillers", v: `${metrics.fillerCount}` },
                { k: "Stability", v: `${metrics.stability}%` },
              ].map((m) => (
                <div key={m.k} className="rounded-xl border border-black/[0.07] dark:border-white/10 p-3.5">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{m.k}</div>
                  <div className="mt-1 text-lg font-semibold text-foreground tabular-nums">{m.v}</div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={onDownload}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-5 py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Download className="size-4" /> Download Report Card
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
