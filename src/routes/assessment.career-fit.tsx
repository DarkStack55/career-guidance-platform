import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, ArrowRight, Orbit } from "lucide-react";
import { streams } from "@/lib/career-hub";
import { getLatestByKind, type LatestByKind } from "@/lib/assessments.functions";

export const Route = createFileRoute("/assessment/career-fit")({
  head: () => ({
    meta: [
      { title: "AI Career Discovery Hub — CareerPilot AI" },
      { name: "description", content: "Pick your educational stream and unlock a personalised dashboard of careers, colleges, entrance exams, salaries and AI match scores." },
      { property: "og:title", content: "AI Career Discovery Hub" },
      { property: "og:description", content: "Choose your stream and explore 100+ careers with salaries, roadmaps and AI recommendations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const MATRIX: Array<{ role: string; weights: { personality?: number; technical?: number; aptitude?: number; interview?: number }; traits?: string[] }> = [
  { role: "Software Engineer", weights: { technical: 0.6, aptitude: 0.3, personality: 0.1 }, traits: ["Conscientiousness"] },
  { role: "Data Scientist", weights: { technical: 0.5, aptitude: 0.4, personality: 0.1 }, traits: ["Openness"] },
  { role: "Product Manager", weights: { personality: 0.5, aptitude: 0.3, technical: 0.2 }, traits: ["Extraversion", "Conscientiousness"] },
  { role: "UX Designer", weights: { personality: 0.6, aptitude: 0.2, technical: 0.2 }, traits: ["Openness", "Agreeableness"] },
  { role: "DevOps / SRE", weights: { technical: 0.55, aptitude: 0.3, personality: 0.15 }, traits: ["Stability", "Conscientiousness"] },
  { role: "Sales Executive", weights: { personality: 0.7, aptitude: 0.2, interview: 0.1 }, traits: ["Extraversion"] },
  { role: "Research Scientist", weights: { aptitude: 0.5, technical: 0.3, personality: 0.2 }, traits: ["Openness"] },
  { role: "Project Manager", weights: { personality: 0.5, aptitude: 0.3, technical: 0.2 }, traits: ["Conscientiousness"] },
];

function Page() {
  const load = useServerFn(getLatestByKind);
  const [latest, setLatest] = useState<LatestByKind | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    load()
      .then((d) => mounted && setLatest(d as LatestByKind))
      .catch(() => mounted && setLatest({}))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [load]);

  const missing = (["personality", "technical", "aptitude"] as const).filter((k) => !latest?.[k]);
  const ranked = MATRIX.map((r) => {
    let score = 0;
    let weight = 0;
    for (const [k, w] of Object.entries(r.weights) as Array<[string, number]>) {
      const s = latest?.[k]?.score;
      if (typeof s === "number") { score += s * w; weight += w; }
    }
    const traits = (latest?.personality?.details as { traits?: Record<string, number> } | undefined)?.traits;
    let bonus = 0;
    if (traits && r.traits) {
      const avg = r.traits.reduce((acc, t) => acc + (traits[t] ?? 0), 0) / r.traits.length;
      bonus = (avg - 50) * 0.1;
    }
    return { role: r.role, score: weight ? Math.max(0, Math.min(100, Math.round(score / weight + bonus))) : 0 };
  }).sort((a, b) => b.score - a.score).slice(0, 5);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -left-32 size-[560px] rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute -bottom-52 -right-24 size-[560px] rounded-full bg-fuchsia-500/10 blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-10 text-center">
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-primary mb-4">
            <Sparkles className="size-3.5" /> AI Career Discovery Hub
          </div>
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight">
            Start with where you are right now
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-muted-foreground leading-relaxed">
            Choose your educational background and we'll open a dedicated dashboard — every career it unlocks, with salaries,
            colleges, entrance exams, roadmaps and an AI match score.
          </p>
        </div>
      </div>

      {/* Stream cards */}
      <div className="max-w-6xl mx-auto px-6 pb-12">
        <div className="grid gap-5 sm:grid-cols-2">
          {streams.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
            >
              <motion.div
                animate={{ y: [0, -7, 0] }}
                transition={{ duration: 5 + i, repeat: Infinity, ease: "easeInOut" }}
              >
                <motion.div whileHover={{ scale: 1.02, rotateX: -3, rotateY: 3 }} whileTap={{ scale: 0.97 }} style={{ perspective: 800 }}>
                  <Link
                    to="/stream/$id"
                    params={{ id: s.id }}
                    className="group relative block overflow-hidden rounded-3xl border border-border bg-card/70 backdrop-blur-xl p-7 shadow-elevated transition-colors hover:border-primary/60"
                  >
                    <div className={`absolute inset-x-0 -top-24 h-48 bg-gradient-to-br ${s.accent} opacity-10 blur-3xl group-hover:opacity-25 transition-opacity`} />
                    <div className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br ${s.accent} [mask:linear-gradient(#000,#000)_content-box,linear-gradient(#000,#000)] p-px`} style={{ WebkitMaskComposite: "xor", maskComposite: "exclude" }} />
                    <div className="relative">
                      <div className="text-4xl">{s.icon}</div>
                      <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">{s.label}</h2>
                      <div className="mt-1 text-[11px] uppercase tracking-[0.16em] text-primary">{s.tagline}</div>
                      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{s.description}</p>
                      <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                        Open dashboard
                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 flex justify-center">
          <Link
            to="/career-universe"
            className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors"
          >
            <Orbit className="size-4" /> Or explore the AI Career Universe
          </Link>
        </div>
      </div>

      {/* AI recommendation engine */}
      <div className="max-w-6xl mx-auto px-6 pb-24">
        <div className="rounded-3xl border border-border bg-card/60 backdrop-blur-xl p-7">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">AI Recommendation Engine</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Built from your personality, technical, aptitude and interview results.
          </p>

          {loading ? (
            <div className="mt-6 space-y-3">
              {[0, 1, 2].map((i) => <div key={i} className="h-12 rounded-xl bg-muted/50 animate-pulse" />)}
            </div>
          ) : missing.length === 3 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-border p-8 text-center">
              <p className="text-foreground mb-4">Take at least one assessment to unlock your personalised ranking.</p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link to="/assessment/personality" className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold">Personality</Link>
                <Link to="/assessment/technical" className="rounded-lg border border-border text-foreground px-4 py-2 text-sm font-semibold">Technical</Link>
                <Link to="/assessment/aptitude" className="rounded-lg border border-border text-foreground px-4 py-2 text-sm font-semibold">Aptitude</Link>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                {(["personality", "technical", "aptitude", "interview"] as const).map((k) => (
                  <div key={k} className="rounded-2xl border border-border bg-muted/30 p-4 text-center">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{k}</div>
                    <div className="text-2xl font-semibold text-foreground">
                      {latest?.[k]?.score ?? <span className="text-muted-foreground text-base">—</span>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                {ranked.map((r, i) => (
                  <div key={r.role} className="rounded-2xl border border-border bg-muted/20 p-5 flex items-center gap-4">
                    <div className="text-2xl font-mono text-muted-foreground w-8 shrink-0">#{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-foreground font-medium">
                        {r.role}
                        {i === 0 && <span className="ml-2 text-[10px] uppercase tracking-widest text-primary">Best career</span>}
                        {i === 1 && <span className="ml-2 text-[10px] uppercase tracking-widest text-muted-foreground">Second best</span>}
                        {i === ranked.length - 1 && <span className="ml-2 text-[10px] uppercase tracking-widest text-emerald-500">Hidden talent</span>}
                      </div>
                      <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-cyan-400 to-fuchsia-500" style={{ width: `${r.score}%` }} />
                      </div>
                    </div>
                    <div className="w-14 text-right text-foreground font-medium">{r.score}</div>
                  </div>
                ))}
              </div>

              {missing.length > 0 && (
                <p className="text-xs text-muted-foreground">Complete {missing.join(", ")} for a sharper ranking.</p>
              )}

              <div className="flex flex-wrap gap-3">
                <Link to="/skills" className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground">Skill gap analysis</Link>
                <Link to="/roadmap" className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold">
                  Turn this into a roadmap <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
