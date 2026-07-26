import { useEffect, useRef, useState } from "react";
import { Circle, Eye, EyeOff, Gauge, Timer, VideoOff } from "lucide-react";
import { analyzeGaze, VOICE_NAME, type VoiceId } from "@/lib/interview-room-client";

export type Subtitle = { speaker: "ai" | "candidate"; text: string; interim?: boolean } | null;

function Waveform({ level, tint }: { level: number; tint: string }) {
  const bars = 22;
  return (
    <div className="flex items-end gap-[3px] h-4" aria-hidden>
      {Array.from({ length: bars }).map((_, i) => {
        const wave = Math.sin((i / bars) * Math.PI) * 0.85 + 0.15;
        const h = Math.max(2, Math.round(level * wave * 16));
        return <span key={i} className={`w-[3px] rounded-full ${tint}`} style={{ height: `${h}px` }} />;
      })}
    </div>
  );
}

export function RoomStage({
  stream,
  voice,
  aiSpeaking,
  micLevel,
  subtitle,
  timerLabel,
  confidence,
  recording,
  cameraError,
  gazeOverride,
  onGazeChange,
}: {
  stream: MediaStream | null;
  voice: VoiceId;
  aiSpeaking: boolean;
  micLevel: number;
  subtitle: Subtitle;
  timerLabel: string;
  confidence: number;
  recording: boolean;
  cameraError: string | null;
  gazeOverride: boolean;
  onGazeChange?: (facing: boolean) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const workRef = useRef<HTMLCanvasElement | null>(null);
  const [facing, setFacing] = useState(true);
  const gazeCb = useRef(onGazeChange);
  gazeCb.current = onGazeChange;

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.srcObject = stream;
    if (stream) void v.play().catch(() => undefined);
  }, [stream]);

  useEffect(() => {
    if (!stream || cameraError) return;
    let raf = 0;
    let stop = false;
    let missStreak = 0;
    let hitStreak = 0;

    const tick = () => {
      if (stop) return;
      const video = videoRef.current;
      const work = workRef.current;
      if (video && work && video.readyState >= 2) {
        const W = 128;
        const H = Math.round((video.videoHeight / (video.videoWidth || 1)) * W) || 96;
        work.width = W;
        work.height = H;
        const ctx = work.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          try {
            ctx.drawImage(video, 0, 0, W, H);
            const r = analyzeGaze(ctx.getImageData(0, 0, W, H).data, W, H);
            if (r.facing) {
              hitStreak++;
              missStreak = 0;
            } else {
              missStreak++;
              hitStreak = 0;
            }
            if (missStreak > 18) setFacing(false);
            else if (hitStreak > 6) setFacing(true);
          } catch {
            /* frame not readable yet */
          }
        }
      }
      raf = window.setTimeout(() => {
        raf = requestAnimationFrame(tick);
      }, 120) as unknown as number;
    };
    tick();
    return () => {
      stop = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(raf);
    };
  }, [stream, cameraError]);

  const lostGaze = gazeOverride || (!facing && !cameraError && !!stream);
  useEffect(() => {
    gazeCb.current?.(!lostGaze);
  }, [lostGaze]);

  const name = VOICE_NAME[voice];

  return (
    <div
      className={`relative rounded-[18px] overflow-hidden border transition-shadow duration-300 ${
        lostGaze
          ? "border-rose-500/70 shadow-[0_0_0_3px_rgba(244,63,94,0.25),0_0_60px_-10px_rgba(244,63,94,0.8)]"
          : "border-white/10 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.8)]"
      }`}
    >
      <div className="relative aspect-video bg-neutral-950">
        <video
          ref={videoRef}
          muted
          playsInline
          className={`absolute inset-0 w-full h-full object-cover -scale-x-100 ${stream && !cameraError ? "opacity-100" : "opacity-0"}`}
        />
        <canvas ref={workRef} className="hidden" />

        {(!stream || cameraError) && (
          <div className="absolute inset-0 grid place-items-center px-8 text-center">
            <div>
              <div className="mx-auto mb-3 size-12 rounded-full bg-white/10 grid place-items-center">
                <VideoOff className="size-5 text-white/60" />
              </div>
              <p className="text-sm text-white/70 max-w-sm mx-auto leading-relaxed">
                {cameraError ?? "Your camera feed will appear here once the interview starts."}
              </p>
            </div>
          </div>
        )}

        {/* HUD */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur px-3 py-1.5 text-[11px] font-mono text-white/90">
            <Timer className="size-3" /> {timerLabel}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full backdrop-blur px-3 py-1.5 text-[11px] text-white/90 ${
              confidence >= 70 ? "bg-emerald-500/25" : confidence >= 45 ? "bg-amber-500/25" : "bg-rose-500/25"
            }`}
            title="Live confidence score"
          >
            <Gauge className="size-3" /> {confidence}
          </span>
          {recording && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur px-3 py-1.5 text-[11px] text-white/80">
              <Circle className="size-2.5 fill-rose-500 text-rose-500 animate-pulse" /> REC
            </span>
          )}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full backdrop-blur px-3 py-1.5 text-[11px] ${
              lostGaze ? "bg-rose-500/30 text-rose-100" : "bg-black/60 text-white/80"
            }`}
          >
            {lostGaze ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
            {lostGaze ? "Eye contact lost" : "Eye contact"}
          </span>
        </div>

        {/* AI PiP */}
        <div className="absolute top-3 right-3 w-32 sm:w-44 rounded-2xl overflow-hidden border border-white/15 bg-neutral-900/85 backdrop-blur">
          <div className="aspect-video grid place-items-center relative">
            <span
              className={`absolute size-16 sm:size-20 rounded-full border-2 ${
                aiSpeaking ? "border-indigo-400/80 animate-ping" : "border-white/10"
              }`}
            />
            <span
              className={`relative size-12 sm:size-14 rounded-full grid place-items-center text-base font-semibold text-white bg-gradient-to-br ${
                voice === "elena" ? "from-fuchsia-500 to-indigo-500" : "from-teal-400 to-indigo-500"
              }`}
            >
              {name[0]}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 border-t border-white/10">
            <span className="text-[11px] text-white/80">{name}</span>
            <span className={`text-[10px] ${aiSpeaking ? "text-indigo-300" : "text-white/40"}`}>
              {aiSpeaking ? "speaking" : "listening"}
            </span>
          </div>
        </div>

        {/* Subtitles */}
        <div className="absolute inset-x-0 bottom-0 p-3">
          <div className="rounded-2xl bg-black/65 backdrop-blur-md border border-white/10 px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-[11px] font-semibold uppercase tracking-widest ${
                  subtitle?.speaker === "ai" ? "text-indigo-300" : "text-teal-300"
                }`}
              >
                {subtitle ? (subtitle.speaker === "ai" ? name : "You") : "Live subtitles"}
              </span>
              {aiSpeaking && <Waveform level={0.75} tint="bg-indigo-400/80" />}
              {!aiSpeaking && micLevel > 0.02 && <Waveform level={micLevel} tint="bg-teal-400/80" />}
            </div>
            <p
              className={`text-sm sm:text-base leading-relaxed min-h-[1.5rem] ${
                subtitle?.interim ? "text-white/55 italic" : "text-white/95"
              }`}
            >
              {subtitle?.text || "Subtitles for both you and the interviewer appear here in real time."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
