import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { PageHero } from "@/components/PageHero";
import {
  Bot, FileText, Video, Radar, Map, Briefcase, GraduationCap, ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — CareerPilot AI Career Guidance Platform" },
      { name: "description", content: "AI resume grading, mock interview studio, cognitive assessments, personalised roadmaps, job tracking and scholarship search — everything inside CareerPilot AI." },
      { property: "og:title", content: "Features — CareerPilot AI Career Guidance Platform" },
      { property: "og:description", content: "Everything CareerPilot AI gives you: AI grading, interview practice, roadmaps, job tracking and more." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Features,
});

const features = [
  { icon: Bot, title: "Zoiee AI counsellor", body: "Ask anything about careers, salaries or skills and get answers grounded in your own profile.", to: "/assessment" },
  { icon: FileText, title: "AI resume grader", body: "Upload a resume and get a scored breakdown of impact, keywords, structure and role fit.", to: "/assessment/resume" },
  { icon: Video, title: "Mock interview studio", body: "A real-time voice and video interviewer with STAR scoring, pacing and eye-contact analytics.", to: "/assessment/mock-interview" },
  { icon: Radar, title: "Cognitive assessments", body: "Personality, aptitude, technical and career-fit modules that build your readiness score.", to: "/assessment" },
  { icon: Map, title: "Personalised roadmaps", body: "Week-by-week plans across tech, business, creative and AI tracks with milestone tracking.", to: "/roadmap" },
  { icon: Briefcase, title: "Job & application tracker", body: "Save roles, apply, and follow every application through to offer in one live board.", to: "/jobs" },
  { icon: GraduationCap, title: "Scholarships & internships", body: "A searchable database of funding and internship programmes with deadline reminders.", to: "/scholarships" },
];

function Features() {
  return (
    <>
      <PageHero
        eyebrow="FEATURES"
        title={<>Every tool you need, <span className="text-gradient-brand">in one cockpit.</span></>}
        subtitle="Assessments, AI feedback, roadmaps and job tracking that all talk to each other."
      />

      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 6) * 0.05 }}
            >
              <Link to={f.to} className="glass-strong rounded-2xl p-6 hover-lift group block h-full">
                <div className="size-11 rounded-xl bg-primary/15 border border-border flex items-center justify-center mb-4">
                  <f.icon className="size-5 text-primary" />
                </div>
                <h2 className="text-lg font-bold group-hover:text-gradient-brand transition-all">{f.title}</h2>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{f.body}</p>
                <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                  Open <ArrowRight className="size-3" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </>
  );
}
