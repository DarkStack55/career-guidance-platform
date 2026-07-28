import { motion } from "framer-motion";

const BOX = "relative h-36 w-full overflow-hidden rounded-xl border border-white/10 bg-black/30";

/** Card 1 — swipeable stacked workplace scenario cards */
export function ScenarioPreview() {
  const cards = [
    { t: "Your teammate misses a deadline.", d: 0 },
    { t: "A client escalates over email.", d: 0.15 },
    { t: "Two priorities, one afternoon.", d: 0.3 },
  ];
  return (
    <div className={BOX}>
      <div className="absolute inset-0 grid place-items-center">
        {cards.map((c, i) => (
          <motion.div
            key={c.t}
            className="absolute w-[72%] rounded-lg border border-white/12 bg-white/[0.06] backdrop-blur-md px-3 py-3 text-[11px] text-white/80 shadow-[0_12px_30px_-16px_rgba(0,0,0,0.9)]"
            style={{ zIndex: cards.length - i }}
            initial={{ y: i * 10, rotate: (i - 1) * 4, scale: 1 - i * 0.05 }}
            animate={{
              y: [i * 10, i * 10 - 4, i * 10],
              rotate: [(i - 1) * 4, (i - 1) * 4 + 1.5, (i - 1) * 4],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: c.d }}
          >
            {c.t}
            <div className="mt-2 flex gap-1">
              <span className="h-1 flex-1 rounded-full bg-cyan-400/50" />
              <span className="h-1 flex-1 rounded-full bg-white/10" />
              <span className="h-1 flex-1 rounded-full bg-white/10" />
            </div>
          </motion.div>
        ))}
      </div>
      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-6 text-[9px] uppercase tracking-[0.2em] text-white/35">
        <span>◀ avoid</span>
        <span>engage ▶</span>
      </div>
    </div>
  );
}

/** Card 2 — split terminal + CAD grid */
export function SandboxPreview() {
  const lines = ["const solve = (n) => {", "  return n.map(fit)", "}", "> running tests…", "✓ 8/8 passed"];
  return (
    <div className={`${BOX} grid grid-cols-2`}>
      <div className="border-r border-white/10 p-3 font-mono text-[9px] leading-relaxed text-cyan-300/80">
        {lines.map((l, i) => (
          <motion.div
            key={l}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 * i, duration: 0.4, repeat: Infinity, repeatDelay: 3, repeatType: "reverse" }}
          >
            {l}
          </motion.div>
        ))}
      </div>
      <div className="relative">
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
          <defs>
            <pattern id="cadgrid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M10 0H0V10" fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="0.6" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#cadgrid)" />
          <motion.path
            d="M22 70 L50 26 L78 70 Z"
            fill="none"
            stroke="#e879f9"
            strokeWidth="1.4"
            strokeDasharray="180"
            animate={{ strokeDashoffset: [180, 0, 180] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <circle cx="50" cy="26" r="2" fill="#22d3ee" />
          <circle cx="22" cy="70" r="2" fill="#22d3ee" />
          <circle cx="78" cy="70" r="2" fill="#22d3ee" />
        </svg>
      </div>
    </div>
  );
}

/** Card 3 — animated radar / spider chart */
export function RadarPreview() {
  const axes = ["Spatial", "Numerical", "Deductive", "Verbal", "Speed"];
  const values = [0.82, 0.64, 0.9, 0.55, 0.72];
  const cx = 50, cy = 50, R = 34;
  const pt = (i: number, r: number) => {
    const a = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
    return [cx + Math.cos(a) * R * r, cy + Math.sin(a) * R * r];
  };
  const poly = (r: number[]) => r.map((v, i) => pt(i, v).join(",")).join(" ");
  return (
    <div className={`${BOX} grid place-items-center`}>
      <svg viewBox="0 0 100 100" className="h-full w-full">
        {[0.33, 0.66, 1].map((r) => (
          <polygon key={r} points={poly(axes.map(() => r))} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
        ))}
        {axes.map((a, i) => {
          const [x, y] = pt(i, 1);
          return <line key={a} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />;
        })}
        <motion.polygon
          points={poly(values)}
          fill="rgba(34,211,238,0.18)"
          stroke="#22d3ee"
          strokeWidth="1.2"
          animate={{ opacity: [0.6, 1, 0.6], scale: [0.97, 1, 0.97] }}
          style={{ transformOrigin: "50px 50px" }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        />
        {values.map((v, i) => {
          const [x, y] = pt(i, v);
          return <circle key={i} cx={x} cy={y} r="1.4" fill="#a78bfa" />;
        })}
      </svg>
    </div>
  );
}

/** Card 4 — constellation / skill-tree node graph */
export function ConstellationPreview() {
  const nodes = [
    { x: 16, y: 50, label: "you" },
    { x: 40, y: 24 },
    { x: 40, y: 74 },
    { x: 64, y: 38 },
    { x: 64, y: 66 },
    { x: 86, y: 50, label: "role" },
  ];
  const edges = [[0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 5], [1, 4]];
  return (
    <div className={BOX}>
      <svg viewBox="0 0 100 100" className="h-full w-full">
        {edges.map(([a, b], i) => (
          <motion.line
            key={i}
            x1={nodes[a].x}
            y1={nodes[a].y}
            x2={nodes[b].x}
            y2={nodes[b].y}
            stroke="rgba(232,121,249,0.45)"
            strokeWidth="0.7"
            animate={{ opacity: [0.25, 0.9, 0.25] }}
            transition={{ duration: 3, repeat: Infinity, delay: i * 0.25, ease: "easeInOut" }}
          />
        ))}
        {nodes.map((n, i) => (
          <motion.circle
            key={i}
            cx={n.x}
            cy={n.y}
            r={n.label ? 3.4 : 2.2}
            fill={n.label ? "#22d3ee" : "#a78bfa"}
            animate={{ opacity: [0.55, 1, 0.55] }}
            transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
        <text x="10" y="62" fontSize="5" fill="rgba(255,255,255,0.4)">you</text>
        <text x="78" y="62" fontSize="5" fill="rgba(255,255,255,0.4)">role</text>
      </svg>
    </div>
  );
}
