import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageHero } from "@/components/PageHero";
import { ChevronDown } from "lucide-react";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — CareerPilot AI Questions Answered" },
      { name: "description", content: "Answers about assessments, AI accuracy, pricing, data privacy, mentors and how CareerPilot AI builds your personalised career roadmap." },
      { property: "og:title", content: "FAQ — CareerPilot AI Questions Answered" },
      { property: "og:description", content: "Common questions about assessments, AI accuracy, privacy, pricing and mentors." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Faq,
});

const faqs = [
  { q: "How accurate is the AI career match?", a: "Your match is built from four assessment modules plus live market data across 40+ domains. It is a ranked shortlist to explore, not a verdict — most people re-run it after gaining new skills and see the ranking shift." },
  { q: "How long do the assessments take?", a: "Career-fit takes about 8 minutes, personality 10, aptitude 15 and the technical module 20. You can pause and resume any of them; progress is saved to your account." },
  { q: "Is CareerPilot AI free?", a: "The Explorer plan is free forever and includes the core assessments, roadmaps, scholarships and three Zoiee questions a day. Pro unlocks unlimited AI feedback, resume grading and the mock interview studio." },
  { q: "What happens to my resume and data?", a: "Your resume is stored privately against your account and used only to generate your grade and matches. You can delete it, export your assessment data, or delete your account entirely from settings." },
  { q: "Do I need experience to use the roadmaps?", a: "No. Every roadmap starts from foundations and branches by level, so a first-year student and a mid-career switcher get different entry points on the same track." },
  { q: "Are the mentors real people?", a: "Yes. Mentors are verified practitioners with at least three years in their domain. Most offer a free 15-minute intro call before you book a paid session." },
  { q: "Can I use it on my phone?", a: "Yes — everything including the mock interview studio runs in a mobile browser. For video interview practice a desktop camera usually gives steadier analytics." },
  { q: "How do I cancel a paid plan?", a: "From Dashboard → Settings. Cancellation takes effect at the end of the current billing period and you keep Pro access until then." },
];

function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <>
      <PageHero
        eyebrow="FAQ"
        title={<>Questions, <span className="text-gradient-brand">answered plainly.</span></>}
        subtitle="Everything people ask before they start with CareerPilot AI."
      />

      <section className="max-w-3xl mx-auto px-6 py-16">
        <div className="space-y-3">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <motion.div
                key={f.q}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 6) * 0.04 }}
                className="glass-strong rounded-2xl overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-4 text-left px-6 py-5"
                >
                  <span className="font-semibold text-foreground">{f.q}</span>
                  <ChevronDown className={`size-4 text-primary shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22 }}
                    >
                      <p className="px-6 pb-6 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        <div className="glass-strong rounded-2xl p-7 mt-8 text-center">
          <h2 className="text-xl font-bold">Still stuck?</h2>
          <p className="text-muted-foreground text-sm mt-2">Ask Zoiee inside the app, or send us a message.</p>
          <Link to="/contact" className="mt-5 inline-flex px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold">
            Contact support
          </Link>
        </div>
      </section>
    </>
  );
}
