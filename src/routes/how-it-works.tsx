import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { PageHero } from "@/components/PageHero";
import { ClipboardCheck, Brain, Map, Rocket, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How CareerPilot AI Works — 4 Steps to Your Career Plan" },
      { name: "description", content: "Assess your strengths, get an AI career match, follow a personalised roadmap and land the role. Here is exactly how CareerPilot AI works." },
      { property: "og:title", content: "How CareerPilot AI Works — 4 Steps to Your Career Plan" },
      { property: "og:description", content: "Assess, match, plan, launch — the four steps CareerPilot AI uses to build your personalised career path." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HowItWorks,
});

const steps = [
  {
    icon: ClipboardCheck,
    step: "01",
    title: "Take the assessments",
    body: "Four short modules — personality, technical skills, aptitude and career fit — build a complete picture of how you work and where you are strong.",
    to: "/assessment",
    cta: "Start assessment",
  },
  {
    icon: Brain,
    step: "02",
    title: "Get your AI match",
    body: "Zoiee analyses your results against 40+ career domains and live market data, then ranks the roles where you have the highest chance of thriving.",
    to: "/compare",
    cta: "Compare domains",
  },
  {
    icon: Map,
    step: "03",
    title: "Follow your roadmap",
    body: "A week-by-week plan with courses, projects and milestones. Check tasks off as you go and the roadmap re-plans around what you actually finished.",
    to: "/roadmap",
    cta: "View roadmaps",
  },
  {
    icon: Rocket,
    step: "04",
    title: "Apply and land it",
    body: "Grade your resume, rehearse with the mock interview studio, then track every application from applied to offer in one board.",
    to: "/jobs",
    cta: "Browse jobs",
  },
];

function HowItWorks() {
  return (
    <>
      <PageHero
        eyebrow="HOW_IT_WORKS"
        title={<>From confused to <span className="text-gradient-brand">a clear plan</span> in four steps.</>}
        subtitle="No guesswork, no generic advice. Every step feeds the next one with your own data."
      />

      <section className="max-w-5xl mx-auto px-6 py-16 md:py-20">
        <div className="grid gap-5">
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="glass-strong rounded-2xl p-7 md:p-9 hover-lift"
            >
              <div className="flex flex-col md:flex-row md:items-start gap-5">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-xl bg-primary/15 border border-border flex items-center justify-center shrink-0">
                    <s.icon className="size-5 text-primary" />
                  </div>
                  <div className="font-mono text-xs text-muted-foreground md:hidden">STEP {s.step}</div>
                </div>
                <div className="flex-1">
                  <div className="font-mono text-xs text-muted-foreground mb-2 hidden md:block">STEP {s.step}</div>
                  <h2 className="text-2xl font-bold tracking-tight">{s.title}</h2>
                  <p className="text-muted-foreground mt-2 leading-relaxed">{s.body}</p>
                  <Link
                    to={s.to}
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2.5 transition-all"
                  >
                    {s.cta} <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="glass-strong rounded-2xl p-8 mt-10 text-center">
          <h2 className="text-2xl font-bold">Ready when you are.</h2>
          <p className="text-muted-foreground mt-2">The first assessment takes about eight minutes.</p>
          <Link
            to="/assessment"
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity"
          >
            Begin now <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
