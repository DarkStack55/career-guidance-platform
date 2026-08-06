import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { X, Orbit } from "lucide-react";
import { universePlanets, careersByStream, careersByGroup } from "@/lib/career-hub";
import { CareerCard } from "@/components/career/CareerCard";

export const Route = createFileRoute("/career-universe")({
  head: () => ({
    meta: [
      { title: "AI Career Universe — Explore Careers as a Galaxy | CareerPilot AI" },
      { name: "description", content: "An interactive galaxy of careers. Click a glowing planet to zoom into its sector and reveal salaries, skills, colleges and live opportunities." },
      { property: "og:title", content: "AI Career Universe" },
      { property: "og:description", content: "Explore every career sector as an interactive galaxy of glowing planets." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Universe,
});

const ORBITS = [
  { top: "18%", left: "20%" },
  { top: "26%", left: "68%" },
  { top: "52%", left: "12%" },
  { top: "58%", left: "78%" },
  { top: "72%", left: "40%" },
  { top: "34%", left: "44%" },
];

function Universe() {
  const [active, setActive] = useState<number | null>(null);
  const planet = active !== null ? universePlanets[active] : null;
  const careers = planet
    ? (planet.group ? careersByGroup(planet.stream, planet.group) : careersByStream(planet.stream)).slice(0, 9)
    : [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="relative overflow-hidden min-h-[720px]">
        {/* space */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,color-mix(in_oklab,var(--color-primary)_14%,transparent),transparent_60%)]" />
        <div className="absolute inset-0 pointer-events-none opacity-70">
          {Array.from({ length: 70 }).map((_, i) => (
            <motion.span
              key={i}
              className="absolute rounded-full bg-foreground/50"
              style={{
                top: `${(i * 37) % 100}%`,
                left: `${(i * 53) % 100}%`,
                width: (i % 3) + 1,
                height: (i % 3) + 1,
              }}
              animate={{ opacity: [0.2, 0.9, 0.2] }}
              transition={{ duration: 2 + (i % 5), repeat: Infinity, delay: i * 0.07 }}
            />
          ))}
        </div>

        <div className="relative max-w-6xl mx-auto px-6 pt-16 text-center">
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-primary mb-3">
            <Orbit className="size-3.5" /> AI Career Universe
          </div>
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight">Every sector is a planet</h1>
          <p className="mt-4 max-w-xl mx-auto text-muted-foreground">
            Tap a glowing planet to zoom in and reveal its careers, salaries, skills and opportunities.
          </p>
        </div>

        <div className="relative mx-auto mt-8 h-[520px] max-w-5xl">
          {universePlanets.map((p, i) => (
            <motion.button
              key={p.name}
              onClick={() => setActive(i)}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ ...ORBITS[i], width: p.size, height: p.size }}
              animate={{ y: [0, -14, 0] }}
              transition={{ duration: 6 + i, repeat: Infinity, ease: "easeInOut" }}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              aria-label={`Explore ${p.name}`}
            >
              <span
                className="block size-full rounded-full"
                style={{
                  background: `radial-gradient(circle at 32% 30%, ${p.color}, color-mix(in oklab, ${p.color} 25%, transparent))`,
                  boxShadow: `0 0 40px ${p.color}66, inset -8px -12px 24px rgba(0,0,0,.45)`,
                }}
              />
              <span className="mt-2 block text-xs font-medium text-foreground whitespace-nowrap">{p.name}</span>
            </motion.button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {planet && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xl overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 24 }}
              className="max-w-6xl mx-auto px-6 py-14"
            >
              <div className="flex items-start justify-between gap-4 mb-8">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-primary mb-2">Sector</div>
                  <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">{planet.name}</h2>
                  <Link
                    to="/stream/$id"
                    params={{ id: planet.stream }}
                    className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline"
                  >
                    Open the full dashboard →
                  </Link>
                </div>
                <button
                  onClick={() => setActive(null)}
                  className="rounded-full border border-border bg-card p-2 text-foreground hover:border-primary"
                  aria-label="Close"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {careers.map((c, i) => <CareerCard key={c.slug} career={c} index={i} />)}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
