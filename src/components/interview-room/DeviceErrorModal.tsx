import { AlertTriangle, MessageSquare, PhoneOff, RotateCw, Keyboard } from "lucide-react";

export function DeviceErrorModal({
  message,
  onRetry,
  onTextMode,
  onEnd,
}: {
  message?: string;
  onRetry: () => void;
  onTextMode: () => void;
  onEnd: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[120] grid place-items-center bg-neutral-950/85 backdrop-blur-md px-5">
      <div className="w-full max-w-md rounded-[18px] border border-white/10 bg-neutral-900/90 p-7 text-center shadow-2xl">
        <div className="mx-auto mb-4 size-12 rounded-full bg-rose-500/15 grid place-items-center">
          <AlertTriangle className="size-6 text-rose-400" />
        </div>
        <h2 className="text-lg font-semibold text-white">Connection or device issue detected</h2>
        <p className="mt-2 text-sm text-white/60 leading-relaxed">
          Please check your microphone, camera, and network.
        </p>
        {message && (
          <p className="mt-3 rounded-xl bg-white/5 px-3 py-2 text-xs text-white/50 break-words">{message}</p>
        )}
        <div className="mt-6 grid gap-2">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400 transition-colors"
          >
            <RotateCw className="size-4" /> Retry
          </button>
          <button
            type="button"
            onClick={onTextMode}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm text-white/90 hover:bg-white/10 transition-colors"
          >
            <Keyboard className="size-4" /> Switch to Text Mode
          </button>
          <button
            type="button"
            onClick={onEnd}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm text-rose-300 hover:bg-rose-500/10 transition-colors"
          >
            <PhoneOff className="size-4" /> End Interview
          </button>
        </div>
        <p className="mt-4 inline-flex items-center gap-1.5 text-[11px] text-white/40">
          <MessageSquare className="size-3" /> Subtitles and transcript keep working in text mode.
        </p>
      </div>
    </div>
  );
}
