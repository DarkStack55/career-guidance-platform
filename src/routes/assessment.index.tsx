import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { Sparkles, FileText, Mic } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { ReadinessPanel } from "@/components/assessment/ReadinessPanel";
import { AssessmentCard, type CardStatus } from "@/components/assessment/AssessmentCard";
import {
  ScenarioPreview,
  SandboxPreview,
  RadarPreview,
  ConstellationPreview,
} from "@/components/assessment/AssessmentPreviews";
import { getLatestByKind, type LatestByKind } from "@/lib/assessments.functions";

export const Route = createFileRoute("/assessment/")({
  head: () => ({
    meta: [
      { title: "Assessment Hub — AI Career Intelligence Engine | CareerPilot AI" },
      {
        name: "description",
        content:
          "Launch four next-generation assessments — workplace DNA simulator, live technical sandbox, cognitive pressure test and career constellation map — and track your overall readiness score.",
      },
      { property: "og:title", content: "AI-Powered Career Intelligence Engine" },
      {
        property: "og:description",
        content: "Four next-gen assessments and a live readiness score in one dashboard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AssessmentHub,
});

const DEMO = { personality: 72, technical: 66, aptitude: 74, career_fit: 60 };

function AssessmentHub() {
  const { user } = useAuth();
  const load = useServerFn(getLatestByKind);
  const [latest, setLatest] = useState<LatestByKind | null>(null);

  useEffect(() => {
    if (!user) {
      setLatest(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await load();
        if (!cancelled) setLatest(res);
      } catch {
        if (!cancelled) setLatest(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, load]);

  const scoreOf = (kind: keyof typeof DEMO) => latest?.[kind]?.score ?? DEMO[kind];
  const statusOf = (kind: keyof typeof DEMO): CardStatus => {
    const row = latest?.[kind];
    if (!row) return "Unlocked";
    return row.score >= 60 ? "Complete" : "In Progress";
  };

  const subs = [
    { label: "Workplace DNA", value: scoreOf("personality") },
    { label: "Technical Mastery", value: scoreOf("technical") },
    { label: "Cognitive Speed", value: scoreOf("aptitude") },
    { label: "Market Fit", value: scoreOf("career_fit") },
  ];
  const overall = Math.round(subs.reduce((a, s) => a + s.value, 0) / subs.length);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full bg-fuchsia-500/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6 pt-16 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-3 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-primary">
              <Sparkles className="size-3.5" /> Assessment Matrix
            </div>
            <h1 className="max-w-3xl text-foreground text-3xl font-semibold tracking-tight md:text-5xl">
              AI-Powered Career Intelligence Engine
            </h1>
            <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
              Four next-generation modules measure how you decide, build, think and fit — then fuse
              the signals into a single readiness score.
              {!user && " Sign in to replace the demo profile with your own results."}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.5 }}
            className="mt-8"
          >
            <ReadinessPanel overall={overall} subs={subs} />
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-8">
        <div className="grid gap-5 md:grid-cols-2">
          <AssessmentCard
            index={0}
            title="Immersive Scenario Simulator"
            subtitle="Real-time decision making & workplace dilemma simulations."
            badge="Workplace DNA Matrix"
            status={statusOf("personality")}
            cta="Launch Simulator"
            to="/assessment/personality"
            preview={<ScenarioPreview />}
          />
          <AssessmentCard
            index={1}
            title="Live Application Sandbox"
            subtitle="Live problem-solving analyzed by AI logic engine."
            badge="Real-Time AI Grading"
            status={statusOf("technical")}
            cta="Enter Sandbox"
            to="/assessment/technical"
            preview={<SandboxPreview />}
          />
          <AssessmentCard
            index={2}
            title="Cognitive Radar & Pressure Test"
            subtitle="Time-locked puzzles tracking speed, accuracy, and logic."
            badge="Gamified Speed Test"
            status={statusOf("aptitude")}
            cta="Start Pressure Test"
            to="/assessment/aptitude"
            preview={<RadarPreview />}
          />
          <AssessmentCard
            index={3}
            title="Career Constellation Map"
            subtitle="Predictive visual roadmap with salary valuation & 3-step action plan."
            badge="Predictive Skill Tree"
            status={statusOf("career_fit")}
            cta="Explore Constellation"
            to="/assessment/career-fit"
            preview={<ConstellationPreview />}
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            to="/assessment/resume"
            className="group flex items-center gap-3 rounded-lg border border-border bg-card px-5 py-4 transition-colors hover:border-primary/30 hover:bg-accent/10"
          >
            <FileText className="size-4 text-primary" />
            <div>
              <div className="text-sm font-medium text-foreground">AI Resume Grader</div>
              <div className="text-xs text-muted-foreground">Upload a resume for an instant scored breakdown.</div>
            </div>
          </Link>
          <Link
            to="/assessment/mock-interview"
            className="group flex items-center gap-3 rounded-lg border border-border bg-card px-5 py-4 transition-colors hover:border-primary/30 hover:bg-accent/10"
          >
            <Mic className="size-4 text-fuchsia-300" />
            <div>
              <div className="text-sm font-medium text-foreground">Mock Interview Studio</div>
              <div className="text-xs text-muted-foreground">Live voice + video interview simulation.</div>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
