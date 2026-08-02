import { useEffect, useState } from "react";

export function ScoreRing({
  score,
  label,
  size = 140,
  stroke = 10,
}: {
  score: number;
  label?: string;
  size?: number;
  stroke?: number;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const dur = 900;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setDisplay(Math.round(clamped * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [clamped]);

  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (display / 100) * c;
  const tone =
    clamped >= 80 ? "#22d3ee" : clamped >= 60 ? "#a78bfa" : clamped >= 40 ? "#f59e0b" : "#f43f5e";

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--border)" strokeWidth={stroke} fill="none" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={tone}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={off}
            style={{ filter: `drop-shadow(0 0 8px ${tone}55)`, transition: "stroke 0.4s" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-semibold text-foreground">{display}</span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">/ 100</span>
        </div>
      </div>
      {label && <div className="text-xs text-muted-foreground uppercase tracking-widest">{label}</div>}
    </div>
  );
}
