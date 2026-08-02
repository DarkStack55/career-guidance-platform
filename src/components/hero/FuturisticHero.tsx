import { lazy, Suspense, useEffect, useState, useRef } from "react";
import { motion, useMotionValue, useSpring, useMotionTemplate } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Brain, Search, Sparkles, ArrowRight } from "lucide-react";

const NeuralCanvas = lazy(() => import("./NeuralCanvas"));

function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}

function MagneticButton({
  children,
  className = "",
  onClick,
  strength = 0.35,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  strength?: number;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useSpring(0, { stiffness: 260, damping: 18, mass: 0.4 });
  const y = useSpring(0, { stiffness: 260, damping: 18, mass: 0.4 });

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      onMouseMove={(e) => {
        const r = ref.current!.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      style={{ x, y }}
      whileHover={{ scale: 1.03, filter: "brightness(1.2)" }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      className={className}
    >
      {children}
    </motion.button>
  );
}

function FuturisticSearch() {
  const [q, setQ] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim()) window.location.href = `/jobs?q=${encodeURIComponent(q)}`;
      }}
      className="group relative w-full"
    >
      <div
        aria-hidden
        className="absolute -inset-[1.5px] rounded-2xl opacity-60 group-hover:opacity-100 group-focus-within:opacity-100 blur-[2px] transition-opacity"
        style={{
          background: "conic-gradient(from 0deg, #8b5cf6, #22d3ee, #ec4899, #8b5cf6)",
          animation: "spin 6s linear infinite",
        }}
      />
      <div className="relative flex items-center gap-2 rounded-2xl bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] p-2 pl-5">
        <Search className="size-5 text-white/60 shrink-0" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search 2,400+ careers — try 'AI Engineer', 'UX Designer', 'Pilot'…"
          className="flex-1 bg-transparent text-white placeholder:text-white/40 py-3 outline-none text-[15px]"
        />
        <MagneticButton className="relative inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 text-white text-sm font-semibold shadow-[0_0_25px_-4px_rgba(139,92,246,0.6)]">
          Search <ArrowRight className="size-4" />
        </MagneticButton>
      </div>
    </form>
  );
}

/** Word-by-word cinematic reveal with blur-to-focus. */
function CinematicHeadline({ lines }: { lines: Array<string | { text: string; gradient?: boolean }[]> }) {
  let wordIndex = 0;
  return (
    <div>
      {lines.map((line, li) => {
        const segments = typeof line === "string" ? [{ text: line, gradient: false }] : line;
        return (
          <h1
            key={li}
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.02] text-white"
          >
            {segments.map((seg, si) => {
              const words = seg.text.split(" ");
              return (
                <span key={si} className={seg.gradient ? "bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-300 bg-clip-text text-transparent" : ""}>
                  {words.map((w, wi) => {
                    const idx = wordIndex++;
                    return (
                      <motion.span
                        key={`${li}-${si}-${wi}`}
                        className="inline-block will-change-transform"
                        initial={{ opacity: 0, y: 40, filter: "blur(14px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        transition={{
                          duration: 0.9,
                          delay: 0.25 + idx * 0.08,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      >
                        {w}
                        {wi < words.length - 1 || si < segments.length - 1 ? "\u00A0" : ""}
                      </motion.span>
                    );
                  })}
                </span>
              );
            })}
          </h1>
        );
      })}
    </div>
  );
}

export function FuturisticHero() {
  const hydrated = useHydrated();

  // Mouse-reactive radial glow behind primary glass content
  const mx = useMotionValue(50);
  const my = useMotionValue(30);
  const sx = useSpring(mx, { stiffness: 60, damping: 20 });
  const sy = useSpring(my, { stiffness: 60, damping: 20 });
  const glow = useMotionTemplate`radial-gradient(600px circle at ${sx}% ${sy}%, rgba(139,92,246,0.22), rgba(34,211,238,0.08) 40%, transparent 70%)`;

  return (
    <section
      data-theme-surface="dark"
      className="relative isolate overflow-hidden bg-[#0a0a0a]"
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set(((e.clientX - r.left) / r.width) * 100);
        my.set(((e.clientY - r.top) / r.height) * 100);
      }}
    >
      {/* Breathing aurora orbs — constrained & responsive */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-16 z-0 size-[280px] md:size-[440px] lg:size-[560px] rounded-full bg-violet-600/25 blur-[100px] md:blur-[140px]"
        animate={{ scale: [1, 1.15, 1], opacity: [0.55, 0.9, 0.55] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-1/3 -right-20 z-0 size-[260px] md:size-[420px] lg:size-[520px] rounded-full bg-cyan-400/20 blur-[100px] md:blur-[140px]"
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 left-1/2 -translate-x-1/2 z-0 size-[240px] md:size-[380px] lg:size-[480px] rounded-full bg-fuchsia-500/20 blur-[100px] md:blur-[140px]"
        animate={{ scale: [1, 1.2, 1], opacity: [0.45, 0.8, 0.45] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2.4 }}
      />

      {/* Mouse-reactive radial glow */}
      <motion.div aria-hidden className="pointer-events-none absolute inset-0 z-0" style={{ background: glow }} />

      {/* Subtle grid overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)",
        }}
      />

      {/* 3D canvas — desktop only; too heavy & visually noisy on mobile */}
      <div className="pointer-events-none absolute inset-0 z-0 hidden md:block">
        {hydrated && (
          <Suspense fallback={null}>
            <NeuralCanvas />
          </Suspense>
        )}
      </div>

      {/* Vignette to seat text */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-transparent via-[#0a0a0a]/40 to-[#0a0a0a]" />

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-28 pb-32 md:pt-36 md:pb-40">

        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] text-xs font-medium text-white/70 mb-8"
          >
            <Sparkles className="size-3.5 text-cyan-300" />
            <span>Powered by a neural career engine · 44 industries</span>
          </motion.div>

          <CinematicHeadline
            lines={[
              "Find the career",
              [{ text: "you were " }, { text: "built for.", gradient: true }],
            ]}
          />

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.4 }}
            className="mt-7 text-lg md:text-xl text-white/60 max-w-2xl leading-relaxed"
          >
            CareerPilot fuses verified labor data, resume intelligence, and a personalized
            neural assessment into one adaptive roadmap — for the career you'll actually love.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.6 }}
            className="mt-10 max-w-2xl"
          >
            <FuturisticSearch />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.8 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Link to="/assessment">
              <MagneticButton className="relative overflow-hidden inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-[#05060d] text-sm font-semibold shadow-[0_10px_40px_-10px_rgba(255,255,255,0.4)]">
                <span className="relative z-10 inline-flex items-center gap-2">
                  <Brain className="size-4" /> Take the neural assessment
                </span>
                {/* Infinite sweeping shimmer */}
                <motion.span
                  aria-hidden
                  className="absolute inset-y-0 -left-1/2 w-1/2 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(120deg, transparent 0%, rgba(139,92,246,0.35) 45%, rgba(34,211,238,0.35) 55%, transparent 100%)",
                    mixBlendMode: "screen",
                  }}
                  animate={{ x: ["0%", "400%"] }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.6 }}
                />
              </MagneticButton>
            </Link>
            <Link
              to="/resume"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] text-white text-sm font-medium hover:bg-white/10 hover:border-white/25 transition-all"
            >
              <Sparkles className="size-4 text-cyan-300" /> Analyze my resume
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
