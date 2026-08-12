import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  ArrowLeft,
  Captions,
  Loader2,
  Lock,
  Mic,
  MicOff,
  PhoneOff,
  Play,
  Send,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { RoleSettings, type RoleSettingsValue } from "@/components/mock-interview/RoleSettings";
import { RoomStage, type Subtitle } from "@/components/interview-room/RoomStage";
import { SessionSetup } from "@/components/interview-room/SessionSetup";
import { CaptionsDrawer, type CaptionLine } from "@/components/interview-room/CaptionsDrawer";
import { DeviceErrorModal } from "@/components/interview-room/DeviceErrorModal";
import { VoicePicker } from "@/components/interview-room/VoicePicker";
import { AnimatedMockInterviewLink } from "@/components/motion/AnimatedMockInterviewLink";
import { TRACKS } from "@/lib/mock-interview-data";
import {
  buildQuestionQueue,
  DURATIONS,
  SECTORS,
  sectorRole,
  type QueuedQuestion,
  type SectorId,
} from "@/lib/interview-plan";
import { analyzeSpeech } from "@/lib/interview-metrics";
import { supabase } from "@/integrations/supabase/client";
import {
  computeConfidence,
  createMeter,
  createRecognition,
  createRecorder,
  speak,
  ttsSupported,
  VOICE_NAME,
  type RecognitionLike,
  type VoiceId,
} from "@/lib/interview-room-client";
import {
  appendTurn,
  finalizeSession,
  generateQuestionPlan,
  getRoomAttempts,
  getVoicePreference,
  markSessionFailed,
  saveVoicePreference,
  startSession,
  type Debrief,
} from "@/lib/interview-room.functions";


