import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight, Play, Square, Sparkles } from "lucide-react";
import { VideoStage } from "@/components/mock-interview/VideoStage";
import { AnalyticsSidebar } from "@/components/mock-interview/AnalyticsSidebar";
import { RoleSettings, RoleSettingsValue } from "@/components/mock-interview/RoleSettings";
import { EvaluationTabs } from "@/components/mock-interview/EvaluationTabs";
import {
  deriveStar,
  EMPTY_METRICS,
  LiveMetrics,
  PERSONAS,
  PersonaId,
  questionsFor,
  StarScores,
  stepMetrics,
  TRACKS,
} from "@/lib/mock-interview-data";

export const Route = createFileRoute("/assessment/mock-interview")({
  head: () => ({
    meta: [
      { title: "Mock Interview Setup & Session — CareerPilot AI" },
      {
        name: "description",
        content:
          "Run a live mock interview with camera preview, real-time pacing and filler-word analytics, STAR scoring and a downloadable report card.",
      },
      { property: "og:title", content: "Mock Interview Setup & Session — CareerPilot AI" },
      {
        property: "og:description",
        content:
          "Practice interviews with live speech pacing, filler-word tracking, face stability and STAR framework evaluation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MockInterviewPage,
});

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function MockInterviewPage() {
  const [settings, setSettings] = useState<RoleSettingsValue>({
    track: "mechanical",
    role: TRACKS[0].defaultRole,
    level: "Entry",
    count: 5,
    highlights: "",
  });
  const [persona, setPersona] = useState<PersonaId>("hr");
  const [live, setLive] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [qIndex, setQIndex] = useState(0);
  const [metrics, setMetrics] = useState<LiveMetrics>(EMPTY_METRICS);
  const [completed, setCompleted] = useState(false);
  const [star, setStar] = useState<StarScores | null>(null);
  const [cameraNote, setCameraNote] = useState<string | null>(null);
  const metricsRef = useRef(metrics);
  metricsRef.current = metrics;

  const questions = useMemo(() => questionsFor(settings.track, settings.count), [settings.track, settings.count]);
  const personaMeta = PERSONAS.find((p) => p.id === persona)!;

  useEffect(() => {
    if (!live) return;
    const id = window.setInterval(() => {
      setElapsed((e) => e + 1);
      setMetrics((m) => stepMetrics(m, 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [live]);

  const start = useCallback(() => {
    setMetrics({ ...EMPTY_METRICS, wpm: 120, stability: 80 });
    setElapsed(0);
    setQIndex(0);
    setCompleted(false);
    setStar(null);
    setLive(true);
  }, []);

  const end = useCallback(() => {
    setLive(false);
    setStar(deriveStar(metricsRef.current, settings.level));
    setCompleted(true);
  }, [settings.level]);

  const download = useCallback(() => {
    const s = star ?? deriveStar(metrics, settings.level);
    const overall = Math.round((s.situation + s.task + s.action + s.result) / 4);
    const trackLabel = TRACKS.find((t) => t.id === settings.track)?.label ?? settings.track;
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>CareerPilot AI — Mock Interview Report Card</title>
<style>
 body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#0f172a;margin:0;padding:40px;background:#fff}
 h1{font-size:24px;margin:0 0 4px} .sub{color:#64748b;font-size:13px;margin-bottom:28px}
 table{border-collapse:collapse;width:100%;margin-bottom:24px} td,th{border:1px solid #e2e8f0;padding:10px 12px;font-size:13px;text-align:left}
 th{background:#f8fafc} .big{font-size:40px;font-weight:600} ul{font-size:13px;line-height:1.7;color:#334155}
 h2{font-size:15px;margin:26px 0 10px}
</style></head><body>
<h1>Mock Interview Report Card</h1>
<div class="sub">CareerPilot AI · generated ${new Date().toLocaleString()}</div>
<div class="big">${overall}<span style="font-size:16px;color:#64748b">/100 readiness</span></div>
<h2>Session setup</h2>
<table><tr><th>Track</th><td>${trackLabel}</td></tr>
<tr><th>Target role</th><td>${settings.role || "—"}</td></tr>
<tr><th>Level</th><td>${settings.level}</td></tr>
<tr><th>Interviewer persona</th><td>${personaMeta.label}</td></tr>
<tr><th>Questions</th><td>${questions.length}</td></tr>
<tr><th>Duration</th><td>${fmt(elapsed)}</td></tr></table>
<h2>Delivery metrics</h2>
<table><tr><th>Speech pacing</th><td>${metrics.wpm} wpm</td></tr>
<tr><th>Filler words</th><td>${metrics.fillerCount}${metrics.fillers.length ? ` (${metrics.fillers.map((f) => `${f.word} x${f.count}`).join(", ")})` : ""}</td></tr>
<tr><th>Face stability</th><td>${metrics.stability}%</td></tr></table>
<h2>STAR framework</h2>
<table><tr><th>Situation</th><td>${s.situation}/100</td></tr><tr><th>Task</th><td>${s.task}/100</td></tr>
<tr><th>Action</th><td>${s.action}/100</td></tr><tr><th>Result</th><td>${s.result}/100</td></tr></table>
<h2>Coaching notes</h2>
<ul>${questions.map((q) => `<li><strong>${q.q}</strong><br/>${q.gaps.join("; ")}.</li>`).join("")}</ul>
</body></html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `careerpilot-mock-interview-report-${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }, [star, metrics, settings, personaMeta, questions, elapsed]);

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-5 md:px-6 pt-10 pb-20">
        <Link
          to="/assessment"
          className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mb-5"
        >
          <ArrowLeft className="size-3.5" /> Back to Assessment
        </Link>

        <div className="mb-7">
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-300 mb-2">
            <Sparkles className="size-3.5" /> Mock Interview
          </div>
          <h1 className="text-2xl md:text-4xl font-semibold tracking-tight text-foreground">
            Mock Interview Setup &amp; Session
          </h1>
          <p className="mt-3 max-w-2xl text-sm md:text-base text-muted-foreground leading-relaxed">
            A live training ground for real interviews. Set your track, pick an interviewer persona, run a timed session
            with camera preview, then review your STAR breakdown against ideal answers.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_320px] items-start">
          <div className="space-y-5">
            <RoleSettings value={settings} onChange={setSettings} disabled={live} />

            <VideoStage
              active={live}
              timerLabel={fmt(elapsed)}
              progressLabel={`Question ${qIndex + 1} of ${questions.length}`}
              onCameraError={setCameraNote}
            />

            {/* Control bar */}
            <div className="rounded-2xl border border-black/[0.07] dark:border-white/10 bg-white dark:bg-white/[0.03] shadow-[0_10px_30px_-20px_rgba(15,23,42,0.35)] p-4 flex flex-wrap items-center gap-3">
              {!live ? (
                <button
                  type="button"
                  onClick={start}
                  className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  <Play className="size-4" /> Start Session
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={end}
                    className="inline-flex items-center gap-2 rounded-xl bg-rose-600 text-white px-5 py-2.5 text-sm font-semibold hover:bg-rose-500 transition-colors"
                  >
                    <Square className="size-4" /> End Session
                  </button>
                  <button
                    type="button"
                    onClick={() => (qIndex < questions.length - 1 ? setQIndex((i) => i + 1) : end())}
                    className="inline-flex items-center gap-2 rounded-xl border border-black/10 dark:border-white/15 px-4 py-2.5 text-sm text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                  >
                    {qIndex < questions.length - 1 ? "Next question" : "Finish"} <ChevronRight className="size-4" />
                  </button>
                </>
              )}

              <label className="flex items-center gap-2 ml-auto">
                <span className="text-xs text-muted-foreground whitespace-nowrap">Interviewer Persona</span>
                <select
                  value={persona}
                  onChange={(e) => setPersona(e.target.value as PersonaId)}
                  disabled={live}
                  className="rounded-lg border border-black/10 dark:border-white/15 bg-white dark:bg-white/[0.05] px-3 py-2 text-sm text-foreground disabled:opacity-50"
                >
                  {PERSONAS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>
              <p className="w-full text-xs text-muted-foreground">{personaMeta.blurb}</p>
              {cameraNote && <p className="w-full text-xs text-amber-600 dark:text-amber-300">{cameraNote}</p>}
            </div>

            {/* Current question */}
            <div className="rounded-2xl border border-black/[0.07] dark:border-white/10 bg-white dark:bg-white/[0.03] shadow-[0_10px_30px_-20px_rgba(15,23,42,0.35)] p-5">
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">
                {live ? `Question ${qIndex + 1} of ${questions.length}` : "First question preview"}
              </div>
              <p className="text-base md:text-lg text-foreground leading-relaxed">{questions[qIndex]?.q}</p>
              {!live && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Questions adapt to your selected track. Start the session to begin the timer and live analytics.
                </p>
              )}
            </div>

            <EvaluationTabs
              completed={completed}
              star={star}
              metrics={metrics}
              questions={questions}
              onDownload={download}
            />
          </div>

          <AnalyticsSidebar metrics={metrics} live={live} />
        </div>
      </div>
    </div>
  );
}
