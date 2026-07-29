import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { PageHero } from "@/components/PageHero";
import scholarshipImg from "@/assets/scholarship.jpg";
import { Award, Globe, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/scholarships/")({
  head: () => ({
    meta: [
      { title: "Scholarships — CareerPilot AI" },
      { name: "description", content: "Find scholarships and funding across every domain — undergrad, grad, study abroad." },
    ],
  }),
  component: Scholarships,
});

const items = [
  { name: "Rhodes Scholarship", country: "UK · Oxford", amount: "$70k/yr", deadline: "Oct 2026", tag: "All fields" },
  { name: "Knight-Hennessy Scholars", country: "USA · Stanford", amount: "Full + stipend", deadline: "Oct 2026", tag: "Graduate" },
  { name: "Chevening Scholarship", country: "UK · Any uni", amount: "Full tuition", deadline: "Nov 2026", tag: "Masters" },
  { name: "Fulbright Program", country: "USA", amount: "Variable", deadline: "May 2026", tag: "All fields" },
  { name: "Erasmus Mundus", country: "EU", amount: "€1,400/mo", deadline: "Jan 2026", tag: "Masters" },
  { name: "Inlaks Scholarship", country: "India → Global", amount: "$100k", deadline: "Mar 2026", tag: "Postgrad" },
  { name: "DAAD Scholarship", country: "Germany", amount: "€934/mo", deadline: "Oct 2026", tag: "Research" },
  { name: "MEXT (Japan Govt)", country: "Japan", amount: "Full + ¥143k/mo", deadline: "May 2026", tag: "All levels" },
  { name: "Tata Trusts", country: "India", amount: "Need-based", deadline: "Rolling", tag: "Undergrad" },
];

function Scholarships() {
  return (
    <>
      <PageHero
        eyebrow="SCHOLARSHIPS"
        title={<>Your dream school <span className="text-gradient-brand">shouldn't cost you a future.</span></>}
        subtitle="Curated global scholarships, ranked by your profile and goals."
        image={scholarshipImg}
      />
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((s, i) => (
            <motion.div key={s.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % 6) * 0.05 }} className="glass-strong rounded-2xl p-6 hover-lift group">
              <div className="flex justify-between items-start mb-3">
                <Award className="size-6 text-primary" />
                <span className="text-[10px] font-mono px-2 py-0.5 bg-white/5 border border-border rounded">{s.tag}</span>
              </div>
              <h3 className="text-xl font-bold mb-1 group-hover:text-gradient-brand transition-all">{s.name}</h3>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4"><Globe className="size-3" /> {s.country}</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white/5 rounded-lg p-2.5 border border-border">
                  <div className="text-[9px] font-mono text-muted-foreground">AWARD</div>
                  <div className="font-bold text-primary">{s.amount}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-2.5 border border-border">
                  <div className="text-[9px] font-mono text-muted-foreground">DEADLINE</div>
                  <div className="font-bold">{s.deadline}</div>
                </div>
              </div>
              <button className="mt-5 w-full py-2.5 rounded-lg bg-foreground text-neutral-900 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-primary hover:text-primary-foreground transition-colors">
                Apply <ArrowRight className="size-3" />
              </button>
            </motion.div>
          ))}
        </div>
      </section>
    </>
  );
}
