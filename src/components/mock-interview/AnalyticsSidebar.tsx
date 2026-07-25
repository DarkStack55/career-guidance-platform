import { motion, useReducedMotion } from "framer-motion";
import { Gauge, MessageSquareOff, ScanFace } from "lucide-react";
import { LiveMetrics } from "@/lib/mock-interview-data";
import { fillerVerdict, pacingVerdict } from "@/lib/interview-metrics";

function Card({
  icon,
  title,
  index,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  index: number;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: reduce ? 0 : 0.08 * index, ease: [0.32, 0.72, 0, 1] }}
      className="rounded-xl border border-white/10 bg-white/[0.04] p-4"
    >
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-white/50 mb-3">
        {icon} {title}
      </div>
      {children}
    </motion.div>
  );
}

function PacingGauge({ wpm, live }: { wpm: number; live: boolean }) {
  const size = 168;
  const r = 66;
  const cx = size / 2;
  const cy = size / 2 + 8;
  const clamped = Math.max(60, Math.min(220, wpm || 60));
  const t = (clamped - 60) / 160; // 0..1
  const angle = Math.PI * (1 - t);
  const nx = cx + Math.cos(angle) * (r - 8);
  const ny = cy - Math.sin(angle) * (r - 8);
  const arc = (from: number, to: number) => {
    const a1 = Math.PI * (1 - from);
    const a2 = Math.PI * (1 - to);
    return `M ${cx + Math.cos(a1) * r} ${cy - Math.sin(a1) * r} A ${r} ${r} 0 0 1 ${cx + Math.cos(a2) * r} ${cy - Math.sin(a2) * r}`;
  };
  const v = pacingVerdict(live ? wpm : 0);
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={cy + 14} className="overflow-visible">
        <path d={arc(0, (130 - 60) / 160)} stroke="rgba(255,255,255,0.14)" strokeWidth={10} fill="none" strokeLinecap="round" />
        <path d={arc((130 - 60) / 160, (165 - 60) / 160)} stroke="#22d3ee" strokeWidth={10} fill="none" />
        <path d={arc((165 - 60) / 160, 1)} stroke="rgba(244,63,94,0.45)" strokeWidth={10} fill="none" strokeLinecap="round" />
        {live && (
          <>
            <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#ffffff" strokeWidth={3} strokeLinecap="round" />
            <circle cx={cx} cy={cy} r={5} fill="#ffffff" />
          </>
        )}
      </svg>
      <div className="-mt-6 text-center">
        <div className="text-3xl font-semibold text-white tabular-nums">{live ? wpm : "—"}</div>
        <div className="text-[10px] uppercase tracking-widest text-white/45">words / min</div>
        <div
          className={`mt-2 text-xs ${v.tone === "good" ? "text-cyan-300" : v.tone === "warn" ? "text-amber-300" : "text-rose-300"}`}
        >
          {live ? v.label : "Waiting for session"}
        </div>
      </div>
    </div>
  );
}

export function AnalyticsSidebar({ metrics, live }: { metrics: LiveMetrics; live: boolean }) {
  const rate = metrics.words > 0 ? Number(((metrics.fillerCount / metrics.words) * 100).toFixed(1)) : 0;
  const fv = fillerVerdict(rate);
  const faceLabel =
    !live ? "No session" : metrics.faceState === "stable" ? "Stable" : metrics.faceState === "drifting" ? "Drifting" : "No face";
  const faceTone =
    !live || metrics.faceState === "none"
      ? "text-white/50 bg-white/10"
      : metrics.faceState === "stable"
        ? "text-cyan-300 bg-cyan-500/15"
        : "text-amber-300 bg-amber-500/15";

  return (
    <aside className="rounded-2xl bg-neutral-950 border border-white/10 p-4 md:p-5 shadow-[0_18px_50px_-24px_rgba(2,6,23,0.7)]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-white">Live Analytics</h2>
        <span
          className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-full ${live ? "bg-rose-500/20 text-rose-300" : "bg-white/10 text-white/50"}`}
        >
          {live ? "Recording" : "Idle"}
        </span>
      </div>

      <div className="space-y-3">
        <Card icon={<Gauge className="size-3.5" />} title="Speech Pacing" index={0}>
          <PacingGauge wpm={metrics.wpm} live={live} />
        </Card>

        <Card icon={<MessageSquareOff className="size-3.5" />} title="Filler Words" index={1}>
          <div className="flex items-end justify-between">
            <div className="text-3xl font-semibold text-white tabular-nums">{live ? metrics.fillerCount : "—"}</div>
            <div className="text-right">
              <div className="text-xs text-white/60 tabular-nums">{live ? `${rate} / 100 words` : "no data yet"}</div>
              <div
                className={`text-xs ${fv.tone === "good" ? "text-cyan-300" : fv.tone === "warn" ? "text-amber-300" : "text-rose-300"}`}
              >
                {live ? fv.label : "—"}
              </div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5 min-h-[26px]">
            {live && metrics.fillers.length > 0 ? (
              metrics.fillers.slice(0, 4).map((f) => (
                <span key={f.word} className="rounded-full bg-white/10 px-2 py-1 text-[11px] text-white/75">
                  {f.word} ×{f.count}
                </span>
              ))
            ) : (
              <span className="text-[11px] text-white/35">Detected fillers will appear here.</span>
            )}
          </div>
        </Card>

        <Card icon={<ScanFace className="size-3.5" />} title="Face Stability" index={2}>
          <div className="flex items-center justify-between">
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${faceTone}`}>{faceLabel}</span>
            <span className="text-sm text-white/70 tabular-nums">{live ? `${metrics.stability}%` : "—"}</span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-400"
              animate={{ width: `${live ? metrics.stability : 0}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
          <p className="mt-2 text-[11px] text-white/40 leading-relaxed">
            Keep your face centred in frame — drifting reads as low confidence on camera.
          </p>
        </Card>
      </div>
    </aside>
  );
}
