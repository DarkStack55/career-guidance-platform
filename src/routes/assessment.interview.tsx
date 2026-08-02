import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Sparkles, Mic, MicOff, Lock, Timer, Gauge, MessageSquareWarning } from "lucide-react";
import { AssessmentShell } from "@/components/AssessmentShell";
import { ScoreRing } from "@/components/ScoreRing";
import { CameraStage, type VisionMetrics } from "@/components/interview/CameraStage";
import { analyzeSpeech, pacingVerdict, fillerVerdict, highlightFillers } from "@/lib/interview-metrics";
import {
  generateInterviewQuestions,
  scoreInterviewAnswers,
  getInterviewAttempts,
} from "@/lib/ai-grader.functions";

export const Route = createFileRoute("/assessment/interview")({
  head: () => ({
    meta: [
      { title: "AI Mock Interview Studio — CareerPilot AI" },
      {
        name: "description",
        content:
          "Role-specific AI mock interviews with live eye-contact tracking, pacing and filler-word analytics, and STAR-method scoring.",
      },
      { property: "og:title", content: "AI Mock Interview Studio" },
      {
        property: "og:description",
        content: "Practice with camera metrics, WPM and filler tracking, and STAR feedback on every answer.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

type Star = { situation: number; task: number; action: number; result: number; applicable?: boolean };
type PerQ = { question: string; answer_score: number; star?: Star; feedback: string; exemplar: string };
type ScoreResult = {
  overall: number;
  verdict: string;
  star_overall?: Star;
  delivery_feedback?: string;
  per_question: PerQ[];
  top_tips: string[];
  attemptsRemaining?: number;
};
type Question = { text: string; type: string };
type Attempts = { used: number; max: number; remaining: number; locked: boolean; unlocksAt: string | null };

const ROLES = [
  "Software Developer",
  "Frontend Engineer",
  "Data Analyst",
  "Product Manager",
  "Mechanical Engineer",
  "Civil Engineer",
  "UX Designer",
  "Marketing Associate",
  "Financial Analyst",
  "Nurse Practitioner",
  "Teacher",
  "HR Generalist",
];

const DIFFICULTIES = [
  { key: "entry", label: "Entry", hint: "0–2 yrs · fundamentals & motivation" },
  { key: "mid", label: "Mid", hint: "3–6 yrs · execution & collaboration" },
  { key: "senior", label: "Senior", hint: "7+ yrs · ownership & tradeoffs" },
] as const;

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

function getRecognition(): SpeechRecognitionLike | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) return null;
  const r = new Ctor();
  r.continuous = true;
  r.interimResults = true;
  r.lang = "en-US";
  return r;
}

function Page() {
  const genFn = useServerFn(generateInterviewQuestions);
  const scoreFn = useServerFn(scoreInterviewAnswers);
  const attemptsFn = useServerFn(getInterviewAttempts);

  const [attempts, setAttempts] = useState<Attempts | null>(null);
  const [role, setRole] = useState("");
  const [difficulty, setDifficulty] = useState<"entry" | "mid" | "senior">("mid");
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState<"idle" | "gen" | "score">("idle");
  const [result, setResult] = useState<ScoreResult | null>(null);

  const [vision, setVision] = useState<VisionMetrics>({ eyeContact: 0, smile: 0, stability: 100, faceDetected: false, samples: 0 });
  const [elapsed, setElapsed] = useState(0);
  const [listening, setListening] = useState<number | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const startedAtRef = useRef<number | null>(null);

  // ---- attempts guard ----
  const refreshAttempts = useCallback(async () => {
    try {
      const a = (await attemptsFn({})) as Attempts;
      setAttempts(a);
    } catch {
      setAttempts(null);
    }
  }, [attemptsFn]);

  useEffect(() => {
    void refreshAttempts();
  }, [refreshAttempts]);

  // ---- session timer ----
  useEffect(() => {
    if (!questions || result) return;
    if (startedAtRef.current === null) startedAtRef.current = Date.now();
    const id = window.setInterval(() => {
      setElapsed(Math.round((Date.now() - (startedAtRef.current ?? Date.now())) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [questions, result]);

  // ---- dictation ----
  const stopDictation = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {
      /* noop */
    }
    recRef.current = null;
    setListening(null);
  }, []);

  const toggleDictation = (index: number) => {
    if (listening === index) {
      stopDictation();
      return;
    }
    stopDictation();
    const rec = getRecognition();
    if (!rec) {
      toast.error("Voice input isn't supported in this browser. Type your answer instead.");
      return;
    }
    rec.onresult = (e) => {
      let chunk = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) chunk += res[0].transcript + " ";
      }
      if (chunk) setAnswers((a) => ({ ...a, [index]: `${(a[index] ?? "").trim()} ${chunk.trim()}`.trim() }));
    };
    rec.onerror = () => {
      toast.error("Microphone error. Type your answer instead.");
      stopDictation();
    };
    rec.onend = () => setListening((cur) => (cur === index ? null : cur));
    try {
      rec.start();
      recRef.current = rec;
      setListening(index);
    } catch {
      toast.error("Could not start the microphone.");
    }
  };

  useEffect(() => () => stopDictation(), [stopDictation]);

  const transcript = useMemo(() => Object.values(answers).join(" \n"), [answers]);
  const speech = useMemo(() => analyzeSpeech(transcript, elapsed), [transcript, elapsed]);
  const pace = pacingVerdict(speech.wpm);
  const filler = fillerVerdict(speech.fillerRate);

  const locked = attempts?.locked === true;

  const start = async () => {
    if (role.trim().length < 2) {
      toast.error("Pick or type a role first.");
      return;
    }
    if (locked) {
      toast.error("Attempt limit reached for this window.");
      return;
    }
    setLoading("gen");
    setResult(null);
    try {
      const r = (await genFn({ data: { role: role.trim(), difficulty } })) as { questions: Question[] };
      setQuestions(r.questions);
      setAnswers({});
      setElapsed(0);
      startedAtRef.current = Date.now();
    } catch (e) {
      toast.error((e as Error).message);
      void refreshAttempts();
    } finally {
      setLoading("idle");
    }
  };

  const submit = async () => {
    if (!questions) return;
    stopDictation();
    const qa = questions.map((q, i) => ({ question: q.text, answer: (answers[i] ?? "").trim() }));
    if (qa.some((x) => x.answer.length < 5)) {
      toast.error("Please answer every question (at least a sentence).");
      return;
    }
    setLoading("score");
    try {
      const r = (await scoreFn({
        data: {
          role: role.trim(),
          difficulty,
          qa,
          metrics: {
            wpm: speech.wpm,
            fillerCount: speech.fillerCount,
            fillerRate: speech.fillerRate,
            eyeContact: vision.eyeContact,
            smile: vision.smile,
            stability: vision.stability,
            durationSec: elapsed,
            cameraUsed: vision.samples > 0,
          },
        },
      })) as ScoreResult;
      setResult(r);
      toast.success("Interview scored & saved");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading("idle");
      void refreshAttempts();
    }
  };

  const reset = () => {
    setResult(null);
    setQuestions(null);
    setAnswers({});
    setElapsed(0);
    startedAtRef.current = null;
    void refreshAttempts();
  };

  return (
    <AssessmentShell
      eyebrow="AI Mock Interview Studio"
      title="Rehearse the interview before the interview."
      description="Pick a role and difficulty — Zoiee runs a live interview with camera metrics, pacing analytics and STAR-method scoring on every answer."
      nextPath="/assessment/interview"
    >
      <AttemptBanner attempts={attempts} />

      {locked && !result && (
        <div className="rounded-2xl border border-rose-400/25 bg-rose-500/10 p-6 flex items-start gap-3">
          <Lock className="size-5 text-rose-300 shrink-0 mt-0.5" />
          <div>
            <div className="text-white font-medium">Attempt limit reached</div>
            <p className="text-sm text-white/70 mt-1">
              You've used all {attempts?.max ?? 2} mock interviews for this window.
              {attempts?.unlocksAt
                ? ` Unlocks ${new Date(attempts.unlocksAt).toLocaleString()}.`
                : " Try again in 24 hours."}
            </p>
          </div>
        </div>
      )}

      {/* ---------- Setup ---------- */}
      {!locked && !questions && !result && (
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-6">
            <label className="block text-sm text-muted-foreground mb-3">1. Target role</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`rounded-full px-3 py-1.5 text-xs border transition-colors ${
                    role === r
                      ? "bg-cyan-400/15 border-cyan-400/50 text-cyan-200"
                      : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="…or type any role, e.g. Robotics Intern"
              className="w-full rounded-lg bg-background border border-border px-4 py-2.5 text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
            />
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <label className="block text-sm text-muted-foreground mb-3">2. Difficulty</label>
            <div className="grid gap-3 sm:grid-cols-3">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setDifficulty(d.key)}
                  className={`text-left rounded-xl border p-4 transition-colors ${
                    difficulty === d.key
                      ? "border-cyan-400/50 bg-cyan-400/10"
                      : "border-border bg-background hover:bg-secondary"
                  }`}
                >
                  <div className="text-sm font-medium text-foreground">{d.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{d.hint}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={start}
            disabled={loading === "gen"}
            className="rounded-lg bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-neutral-900 px-5 py-2.5 text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-50"
          >
            {loading === "gen" ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Start interview
          </button>
        </div>
      )}

      {/* ---------- Live session ---------- */}
      {questions && !result && (
        <div className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
            <CameraStage active onMetrics={setVision} />
            <div className="rounded-lg border border-border bg-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Live delivery</div>
                <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Timer className="size-3.5" />
                  {String(Math.floor(elapsed / 60)).padStart(2, "0")}:{String(elapsed % 60).padStart(2, "0")}
                </div>
              </div>
              <Stat icon={<Gauge className="size-4" />} label="Words per minute" value={`${speech.wpm}`} note={pace.label} tone={pace.tone} />
              <Stat
                icon={<MessageSquareWarning className="size-4" />}
                label="Filler words"
                value={`${speech.fillerCount}`}
                note={`${speech.fillerRate}/100 words · ${filler.label}`}
                tone={filler.tone}
              />
              {speech.fillerHits.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {speech.fillerHits.slice(0, 6).map((h) => (
                    <span key={h.word} className="rounded-full bg-amber-400/10 border border-amber-400/25 text-amber-200 px-2 py-0.5 text-[11px]">
                      “{h.word}” ×{h.count}
                    </span>
                  ))}
                </div>
              )}
              <div className="text-[11px] text-muted-foreground leading-relaxed">
                Metrics are estimated in your browser from the camera preview and your transcript. Nothing is uploaded — only the
                summary numbers are sent for coaching.
              </div>
            </div>
          </div>

          {questions.map((q, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Question {i + 1}</div>
                <span className={`text-[10px] uppercase tracking-widest rounded-full px-2 py-0.5 border ${
                  q.type === "technical"
                    ? "text-fuchsia-200 border-fuchsia-400/30 bg-fuchsia-400/10"
                    : "text-cyan-200 border-cyan-400/30 bg-cyan-400/10"
                }`}>
                  {q.type}
                </span>
              </div>
              <div className="text-foreground mb-3">{q.text}</div>
              <textarea
                value={answers[i] ?? ""}
                onChange={(e) => setAnswers((a) => ({ ...a, [i]: e.target.value }))}
                rows={4}
                placeholder="Answer with Situation → Task → Action → Result…"
                className="w-full rounded-lg bg-background border border-border px-4 py-2.5 text-foreground placeholder:text-muted-foreground outline-none focus:border-primary resize-y"
              />
              <div className="mt-2 flex items-center justify-between gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => toggleDictation(i)}
                  className={`rounded-lg px-3 py-1.5 text-xs inline-flex items-center gap-1.5 border ${
                    listening === i
                      ? "bg-rose-500/15 border-rose-400/40 text-rose-200"
                      : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {listening === i ? <MicOff className="size-3.5" /> : <Mic className="size-3.5" />}
                  {listening === i ? "Stop dictation" : "Speak answer"}
                </button>
                <FillerPreview text={answers[i] ?? ""} />
              </div>
            </div>
          ))}

          <div className="flex flex-wrap gap-3">
            <button
              onClick={submit}
              disabled={loading === "score"}
              className="rounded-lg bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-neutral-900 px-5 py-2.5 text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-50"
            >
              {loading === "score" ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              Score my interview
            </button>
            <button onClick={reset} className="rounded-lg border border-border text-foreground px-4 py-2 text-sm hover:bg-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ---------- Report ---------- */}
      {result && (
        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-6 flex flex-col md:flex-row items-center gap-8 justify-around">
            <ScoreRing score={result.overall} label="Readiness" />
            <div className="text-center md:text-left">
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Verdict</div>
              <div className="text-2xl font-semibold text-foreground">{result.verdict}</div>
              <div className="mt-2 text-sm text-muted-foreground">
                {role} · {difficulty}-level · {Math.floor(elapsed / 60)}m {elapsed % 60}s
              </div>
            </div>
          </div>

          {result.star_overall && (
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="text-sm font-medium text-foreground mb-4">STAR method coverage</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(["situation", "task", "action", "result"] as const).map((k) => (
                  <Bar key={k} label={k} value={result.star_overall?.[k] ?? 0} />
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <MiniStat label="Pace" value={`${speech.wpm} wpm`} note={pace.label} />
            <MiniStat label="Filler words" value={`${speech.fillerCount}`} note={`${speech.fillerRate} per 100 words`} />
            <MiniStat
              label="Body language"
              value={vision.samples > 0 ? `${vision.eyeContact}% eye contact` : "Camera off"}
              note={vision.samples > 0 ? `smile ${vision.smile} · stability ${vision.stability}` : "Enable camera next time"}
            />
          </div>

          {result.delivery_feedback && (
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-5">
              <div className="text-[10px] uppercase tracking-widest text-cyan-300 mb-1">Delivery coaching</div>
              <p className="text-sm text-foreground/85 leading-relaxed">{result.delivery_feedback}</p>
            </div>
          )}

          <div className="space-y-3">
            {result.per_question.map((p, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-1 gap-3">
                  <div className="text-sm text-muted-foreground">Q{i + 1}. {p.question}</div>
                  <div className="text-xs text-muted-foreground shrink-0">{p.answer_score}/100</div>
                </div>
                {p.star && (
                  <div className="grid grid-cols-4 gap-3 my-3">
                    {(["situation", "task", "action", "result"] as const).map((k) => (
                      <Bar key={k} label={k} value={p.star?.[k] ?? 0} compact />
                    ))}
                  </div>
                )}
                <p className="text-sm text-foreground/80 mt-2 leading-relaxed">{p.feedback}</p>
                <div className="mt-3 rounded-lg border border-cyan-400/20 bg-cyan-400/5 p-3">
                  <div className="text-[10px] uppercase tracking-widest text-cyan-300 mb-1">Stronger STAR answer</div>
                  <p className="text-sm text-foreground/90 leading-relaxed">{p.exemplar}</p>
                </div>
              </div>
            ))}
          </div>

          {result.top_tips?.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="text-sm font-medium text-foreground mb-3">Top tips</div>
              <ul className="list-disc list-inside space-y-1 text-sm text-foreground/80">
                {result.top_tips.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </div>
          )}

          <button
            onClick={reset}
            disabled={attempts?.locked}
            className="rounded-lg border border-border text-foreground px-4 py-2 text-sm hover:bg-secondary disabled:opacity-40"
          >
            {attempts?.locked ? "No attempts left in this window" : "Run another interview"}
          </button>
        </div>
      )}
    </AssessmentShell>
  );
}

function AttemptBanner({ attempts }: { attempts: Attempts | null }) {
  if (!attempts) return null;
  return (
    <div className="mb-5 flex items-center gap-2 text-xs text-muted-foreground">
      <Lock className="size-3.5" />
      Attempts used {attempts.used}/{attempts.max} in the last 24 hours
      {attempts.remaining > 0 ? ` · ${attempts.remaining} left` : ""}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  note,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note: string;
  tone: "good" | "warn" | "bad";
}) {
  const color = tone === "good" ? "text-cyan-300" : tone === "warn" ? "text-amber-300" : "text-rose-300";
  return (
    <div className="flex items-center gap-3">
      <div className={`rounded-lg border border-border bg-secondary p-2 ${color}`}>{icon}</div>
      <div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className="text-lg font-semibold text-foreground leading-tight">{value}</div>
        <div className={`text-[11px] ${color}`}>{note}</div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold text-foreground mt-1">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{note}</div>
    </div>
  );
}

function Bar({ label, value, compact }: { label: string; value: number; compact?: boolean }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className={`uppercase tracking-widest text-muted-foreground ${compact ? "text-[9px]" : "text-[10px]"}`}>{label}</span>
        <span className={`text-foreground/70 ${compact ? "text-[10px]" : "text-xs"}`}>{v}</span>
      </div>
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500" style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

function FillerPreview({ text }: { text: string }) {
  const parts = useMemo(() => highlightFillers(text), [text]);
  const count = parts.filter((p) => p.filler).length;
  if (count === 0) return <span className="text-[11px] text-muted-foreground">No filler words detected</span>;
  return <span className="text-[11px] text-amber-300">{count} filler word{count > 1 ? "s" : ""} in this answer</span>;
}
