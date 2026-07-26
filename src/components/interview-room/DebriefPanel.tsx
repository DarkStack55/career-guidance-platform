import { Download, PlayCircle, RotateCw } from "lucide-react";
import type { Debrief } from "@/lib/interview-room.functions";

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono text-foreground">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-teal-400"
          style={{ width: `${Math.max(3, value)}%` }}
        />
      </div>
    </div>
  );
}

export function DebriefPanel({
  debrief,
  audioUrl,
  onRestart,
  onDownload,
}: {
  debrief: Debrief;
  audioUrl: string | null;
  onRestart: () => void;
  onDownload: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-[18px] border border-black/[0.07] dark:border-white/10 bg-white dark:bg-white/[0.03] p-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Interview readiness</div>
            <div className="text-5xl font-semibold text-foreground">
              {debrief.overall}
              <span className="text-base text-muted-foreground">/100</span>
            </div>
          </div>
          <p className="flex-1 min-w-[220px] text-sm text-muted-foreground leading-relaxed">{debrief.verdict}</p>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Bar label="Situation" value={debrief.star.situation} />
          <Bar label="Task" value={debrief.star.task} />
          <Bar label="Action" value={debrief.star.action} />
          <Bar label="Result" value={debrief.star.result} />
        </div>
        <p className="mt-5 text-sm text-muted-foreground leading-relaxed">{debrief.delivery_feedback}</p>
      </div>

      {audioUrl && (
        <div className="rounded-[18px] border border-black/[0.07] dark:border-white/10 bg-white dark:bg-white/[0.03] p-5">
          <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-foreground">
            <PlayCircle className="size-4 text-indigo-500 dark:text-indigo-300" /> Session replay
          </div>
          <audio controls src={audioUrl} className="w-full" />
        </div>
      )}

      <div className="rounded-[18px] border border-black/[0.07] dark:border-white/10 bg-white dark:bg-white/[0.03] p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Question-by-question</h3>
        {debrief.per_question.map((q, i) => (
          <div key={i} className="rounded-2xl border border-black/[0.06] dark:border-white/10 p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-foreground">{q.question}</p>
              <span className="shrink-0 rounded-full bg-indigo-500/10 px-2.5 py-1 text-xs font-mono text-indigo-600 dark:text-indigo-300">
                {q.score}
              </span>
            </div>
            {q.answer && <p className="mt-2 text-xs text-muted-foreground italic">“{q.answer}”</p>}
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{q.feedback}</p>
            <div className="mt-3 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/20 p-3">
              <div className="text-[11px] uppercase tracking-widest text-emerald-600 dark:text-emerald-300 mb-1">
                Stronger answer
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed">{q.exemplar}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-[18px] border border-black/[0.07] dark:border-white/10 bg-white dark:bg-white/[0.03] p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Top tips</h3>
        <ul className="space-y-2">
          {debrief.top_tips.map((t, i) => (
            <li key={i} className="text-sm text-muted-foreground leading-relaxed flex gap-2">
              <span className="text-indigo-500 dark:text-indigo-300">→</span>
              {t}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onDownload}
          className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-5 py-2.5 text-sm font-semibold hover:opacity-90"
        >
          <Download className="size-4" /> Download report card
        </button>
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex items-center gap-2 rounded-xl border border-black/10 dark:border-white/15 px-5 py-2.5 text-sm text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
        >
          <RotateCw className="size-4" /> New session
        </button>
      </div>
    </div>
  );
}
