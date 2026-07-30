import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { PageHero } from "@/components/PageHero";
import { Check, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — CareerPilot AI Plans for Students & Professionals" },
      { name: "description", content: "Start free with core assessments, or upgrade for unlimited AI feedback, mock interviews and 1:1 mentor sessions. Simple monthly pricing, cancel anytime." },
      { property: "og:title", content: "Pricing — CareerPilot AI Plans" },
      { property: "og:description", content: "Free forever core plan, Pro for unlimited AI feedback, Mentor+ for 1:1 coaching." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Pricing,
});

const plans = [
  {
    name: "Explorer",
    price: "Free",
    note: "forever",
    highlight: false,
    features: [
      "Career-fit & personality assessments",
      "3 Zoiee questions per day",
      "Browse all roadmaps & domains",
      "Scholarship and internship search",
    ],
    cta: "Get started",
    to: "/assessment",
  },
  {
    name: "Pro",
    price: "₹499",
    note: "per month",
    highlight: true,
    features: [
      "Everything in Explorer",
      "Unlimited Zoiee AI counselling",
      "AI resume grading & rewrites",
      "Mock interview studio with STAR reports",
      "Full application tracker & analytics",
    ],
    cta: "Upgrade to Pro",
    to: "/contact",
  },
  {
    name: "Mentor+",
    price: "₹1,999",
    note: "per month",
    highlight: false,
    features: [
      "Everything in Pro",
      "Two 1:1 mentor sessions monthly",
      "Priority interview feedback review",
      "Personal roadmap check-ins",
      "Referral introductions where available",
    ],
    cta: "Talk to us",
    to: "/mentors",
  },
];

function Pricing() {
  return (
    <>
      <PageHero
        eyebrow="PRICING"
        title={<>Start free. <span className="text-gradient-brand">Upgrade when it pays off.</span></>}
        subtitle="No contracts, no hidden fees. Cancel from your settings at any time."
      />

      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-5 items-start">
          {plans.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className={`glass-strong rounded-2xl p-7 hover-lift relative ${p.highlight ? "ring-1 ring-primary/60" : ""}`}
            >
              {p.highlight && (
                <div className="absolute -top-3 left-7 text-[10px] font-mono tracking-widest px-2.5 py-1 rounded-full bg-primary text-primary-foreground">
                  MOST POPULAR
                </div>
              )}
              <h2 className="text-lg font-bold">{p.name}</h2>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-4xl font-extrabold tracking-tight">{p.price}</span>
                <span className="text-xs text-muted-foreground mb-1.5">{p.note}</span>
              </div>
              <ul className="mt-6 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className="size-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to={p.to}
                className={`mt-7 w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-opacity hover:opacity-90 ${
                  p.highlight
                    ? "bg-primary text-primary-foreground"
                    : "bg-foreground/10 border border-border text-foreground"
                }`}
              >
                {p.cta} <ArrowRight className="size-3" />
              </Link>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Student pricing available — <Link to="/contact" className="text-primary font-semibold">contact us</Link> with your institution email.
        </p>
      </section>
    </>
  );
}