export const Route = createFileRoute("/assessment/mock-interview")({
  head: () => ({
    meta: [
      { title: "Live AI Interview Room — CareerPilot AI" },
      {
        name: "description",
        content:
          "A real-time voice and video interview simulator with Elena or Kira as your AI interviewer, live subtitles, confidence and eye-contact feedback, and a full debrief.",
      },
      { property: "og:title", content: "Live AI Interview Room — CareerPilot AI" },
      {
        property: "og:description",
        content: "Two-way voice interview practice with live subtitles, confidence scoring and an AI debrief.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InterviewRoom,
});

type Phase = "setup" | "live" | "finalizing" | "debrief";
type Attempts = { used: number; max: number; remaining: number; locked: boolean; unlocksAt: string | null };

function fmt(sec: number) {
  return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
}

function InterviewRoom() {
  const startFn = useServerFn(startSession);
  const appendFn = useServerFn(appendTurn);
  const planFn = useServerFn(generateQuestionPlan);
  const finalizeFn = useServerFn(finalizeSession);
  const failFn = useServerFn(markSessionFailed);
  const attemptsFn = useServerFn(getRoomAttempts);
  const getVoiceFn = useServerFn(getVoicePreference);
  const saveVoiceFn = useServerFn(saveVoicePreference);

  const [sector, setSector] = useState<SectorId>("engineering");
  const [customSector, setCustomSector] = useState("");
  const [minutes, setMinutes] = useState<number>(10);
  const [settings, setSettings] = useState<RoleSettingsValue>({
    track: "mechanical",
    role: TRACKS[0].defaultRole,
    level: "Entry",
    count: 5,
    highlights: "",
  });
  const [voice, setVoice] = useState<VoiceId>("elena");
  const [attempts, setAttempts] = useState<Attempts | null>(null);
  const [phase, setPhase] = useState<Phase>("setup");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [deviceError, setDeviceError] = useState<string | null>(null);
  const [textMode, setTextMode] = useState(false);
  const [typed, setTyped] = useState("");
  const [handsFree, setHandsFree] = useState(true);
  const [muted, setMuted] = useState(false);
  const [captionsOn, setCaptionsOn] = useState(true);
  const [listening, setListening] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [subtitle, setSubtitle] = useState<Subtitle>(null);
  const [lines, setLines] = useState<CaptionLine[]>([]);
  const [captionsOpen, setCaptionsOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [timeUp, setTimeUp] = useState(false);
  const [queue, setQueue] = useState<QueuedQuestion[]>([]);
  const [askedCount, setAskedCount] = useState(0);
  const [micLevel, setMicLevel] = useState(0);
  const [facing, setFacing] = useState(true);
  const [gazeTest, setGazeTest] = useState(false);
  const [confidence, setConfidence] = useState(70);
  const [debrief, setDebrief] = useState<Debrief | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);


  const recRef = useRef<RecognitionLike | null>(null);
  const recorderRef = useRef<{ stop: () => Promise<Blob | null> } | null>(null);
  const meterRef = useRef<ReturnType<typeof createMeter> | null>(null);
  const cancelSpeakRef = useRef<(() => void) | null>(null);
  const turnIndexRef = useRef(1);
  const finalTextRef = useRef("");
  const silenceRef = useRef<number | null>(null);
  const allAnswersRef = useRef("");
  const gazeStatsRef = useRef({ good: 0, total: 0 });
  const confSamplesRef = useRef<number[]>([]);
  const phaseRef = useRef<Phase>("setup");
  phaseRef.current = phase;
  const sessionRef = useRef<string | null>(null);
  sessionRef.current = sessionId;
  const handsFreeRef = useRef(handsFree);
  handsFreeRef.current = handsFree;
  const warnedRef = useRef(0);
  const gazeWarnRef = useRef(false);
  const queueRef = useRef<QueuedQuestion[]>([]);
  const queueIdxRef = useRef(0);
  const timeUpRef = useRef(false);
  timeUpRef.current = timeUp;

  const totalSec = minutes * 60;
  const remaining = Math.max(0, totalSec - elapsed);
  const voiceName = VOICE_NAME[voice];


  // ---------- bootstrap ----------
  useEffect(() => {
    void (async () => {
      try {
        setAttempts((await attemptsFn({})) as Attempts);
      } catch {
        setAttempts(null);
      }
      try {
        const v = (await getVoiceFn({})) as { voice: VoiceId };
        setVoice(v.voice);
      } catch {
        /* signed-out or offline: keep default */
      }
    })();
  }, [attemptsFn, getVoiceFn]);

  // ---------- timers & meters ----------
  useEffect(() => {
    if (phase !== "live") return;
    const id = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  // Soft time-up: warn, let the candidate finish the current answer.
  useEffect(() => {
    if (phase !== "live" || timeUp) return;
    if (elapsed < minutes * 60) return;
    setTimeUp(true);
    toast.info("Time's up — finish your current answer and we'll wrap up.");
  }, [elapsed, minutes, phase, timeUp]);



  useEffect(() => {
    if (!stream || phase !== "live") return;
    let meter: ReturnType<typeof createMeter> | null = null;
    try {
      meter = createMeter(stream);
      meterRef.current = meter;
    } catch {
      meter = null;
    }
    if (!meter) return;
    const id = window.setInterval(() => setMicLevel(meter!.read()), 90);
    return () => {
      window.clearInterval(id);
      meter?.close();
      meterRef.current = null;
    };
  }, [stream, phase]);

  // Confidence + gaze sampling
  useEffect(() => {
    if (phase !== "live") return;
    const id = window.setInterval(() => {
      const g = gazeStatsRef.current;
      g.total++;
      if (facing && !gazeTest) g.good++;
      const eye = g.total ? Math.round((g.good / g.total) * 100) : 100;
      const stats = analyzeSpeech(allAnswersRef.current, Math.max(1, elapsedRef.current));
      const c = computeConfidence({
        wpm: stats.wpm,
        fillerRate: stats.fillerRate,
        eyeContact: eye,
        words: stats.words,
      });
      confSamplesRef.current.push(c);
      setConfidence(c);
    }, 2000);
    return () => window.clearInterval(id);
  }, [phase, facing, gazeTest]);

  const elapsedRef = useRef(0);
  elapsedRef.current = elapsed;

  // Eye-contact warning
  useEffect(() => {
    if (phase !== "live") return;
    const lost = !facing || gazeTest;
    gazeWarnRef.current = lost;
    if (!lost) return;
    const now = Date.now();
    if (now - warnedRef.current < 12000) return;
    warnedRef.current = now;
    toast.warning("Warning: Please maintain eye contact with the interviewer.");
  }, [facing, gazeTest, phase]);

  // ---------- transcript helpers ----------
  const pushLine = useCallback((speaker: "ai" | "candidate", text: string) => {
    setLines((l) => [...l, { speaker, text, at: Date.now() }]);
  }, []);

  const stopRecognition = useCallback(() => {
    const r = recRef.current;
    recRef.current = null;
    setListening(false);
    if (!r) return;
    r.onresult = null;
    r.onend = null;
    r.onerror = null;
    try {
      r.stop();
    } catch {
      /* already stopped */
    }
  }, []);

  const teardown = useCallback(() => {
    stopRecognition();
    cancelSpeakRef.current?.();
    cancelSpeakRef.current = null;
    if (silenceRef.current) window.clearTimeout(silenceRef.current);
    silenceRef.current = null;
    meterRef.current?.close();
    meterRef.current = null;
    stream?.getTracks().forEach((t) => t.stop());
  }, [stopRecognition, stream]);

  useEffect(() => () => teardown(), [teardown]);

  // ---------- conversation loop ----------
  const submitAnswerRef = useRef<(text: string) => void>(() => undefined);

  const listen = useCallback(() => {
    if (textMode || phaseRef.current !== "live") return;
    const rec = createRecognition();
    if (!rec) {
      setTextMode(true);
      toast.info("Speech recognition isn't available in this browser — switched to text mode.");
      return;
    }
    finalTextRef.current = "";
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        const t = res[0]?.transcript ?? "";
        if (res.isFinal) finalTextRef.current += `${t} `;
        else interim += t;
      }
      const shown = `${finalTextRef.current}${interim}`.trim();
      setSubtitle({ speaker: "candidate", text: shown, interim: interim.length > 0 });
      if (handsFreeRef.current) {
        if (silenceRef.current) window.clearTimeout(silenceRef.current);
        silenceRef.current = window.setTimeout(() => {
          if (finalTextRef.current.trim().length > 8) submitAnswerRef.current(finalTextRef.current.trim());
        }, 2600) as unknown as number;
      }
    };
    rec.onerror = (e) => {
      if (e?.error === "not-allowed" || e?.error === "service-not-allowed") {
        setDeviceError("Microphone access was blocked for speech recognition.");
      }
    };
    rec.onend = () => {
      setListening(false);
      if (phaseRef.current === "live" && handsFreeRef.current && recRef.current) {
        try {
          recRef.current.start();
          setListening(true);
        } catch {
          /* restart race */
        }
      }
    };
    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }, [textMode]);

  const sayAi = useCallback(
    (text: string) =>
      new Promise<void>((resolve) => {
        setSubtitle({ speaker: "ai", text });
        pushLine("ai", text);
        if (!ttsSupported()) {
          setTimeout(resolve, Math.min(6000, 1200 + text.length * 35));
          return;
        }
        setAiSpeaking(true);
        cancelSpeakRef.current = speak(text, voice, () => {
          setAiSpeaking(false);
          resolve();
        });
      }),
    [pushLine, voice],
  );

  const finish = useCallback(
    async (endedEarly: boolean) => {
      if (phaseRef.current === "finalizing" || phaseRef.current === "debrief") return;
      const id = sessionRef.current;
      setPhase("finalizing");
      stopRecognition();
      cancelSpeakRef.current?.();
      setAiSpeaking(false);

      let audioPath: string | null = null;
      try {
        const blob = await recorderRef.current?.stop();
        recorderRef.current = null;
        if (blob && blob.size > 2000) {
          setAudioUrl(URL.createObjectURL(blob));
          const { data: auth } = await supabase.auth.getUser();
          if (auth.user && id) {
            const path = `${auth.user.id}/interviews/${id}.webm`;
            const { error } = await supabase.storage
              .from("user-uploads")
              .upload(path, blob, { contentType: blob.type || "audio/webm", upsert: true });
            if (!error) audioPath = path;
          }
        }
      } catch {
        /* replay is optional — never block the debrief */
      }

      stream?.getTracks().forEach((t) => t.stop());
      setStream(null);

      if (!id) {
        setPhase("setup");
        return;
      }

      const g = gazeStatsRef.current;
      const eye = g.total ? Math.round((g.good / g.total) * 100) : 0;
      const conf = confSamplesRef.current.length
        ? Math.round(confSamplesRef.current.reduce((a, b) => a + b, 0) / confSamplesRef.current.length)
        : confidence;
      const stats = analyzeSpeech(allAnswersRef.current, Math.max(1, elapsedRef.current));

      try {
        const res = (await finalizeFn({
          data: {
            sessionId: id,
            endedEarly,
            durationSec: elapsedRef.current,
            confidenceAvg: conf,
            eyeContactAvg: eye,
            pacing: stats.wpm,
            fillerRate: stats.fillerRate,
            audioPath,
          },
        })) as { debrief: Debrief };
        setDebrief(res.debrief);
        setPhase("debrief");
        void attemptsFn({}).then((a) => setAttempts(a as Attempts)).catch(() => undefined);
      } catch (e) {
        setDeviceError(e instanceof Error ? e.message : "Could not generate your debrief.");
        setPhase("debrief");
      }
    },
    [attemptsFn, confidence, finalizeFn, stopRecognition, stream],
  );

  const advance = useCallback(async () => {
    const id = sessionRef.current;
    if (!id) return;
    // Time's up is a soft warning: the candidate finishes the current answer,
    // then we close the session instead of queuing another question.
    if (timeUpRef.current) {
      await sayAi("That's time for today — thanks for staying with it. Let me put your feedback together.");
      await finish(false);
      return;
    }
    const next = queueRef.current[queueIdxRef.current];
    if (!next) {
      await finish(false);
      return;
    }
    queueIdxRef.current += 1;
    setAskedCount(queueIdxRef.current);
    setAiThinking(true);
    try {
      const idx = turnIndexRef.current;
      turnIndexRef.current += 1;
      const prefix =
        gazeWarnRef.current && next.stage !== "intro"
          ? "I noticed you looked away — keep your eyes on me. "
          : "";
      const spoken = `${prefix}${next.text}`;
      setAiThinking(false);
      await sayAi(spoken);
      void appendFn({
        data: { sessionId: id, speaker: "ai", text: spoken, turnIndex: idx, metrics: { stage: next.stage } },
      }).catch(() => undefined);
      listen();
    } catch (e) {
      setAiThinking(false);
      setDeviceError(e instanceof Error ? e.message : "The interviewer could not respond.");
      if (sessionRef.current) void failFn({ data: { sessionId: sessionRef.current, message: String(e) } }).catch(() => undefined);
    }
  }, [appendFn, failFn, finish, listen, sayAi]);


  const submitAnswer = useCallback(
    async (text: string) => {
      const clean = text.trim();
      const id = sessionRef.current;
      if (!clean || !id || phaseRef.current !== "live") return;
      stopRecognition();
      if (silenceRef.current) window.clearTimeout(silenceRef.current);
      finalTextRef.current = "";
      allAnswersRef.current += ` ${clean}`;
      setSubtitle({ speaker: "candidate", text: clean });
      pushLine("candidate", clean);
      const idx = turnIndexRef.current;
      turnIndexRef.current += 1;
      try {
        await appendFn({
          data: {
            sessionId: id,
            speaker: "candidate",
            text: clean,
            turnIndex: idx,
            metrics: { confidence, elapsed: elapsedRef.current },
          },
        });
      } catch {
        toast.error("Could not save that answer — continuing.");
      }
      void advance();
    },
    [advance, appendFn, confidence, pushLine, stopRecognition],
  );
  submitAnswerRef.current = (t) => void submitAnswer(t);

  // ---------- start ----------
  const begin = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setDeviceError(null);
    setCameraError(null);
    let media: MediaStream | null = null;
    try {
      media = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: true });
    } catch {
      try {
        media = await navigator.mediaDevices.getUserMedia({ audio: true });
        setCameraError("Camera unavailable — running in audio-only mode.");
      } catch {
        setBusy(false);
        setDeviceError("Microphone and camera access were denied.");
        return;
      }
    }

    const plannedRole = sectorRole(sector, customSector) || settings.role;
    const questionCount = DURATIONS.find((d) => d.minutes === minutes)?.questions ?? 5;
    const sectorDef = SECTORS.find((s) => s.id === sector) ?? SECTORS[0];

    try {
      const res = (await startFn({
        data: {
          track: sectorDef.track,
          role: plannedRole,
          level: settings.level,
          voice,
          highlights: settings.highlights,
          questionBudget: Math.min(10, questionCount),
        },
      })) as { sessionId: string; opening: string };

      // Hybrid question source: AI writes the sector technicals, the local
      // bank fills in whenever the call fails or comes back short.
      let aiTechnicals: string[] = [];
      try {
        const plan = (await planFn({
          data: {
            sector: sector === "custom" ? customSector || "general" : sectorDef.label,
            role: plannedRole,
            level: settings.level,
            count: Math.max(1, questionCount - 4),
            highlights: settings.highlights,
          },
        })) as { questions: string[] };
        aiTechnicals = plan.questions ?? [];
      } catch {
        /* local bank covers it */
      }
      const built = buildQuestionQueue(sector, questionCount, aiTechnicals);
      queueRef.current = built;
      queueIdxRef.current = 0;
      setQueue(built);
      setAskedCount(0);

      setStream(media);
      setSessionId(res.sessionId);
      sessionRef.current = res.sessionId;
      setLines([]);
      setElapsed(0);
      setTimeUp(false);
      timeUpRef.current = false;
      turnIndexRef.current = 1;
      allAnswersRef.current = "";
      gazeStatsRef.current = { good: 0, total: 0 };
      confSamplesRef.current = [];
      setDebrief(null);
      setAudioUrl(null);
      setPhase("live");
      phaseRef.current = "live";
      setBusy(false);

      const audioTracks = media.getAudioTracks();
      if (audioTracks.length) {
        recorderRef.current = createRecorder(new MediaStream(audioTracks));
      }

      await sayAi(
        `Hi, I'm ${voiceName} and I'll be running your ${minutes}-minute ${sectorDef.label.toLowerCase()} interview today. Take a breath — here's my first question.`,
      );
      void advance();
    } catch (e) {
      media?.getTracks().forEach((t) => t.stop());
      setBusy(false);
      const msg = e instanceof Error ? e.message : "Could not start the interview.";
      if (msg.toLowerCase().includes("attempt limit")) toast.error(msg);
      else setDeviceError(msg);
    }
  }, [advance, busy, customSector, minutes, planFn, sayAi, sector, settings, startFn, voice, voiceName]);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      stream?.getAudioTracks().forEach((t) => (t.enabled = !next));
      if (next) stopRecognition();
      else if (phaseRef.current === "live" && !textMode) listen();
      return next;
    });
  }, [listen, stopRecognition, stream, textMode]);

  const onVoiceChange = useCallback(
    (v: VoiceId) => {
      setVoice(v);
      void saveVoiceFn({ data: { voice: v } }).catch(() => undefined);
    },
    [saveVoiceFn],
  );


  const downloadReport = useCallback(() => {
    if (!debrief) return;
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>CareerPilot AI — Interview Report</title>
<style>body{font-family:ui-sans-serif,system-ui,sans-serif;color:#0f172a;padding:40px}h1{font-size:24px;margin:0 0 4px}
.sub{color:#64748b;font-size:13px;margin-bottom:24px}table{border-collapse:collapse;width:100%;margin-bottom:20px}
td,th{border:1px solid #e2e8f0;padding:9px 12px;font-size:13px;text-align:left}th{background:#f8fafc}
.big{font-size:40px;font-weight:600}h2{font-size:15px;margin:24px 0 8px}ul{font-size:13px;line-height:1.7}</style></head><body>
<h1>Live Interview Report</h1><div class="sub">CareerPilot AI · interviewer ${voiceName} · ${new Date().toLocaleString()}</div>
<div class="big">${debrief.overall}<span style="font-size:16px;color:#64748b">/100 readiness</span></div>
<p>${debrief.verdict}</p>
<h2>Session</h2><table><tr><th>Role</th><td>${settings.role || settings.track}</td></tr>
<tr><th>Level</th><td>${settings.level}</td></tr><tr><th>Duration</th><td>${fmt(debrief.duration_sec)}</td></tr></table>
<h2>STAR</h2><table><tr><th>Situation</th><td>${debrief.star.situation}</td></tr><tr><th>Task</th><td>${debrief.star.task}</td></tr>
<tr><th>Action</th><td>${debrief.star.action}</td></tr><tr><th>Result</th><td>${debrief.star.result}</td></tr></table>
<h2>Delivery</h2><p>${debrief.delivery_feedback}</p>
<h2>Questions</h2><ul>${debrief.per_question
      .map((q) => `<li><strong>${q.question}</strong> — ${q.score}/100<br/>${q.feedback}<br/><em>${q.exemplar}</em></li>`)
      .join("")}</ul>
<h2>Top tips</h2><ul>${debrief.top_tips.map((t) => `<li>${t}</li>`).join("")}</ul>
<h2>Transcript</h2><ul>${lines.map((l) => `<li><strong>${l.speaker === "ai" ? voiceName : "You"}:</strong> ${l.text}</li>`).join("")}</ul>
</body></html>`;
    const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `careerpilot-interview-${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }, [debrief, lines, settings, voiceName]);

  const locked = attempts?.locked ?? false;
  const unlockLabel = useMemo(
    () => (attempts?.unlocksAt ? new Date(attempts.unlocksAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null),
    [attempts],
  );

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-5 md:px-6 pt-10 pb-20">
        <a
          href="https://ai-mock-interview-si-dyh6.bolt.host"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-indigo-600 dark:text-indigo-300 hover:underline"
        >
          Please click this link to attend your mock interview
        </a>

        <Link
          to="/assessment"
          className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mb-5 mt-4"
        >
          <ArrowLeft className="size-3.5" /> Back to Assessment
        </Link>

        <div className="mb-7">
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300 mb-2">
            <Sparkles className="size-3.5" /> Interview Room
          </div>
          <h1 className="text-2xl md:text-4xl font-semibold tracking-tight text-foreground">
            Live interview with {voiceName}
          </h1>
          <p className="mt-3 max-w-2xl text-sm md:text-base text-muted-foreground leading-relaxed">
            A real two-way call: {voiceName} speaks the questions, your answers are transcribed live into the subtitle
            bar, and every turn is saved so your debrief is always complete — even if you end early.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_320px] items-start">
          <div className="space-y-5">
            {phase === "setup" && (
              <>
                <SessionSetup
                  sector={sector}
                  onSector={setSector}
                  custom={customSector}
                  onCustom={setCustomSector}
                  minutes={minutes}
                  onMinutes={setMinutes}
                  disabled={busy}
                />
                <RoleSettings value={settings} onChange={setSettings} />
                <VoicePicker value={voice} onChange={onVoiceChange} />
                {locked && (
                  <div className="rounded-[18px] border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-200 flex items-start gap-2">
                    <Lock className="size-4 mt-0.5 shrink-0" />
                    <span>
                      You've used both interviews for today.{unlockLabel ? ` Unlocks around ${unlockLabel}.` : ""}
                    </span>
                  </div>
                )}
              </>
            )}

            {(phase === "live" || phase === "finalizing") && (
              <RoomStage
                stream={stream}
                voice={voice}
                aiSpeaking={aiSpeaking}
                micLevel={muted ? 0 : micLevel}
                subtitle={captionsOn ? subtitle : null}
                timerLabel={fmt(remaining)}
                confidence={confidence}
                recording={!!recorderRef.current}
                cameraError={cameraError}
                gazeOverride={gazeTest}
                onGazeChange={setFacing}
              />
            )}

            {phase === "live" && timeUp && (
              <div className="rounded-[18px] border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-200 flex items-center gap-2">
                <TriangleAlert className="size-4 shrink-0" /> Time's up — finish your current answer and {voiceName} will
                wrap up.
              </div>
            )}


            {/* Control bar */}
            <div className="rounded-[18px] border border-black/[0.07] dark:border-white/10 bg-white dark:bg-white/[0.03] p-4 flex flex-wrap items-center gap-3">
              {phase === "setup" && (
                <button
                  type="button"
                  onClick={() => void begin()}
                  disabled={busy || locked}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 text-white px-5 py-2.5 text-sm font-semibold hover:bg-indigo-400 disabled:opacity-50 transition-colors"
                >
                  {busy ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
                  {busy ? "Connecting…" : `Start interview with ${voiceName}`}
                </button>
              )}

              {phase === "live" && (
                <>
                  <button
                    type="button"
                    onClick={() => void finish(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-rose-600 text-white px-5 py-2.5 text-sm font-semibold hover:bg-rose-500 transition-colors"
                  >
                    <PhoneOff className="size-4" /> End interview
                  </button>

                  {!textMode && (
                    <>
                      <button
                        type="button"
                        onMouseDown={() => !handsFree && !muted && listen()}
                        onMouseUp={() => !handsFree && submitAnswerRef.current(finalTextRef.current)}
                        onClick={() => handsFree && submitAnswerRef.current(finalTextRef.current)}
                        disabled={aiSpeaking || aiThinking || muted}
                        className="inline-flex items-center gap-2 rounded-xl border border-black/10 dark:border-white/15 px-4 py-2.5 text-sm text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06] disabled:opacity-40 transition-colors"
                      >
                        {listening ? <Mic className="size-4 text-teal-500" /> : <MicOff className="size-4" />}
                        {handsFree ? "Send answer" : "Hold to talk"}
                      </button>
                      <button
                        type="button"
                        onClick={toggleMute}
                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm transition-colors ${
                          muted
                            ? "bg-rose-500/15 text-rose-500"
                            : "border border-black/10 dark:border-white/15 text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                        }`}
                      >
                        {muted ? <MicOff className="size-4" /> : <Mic className="size-4" />}
                        {muted ? "Unmute mic" : "Mute mic"}
                      </button>
                      <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={handsFree}
                          onChange={(e) => setHandsFree(e.target.checked)}
                          className="size-3.5 accent-indigo-500"
                        />
                        Hands-free
                      </label>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => setCaptionsOn((c) => !c)}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm transition-colors ${
                      captionsOn
                        ? "border border-black/10 dark:border-white/15 text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                        : "bg-black/[0.05] dark:bg-white/[0.08] text-muted-foreground"
                    }`}
                  >
                    <Captions className="size-4" /> Captions {captionsOn ? "on" : "off"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setCaptionsOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-black/10 dark:border-white/15 px-4 py-2.5 text-sm text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                  >
                    Transcript
                  </button>


                  <button
                    type="button"
                    onClick={() => setGazeTest((g) => !g)}
                    className={`inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs transition-colors ${
                      gazeTest ? "bg-rose-500/15 text-rose-500" : "text-muted-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                    }`}
                    title="Simulate losing eye contact"
                  >
                    <TriangleAlert className="size-3.5" /> Test warning
                  </button>

                  {aiThinking && (
                    <span className="inline-flex items-center gap-2 text-xs text-muted-foreground ml-auto">
                      <Loader2 className="size-3.5 animate-spin" /> {voiceName} is thinking…
                    </span>
                  )}
                </>
              )}

              {phase === "finalizing" && (
                <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> Generating your debrief…
                </span>
              )}
            </div>

            {phase === "live" && textMode && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const t = typed.trim();
                  if (!t) return;
                  setTyped("");
                  submitAnswerRef.current(t);
                }}
                className="rounded-[18px] border border-black/[0.07] dark:border-white/10 bg-white dark:bg-white/[0.03] p-4 flex gap-3"
              >
                <input
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  placeholder="Type your answer — subtitles and scoring still work"
                  className="flex-1 rounded-xl border border-black/10 dark:border-white/15 bg-transparent px-4 py-2.5 text-sm text-foreground outline-none"
                />
                <button
                  type="submit"
                  disabled={aiSpeaking || aiThinking}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 text-white px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
                >
                  <Send className="size-4" /> Send
                </button>
              </form>
            )}

            {phase === "debrief" && debrief && (
              <DebriefPanel
                debrief={debrief}
                audioUrl={audioUrl}
                onDownload={downloadReport}
                onRestart={() => {
                  setPhase("setup");
                  setSessionId(null);
                  setSubtitle(null);
                  setLines([]);
                  setDebrief(null);
                }}
              />
            )}
          </div>

          {/* Sidebar */}
          <aside data-theme-surface="dark" className="rounded-lg border border-white/10 bg-neutral-900 text-white p-5 space-y-5 lg:sticky lg:top-24">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-white/40">Session</div>
              <div className="mt-1 text-sm">
                {sectorRole(sector, customSector) || TRACKS.find((t) => t.id === settings.track)?.label} ·{" "}
                {settings.level}
              </div>
              <div className="text-xs text-white/50">
                {SECTORS.find((s) => s.id === sector)?.label} · {minutes} min ·{" "}
                {queue.length || DURATIONS.find((d) => d.minutes === minutes)?.questions} questions
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-white/50">Confidence</span>
                <span className="font-mono">{confidence}</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-teal-400 transition-all duration-500"
                  style={{ width: `${confidence}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-xl bg-white/5 p-3">
                <div className={`text-lg font-semibold ${timeUp ? "text-amber-300" : ""}`}>{fmt(remaining)}</div>
                <div className="text-[11px] text-white/45">Remaining</div>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <div className="text-lg font-semibold">
                  {Math.min(askedCount, queue.length || askedCount)}/{queue.length || "—"}
                </div>
                <div className="text-[11px] text-white/45">Questions</div>
              </div>
            </div>


            <div className="text-xs text-white/50 leading-relaxed">
              {phase === "live"
                ? listening
                  ? "Listening — speak naturally, pause when you're done."
                  : aiSpeaking
                    ? `${voiceName} is speaking.`
                    : "Waiting for the next turn."
                : "Pick your track and voice, then start the call. Camera, mic and network issues are handled without losing your transcript."}
            </div>

            {attempts && (
              <div className="text-[11px] text-white/40">
                Attempts today: {attempts.used}/{attempts.max}
              </div>
            )}
          </aside>
        </div>
      </div>

      <CaptionsDrawer open={captionsOpen} lines={lines} voice={voice} onClose={() => setCaptionsOpen(false)} />

      {deviceError && (
        <DeviceErrorModal
          message={deviceError}
          onRetry={() => {
            setDeviceError(null);
            if (phaseRef.current === "live") listen();
            else void begin();
          }}
          onTextMode={() => {
            setDeviceError(null);
            setTextMode(true);
            stopRecognition();
            if (phaseRef.current !== "live") void begin();
          }}
          onEnd={() => {
            setDeviceError(null);
            void finish(true);
          }}
        />
      )}
    </div>
  );
}
