import { useEffect, useRef, useState } from "react";
import { Video, VideoOff, AlertTriangle } from "lucide-react";

export function VideoStage({
  active,
  timerLabel,
  progressLabel,
  onCameraError,
}: {
  active: boolean;
  timerLabel: string;
  progressLabel: string;
  onCameraError?: (msg: string | null) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const errCb = useRef(onCameraError);
  errCb.current = onCameraError;

  useEffect(() => {
    let cancelled = false;
    const stop = () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    };

    if (!active) {
      stop();
      setError(null);
      errCb.current?.(null);
      return;
    }

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        setError(null);
        errCb.current?.(null);
      } catch {
        const msg = "Camera unavailable or permission denied — continuing in audio-off practice mode.";
        if (!cancelled) {
          setError(msg);
          errCb.current?.(msg);
        }
      }
    })();

    return () => {
      cancelled = true;
      stop();
    };
  }, [active]);

  return (
    <div className="rounded-2xl border border-black/[0.07] dark:border-white/10 bg-white dark:bg-white/[0.03] shadow-[0_10px_30px_-18px_rgba(15,23,42,0.35)] overflow-hidden">
      <div className="relative aspect-video bg-neutral-950">
        <video
          ref={videoRef}
          muted
          playsInline
          className={`absolute inset-0 w-full h-full object-cover -scale-x-100 ${active && !error ? "opacity-100" : "opacity-0"}`}
        />

        {(!active || error) && (
          <div className="absolute inset-0 grid place-items-center px-8 text-center">
            <div>
              <div className="mx-auto mb-3 size-12 rounded-full bg-white/10 grid place-items-center">
                {error ? (
                  <AlertTriangle className="size-5 text-amber-300" />
                ) : (
                  <VideoOff className="size-5 text-white/60" />
                )}
              </div>
              <p className="text-sm text-white/70 max-w-sm mx-auto leading-relaxed">
                {error ?? "Camera preview will appear here. Press Start Session when you're ready."}
              </p>
            </div>
          </div>
        )}

        {active && (
          <>
            <div className="absolute top-3 left-3 inline-flex items-center gap-2 rounded-full bg-black/60 backdrop-blur px-3 py-1.5 text-[11px] font-medium text-white">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-2 rounded-full bg-rose-500 animate-ping" />
                <span className="relative inline-flex size-2 rounded-full bg-rose-500" />
              </span>
              {error ? "Session Active" : "Camera Active"}
            </div>
            <div className="absolute top-3 right-3 flex items-center gap-2">
              <span className="rounded-full bg-black/60 backdrop-blur px-3 py-1.5 text-[11px] font-mono text-white/90">
                {timerLabel}
              </span>
              <span className="rounded-full bg-black/60 backdrop-blur px-3 py-1.5 text-[11px] text-white/80">
                {progressLabel}
              </span>
            </div>
          </>
        )}

        {!active && (
          <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-[11px] text-white/60">
            <Video className="size-3.5" /> Idle
          </div>
        )}
      </div>
    </div>
  );
}
