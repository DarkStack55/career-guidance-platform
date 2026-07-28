import { motion } from "framer-motion";
import { ScoreRing } from "@/components/ScoreRing";

export type SubScore = { label: string; value: number };

export function ReadinessPanel({ overall, subs }: { overall: number; subs: SubScore[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 md:p-8 backdrop-blur-xl">
      <div className="flex flex-col items-center gap-8 md:flex-row md:items-center">
        <div className="shrink-0">
          <ScoreRing score={overall} label="Overall Readiness" size={160} />
        </div>
        <div className="w-full grid gap-4 sm:grid-cols-2">
          {subs.map((s, i) => (
            <div key={s.label}>
              <div className="mb-1.5 flex items-baseline justify-between text-xs">
                <span className="uppercase tracking-[0.14em] text-white/50">{s.label}</span>
                <span className="font-mono text-white/80">{Math.round(s.value)}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(0, Math.min(100, s.value))}%` }}
                  transition={{ duration: 0.9, delay: 0.1 * i, ease: "easeOut" }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
