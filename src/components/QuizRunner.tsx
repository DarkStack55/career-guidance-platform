import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type QuizOption = { label: string; value: number };
export type QuizQuestion = {
  id: string;
  prompt: string;
  options: QuizOption[];
  /** Optional group tag used to compute per-trait scores. */
  trait?: string;
};

export function QuizRunner({
  questions,
  onComplete,
  submitLabel = "Submit",
}: {
  questions: QuizQuestion[];
  onComplete: (answers: Record<string, number>) => void | Promise<void>;
  submitLabel?: string;
}) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [picked, setPicked] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const q = questions[idx];
  const pct = Math.round(((idx + (answers[q.id] != null ? 1 : 0)) / questions.length) * 100);

  const pick = (optIndex: number, v: number) => {
    setPicked((p) => ({ ...p, [q.id]: optIndex }));
    setAnswers((a) => ({ ...a, [q.id]: v }));
  };
  const next = () => setIdx((i) => Math.min(questions.length - 1, i + 1));
  const back = () => setIdx((i) => Math.max(0, i - 1));

  const allAnswered = questions.every((x) => answers[x.id] != null);

  const submit = async () => {
    if (!allAnswered || submitting) return;
    setSubmitting(true);
    try {
      await onComplete(answers);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 md:p-8">
      <div className="flex items-center justify-between text-xs text-white/50 mb-3">
        <span>
          Question {idx + 1} of {questions.length}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mb-6">
        <div
          className="h-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <h3 className="text-lg md:text-xl font-medium text-white mb-5">{q.prompt}</h3>
      <div className="grid gap-2">
        {q.options.map((o, oi) => {
          const selected = picked[q.id] === oi;
          return (
            <button
              key={`${o.label}-${oi}`}
              type="button"
              onClick={() => pick(oi, o.value)}
              className={`text-left rounded-xl border px-4 py-3 text-sm transition-colors ${
                selected
                  ? "border-cyan-400/60 bg-cyan-400/10 text-white"
                  : "border-white/10 bg-white/[0.02] text-white/80 hover:bg-white/[0.05]"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          disabled={idx === 0}
          onClick={back}
          className="inline-flex items-center gap-1 text-sm text-white/60 hover:text-white disabled:opacity-30"
        >
          <ChevronLeft className="size-4" /> Back
        </button>
        {idx < questions.length - 1 ? (
          <button
            type="button"
            disabled={answers[q.id] == null}
            onClick={next}
            className="inline-flex items-center gap-1 rounded-lg bg-white text-neutral-900 px-4 py-2 text-sm font-medium disabled:opacity-40"
          >
            Next <ChevronRight className="size-4" />
          </button>
        ) : (
          <button
            type="button"
            disabled={!allAnswered || submitting}
            onClick={submit}
            className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-neutral-900 px-5 py-2 text-sm font-semibold disabled:opacity-40"
          >
            {submitting ? "Scoring…" : submitLabel}
          </button>
        )}
      </div>
    </div>
  );
}

/** Aggregate quiz score 0-100. Sums answer values / max possible. */
export function scoreQuiz(questions: QuizQuestion[], answers: Record<string, number>): number {
  let got = 0;
  let max = 0;
  for (const q of questions) {
    const maxOpt = Math.max(...q.options.map((o) => o.value));
    max += maxOpt;
    got += answers[q.id] ?? 0;
  }
  return max === 0 ? 0 : Math.round((got / max) * 100);
}

/** Per-trait aggregate 0-100. */
export function scoreByTrait(
  questions: QuizQuestion[],
  answers: Record<string, number>,
): Record<string, number> {
  const acc: Record<string, { got: number; max: number }> = {};
  for (const q of questions) {
    if (!q.trait) continue;
    const maxOpt = Math.max(...q.options.map((o) => o.value));
    acc[q.trait] ??= { got: 0, max: 0 };
    acc[q.trait].max += maxOpt;
    acc[q.trait].got += answers[q.id] ?? 0;
  }
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(acc)) out[k] = v.max === 0 ? 0 : Math.round((v.got / v.max) * 100);
  return out;
}
