import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, ArrowRight } from "lucide-react";
import { AssessmentShell } from "@/components/AssessmentShell";
import { ScoreRing } from "@/components/ScoreRing";
import { getLatestByKind, type LatestByKind } from "@/lib/assessments.functions";

export const Route = createFileRoute("/assessment/career-fit")({
  head: () => ({
    meta: [
      { title: "Career Fit Analyzer — CareerPilot AI" },
      { name: "description", content: "Combine your personality, technical, and aptitude results into a ranked list of careers that fit you." },
      { property: "og:title", content: "Career Fit Analyzer" },
      { property: "og:description", content: "See which careers match your assessment results." },
    ],
  }),
  component: Page,
});

const MATRIX: Array<{
  role: string;
  weights: { personality?: number; technical?: number; aptitude?: number; interview?: number };
  traits?: string[];
}> = [
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
    return () => {
      mounted = false;
    };
  }, [load]);

  const missing = (["personality", "technical", "aptitude"] as const).filter((k) => !latest?.[k]);
  const ranked = MATRIX.map((r) => {
    let score = 0;
    let weight = 0;
    for (const [k, w] of Object.entries(r.weights) as Array<[string, number]>) {
      const s = latest?.[k]?.score;
      if (typeof s === "number") {
        score += s * w;
        weight += w;
      }
    }
    // Trait bonus if personality took place
    const traits = (latest?.personality?.details as { traits?: Record<string, number> } | undefined)?.traits;
    let bonus = 0;
    if (traits && r.traits) {
      const avg = r.traits.reduce((acc, t) => acc + (traits[t] ?? 0), 0) / r.traits.length;
      bonus = (avg - 50) * 0.1;
    }
    return { role: r.role, score: weight ? Math.max(0, Math.min(100, Math.round(score / weight + bonus))) : 0 };
  })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return (
    <AssessmentShell
      eyebrow="Career Fit Analyzer"
      title="Which careers fit the shape of your results?"
      description="We combine your personality, technical, and aptitude scores into a ranked list of matches."
      nextPath="/assessment/career-fit"
    >
      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <span className="size-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
          Loading your results…
        </div>
      ) : missing.length === 3 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <Sparkles className="size-6 text-accent mx-auto mb-3" />
          <p className="text-foreground mb-4">Take at least one assessment to see your fit ranking.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/assessment/personality" className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold">Personality</Link>
            <Link to="/assessment/technical" className="rounded-lg border border-border text-foreground px-4 py-2 text-sm font-semibold">Technical</Link>
            <Link to="/assessment/aptitude" className="rounded-lg border border-border text-foreground px-4 py-2 text-sm font-semibold">Aptitude</Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            {(["personality", "technical", "aptitude", "interview"] as const).map((k) => (
              <div key={k} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
                <div className="text-[10px] uppercase tracking-widest text-white/50 mb-1">{k.replace("_", " ")}</div>
                <div className="text-2xl font-semibold text-white">
                  {latest?.[k]?.score ?? <span className="text-white/40 text-base">—</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {ranked.map((r, i) => (
              <div key={r.role} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex items-center gap-4">
                <div className="text-2xl font-mono text-white/40 w-8 shrink-0">#{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium">{r.role}</div>
                  <div className="mt-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-400 to-fuchsia-500" style={{ width: `${r.score}%` }} />
                  </div>
                </div>
                <div className="w-14 text-right text-white/80 font-medium">{r.score}</div>
              </div>
            ))}
          </div>

          {missing.length > 0 && (
            <p className="text-xs text-white/50">
              Complete {missing.join(", ")} for a sharper ranking.
            </p>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <Link to="/roadmap" className="inline-flex items-center gap-2 rounded-lg bg-white text-neutral-900 px-4 py-2 text-sm font-semibold">
              Turn this into a roadmap <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      )}
    </AssessmentShell>
  );
}
