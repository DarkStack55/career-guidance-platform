import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Loader2 } from "lucide-react";

export type VisionMetrics = {
  eyeContact: number; // % of frames where the face is centered / facing forward
  smile: number; // 0-100 smile estimate
  stability: number; // 0-100 head-movement stability
  faceDetected: boolean;
  samples: number;
};

const EMPTY: VisionMetrics = { eyeContact: 0, smile: 0, stability: 100, faceDetected: false, samples: 0 };

/**
 * Lightweight in-browser face proxy: skin-tone segmentation on a downscaled frame.
 * No model downloads, works offline, and degrades gracefully when no camera is granted.
 */
function analyzeFrame(data: Uint8ClampedArray, w: number, h: number) {
  let minX = w, minY = h, maxX = 0, maxY = 0, count = 0, sumX = 0, sumY = 0;
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      const i = (y * w + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      const isSkin =
        r > 95 && g > 40 && b > 20 && max - min > 15 && Math.abs(r - g) > 15 && r > g && r > b;
      if (isSkin) {
        count++; sumX += x; sumY += y;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  const coverage = count / ((w * h) / 4);
  if (count < 40 || coverage < 0.01) return null;

  const cx = sumX / count / w;
  const cy = sumY / count / h;
  const box = { x: minX / w, y: minY / h, w: (maxX - minX) / w, h: (maxY - minY) / h };

  // Smile proxy: brightness spread across the mouth band (lower third of the face box).
  const bandTop = Math.floor(minY + (maxY - minY) * 0.62);
  const bandBottom = Math.min(h - 1, Math.floor(minY + (maxY - minY) * 0.92));
  let bright = 0, dark = 0, total = 0;
  for (let y = bandTop; y <= bandBottom; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const i = (y * w + x) * 4;
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      total++;
      if (lum > 170) bright++;
      else if (lum < 70) dark++;
    }
  }
  const smile = total > 0 ? Math.min(100, Math.round(((bright * 2 + dark) / total) * 220)) : 0;
  return { cx, cy, box, smile, coverage };
}

export function CameraStage({
  active,
  onMetrics,
}: {
  active: boolean;
  onMetrics: (m: VisionMetrics) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const workRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const statsRef = useRef({ centered: 0, smileSum: 0, moveSum: 0, samples: 0, last: null as null | { cx: number; cy: number } });
  const onMetricsRef = useRef(onMetrics);
  onMetricsRef.current = onMetrics;

  const [state, setState] = useState<"off" | "starting" | "on" | "denied">("off");
  const [live, setLive] = useState<VisionMetrics>(EMPTY);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setState("off");
  }, []);

  const loop = useCallback(() => {
    const video = videoRef.current;
    const overlay = canvasRef.current;
    const work = workRef.current;
    if (!video || !overlay || !work || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(loop);
      return;
    }
    const W = 160;
    const H = Math.round((video.videoHeight / (video.videoWidth || 1)) * W) || 120;
    work.width = W;
    work.height = H;
    const wctx = work.getContext("2d", { willReadFrequently: true });
    const octx = overlay.getContext("2d");
    if (!wctx || !octx) {
      rafRef.current = requestAnimationFrame(loop);
      return;
    }
    wctx.drawImage(video, 0, 0, W, H);
    let result: ReturnType<typeof analyzeFrame> = null;
    try {
      result = analyzeFrame(wctx.getImageData(0, 0, W, H).data, W, H);
    } catch {
      result = null;
    }

    overlay.width = overlay.clientWidth;
    overlay.height = overlay.clientHeight;
    octx.clearRect(0, 0, overlay.width, overlay.height);

    if (result) {
      const s = statsRef.current;
      s.samples++;
      const centered = Math.abs(result.cx - 0.5) < 0.16 && result.cy > 0.08 && result.cy < 0.72;
      if (centered) s.centered++;
      s.smileSum += result.smile;
      if (s.last) s.moveSum += Math.hypot(result.cx - s.last.cx, result.cy - s.last.cy);
      s.last = { cx: result.cx, cy: result.cy };

      const eyeContact = Math.round((s.centered / s.samples) * 100);
      const smile = Math.round(s.smileSum / s.samples);
      const avgMove = s.samples > 1 ? s.moveSum / (s.samples - 1) : 0;
      const stability = Math.max(0, Math.min(100, Math.round(100 - avgMove * 900)));
      const next: VisionMetrics = { eyeContact, smile, stability, faceDetected: true, samples: s.samples };
      setLive(next);
      onMetricsRef.current(next);

      // Bounding overlay (mirrored to match the mirrored preview).
      const bx = (1 - result.box.x - result.box.w) * overlay.width;
      const by = result.box.y * overlay.height;
      const bw = result.box.w * overlay.width;
      const bh = result.box.h * overlay.height;
      octx.strokeStyle = centered ? "rgba(34,211,238,0.9)" : "rgba(244,114,182,0.9)";
      octx.lineWidth = 2;
      octx.strokeRect(bx, by, bw, bh);
      const corner = Math.min(18, bw / 4);
      octx.lineWidth = 4;
      octx.beginPath();
      octx.moveTo(bx, by + corner); octx.lineTo(bx, by); octx.lineTo(bx + corner, by);
      octx.moveTo(bx + bw - corner, by); octx.lineTo(bx + bw, by); octx.lineTo(bx + bw, by + corner);
      octx.moveTo(bx, by + bh - corner); octx.lineTo(bx, by + bh); octx.lineTo(bx + corner, by + bh);
      octx.moveTo(bx + bw - corner, by + bh); octx.lineTo(bx + bw, by + bh); octx.lineTo(bx + bw, by + bh - corner);
      octx.stroke();

      octx.fillStyle = "rgba(0,0,0,0.55)";
      octx.fillRect(bx, Math.max(0, by - 20), 116, 18);
      octx.fillStyle = "#e5f9ff";
      octx.font = "11px ui-sans-serif, system-ui";
      octx.fillText(centered ? "eye contact ✓" : "re-center your face", bx + 6, Math.max(12, by - 7));

      // Center guide
      octx.strokeStyle = "rgba(255,255,255,0.12)";
      octx.lineWidth = 1;
      octx.beginPath();
      octx.moveTo(overlay.width / 2, 0); octx.lineTo(overlay.width / 2, overlay.height);
      octx.stroke();
    }
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  const start = useCallback(async () => {
    setState("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      statsRef.current = { centered: 0, smileSum: 0, moveSum: 0, samples: 0, last: null };
      setState("on");
      rafRef.current = requestAnimationFrame(loop);
    } catch {
      setState("denied");
    }
  }, [loop]);

  useEffect(() => {
    if (!active) stop();
    return () => stop();
  }, [active, stop]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <div className="relative aspect-video bg-black">
        <video
          ref={videoRef}
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover -scale-x-100"
        />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
        <canvas ref={workRef} className="hidden" />
        {state !== "on" && (
          <div className="absolute inset-0 grid place-items-center text-center px-6">
            {state === "starting" ? (
              <div className="text-white/70 text-sm inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" /> Starting camera…
              </div>
            ) : (
              <div>
                <p className="text-sm text-white/70 mb-3">
                  {state === "denied"
                    ? "Camera blocked. You can still complete the interview — body-language metrics will be skipped."
                    : "Turn on your camera for eye contact, smile and head-stability tracking."}
                </p>
                <button
                  type="button"
                  onClick={start}
                  className="rounded-lg bg-white text-neutral-900 px-4 py-2 text-sm font-semibold inline-flex items-center gap-2"
                >
                  <Camera className="size-4" /> {state === "denied" ? "Try again" : "Enable camera"}
                </button>
              </div>
            )}
          </div>
        )}
        {state === "on" && (
          <button
            type="button"
            onClick={stop}
            className="absolute top-3 right-3 rounded-lg bg-black/60 border border-white/15 text-white/80 px-3 py-1.5 text-xs inline-flex items-center gap-1.5"
          >
            <CameraOff className="size-3.5" /> Stop
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 divide-x divide-white/10 border-t border-white/10">
        <Metric label="Eye contact" value={`${live.eyeContact}%`} tone={live.eyeContact >= 65 ? "good" : "warn"} />
        <Metric label="Smile" value={`${live.smile}`} tone={live.smile >= 35 ? "good" : "warn"} />
        <Metric label="Stability" value={`${live.stability}`} tone={live.stability >= 70 ? "good" : "warn"} />
      </div>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: "good" | "warn" }) {
  return (
    <div className="px-4 py-3">
      <div className="text-[10px] uppercase tracking-widest text-white/45">{label}</div>
      <div className={`text-lg font-semibold ${tone === "good" ? "text-cyan-300" : "text-amber-300"}`}>{value}</div>
    </div>
  );
}
