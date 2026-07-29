import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { PageHero } from "@/components/PageHero";
import internshipImg from "@/assets/internship.jpg";
import { MapPin, Clock, Building2 } from "lucide-react";

export const Route = createFileRoute("/internships/")({
  head: () => ({
    meta: [
      { title: "Internship Finder — CareerPilot AI" },
      { name: "description", content: "Discover internships across 44 domains, ranked by your skills and goals." },
    ],
  }),
  component: Internships,
});

const items = [
  { role: "AI Research Intern", company: "Anthropic", location: "Remote · Global", duration: "12 weeks", stipend: "$10k/mo", tags: ["AI", "Research"] },
  { role: "Product Design Intern", company: "Figma", location: "San Francisco", duration: "Summer", stipend: "$9k/mo", tags: ["Design"] },
  { role: "Surgical Observership", company: "AIIMS Delhi", location: "Delhi, IN", duration: "8 weeks", stipend: "Stipend", tags: ["Medical"] },
  { role: "Cabin Crew Trainee", company: "Emirates", location: "Dubai", duration: "16 weeks", stipend: "Full pay", tags: ["Aviation"] },
  { role: "Brand Strategy Intern", company: "Ogilvy", location: "Mumbai", duration: "12 weeks", stipend: "₹40k/mo", tags: ["Marketing"] },
  { role: "Investment Banking", company: "Goldman Sachs", location: "London", duration: "10 weeks", stipend: "£8k/mo", tags: ["Finance"] },
  { role: "Animation Intern", company: "Pixar", location: "Emeryville", duration: "Summer", stipend: "$7k/mo", tags: ["Animation"] },
  { role: "Climate Tech Fellow", company: "Stripe Climate", location: "Remote", duration: "6 months", stipend: "$6k/mo", tags: ["Climate"] },
  { role: "Sports Performance", company: "Nike Sport Lab", location: "Beaverton", duration: "12 weeks", stipend: "$5k/mo", tags: ["Sports"] },
];

function Internships() {
  return (
    <>
      <PageHero
        eyebrow="INTERNSHIPS"
        title={<>The first <span className="text-gradient-brand">door</span> opens here.</>}
        subtitle="Curated, paid, vetted. Filter by domain, location, and stipend."
        image={internshipImg}
      />
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="space-y-3">
          {items.map((it, i) => (
            <motion.div key={it.role + it.company} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: (i % 6) * 0.04 }} className="glass-strong rounded-2xl p-5 hover-lift flex flex-wrap items-center gap-5">
              <div className="size-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                <Building2 className="size-6 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-[200px]">
                <h3 className="font-bold text-lg">{it.role}</h3>
                <div className="text-sm text-muted-foreground">{it.company}</div>
              </div>
              <div className="flex items-center gap-1.5 text-xs"><MapPin className="size-3 text-primary" /> {it.location}</div>
              <div className="flex items-center gap-1.5 text-xs"><Clock className="size-3 text-primary" /> {it.duration}</div>
              <div className="text-sm font-bold text-success">{it.stipend}</div>
              <div className="flex gap-1.5">
                {it.tags.map(t => <span key={t} className="text-[10px] font-mono px-2 py-0.5 bg-white/5 border border-border rounded">{t}</span>)}
              </div>
              <button className="px-4 py-2 rounded-full bg-foreground text-neutral-900 text-xs font-bold hover:bg-primary hover:text-primary-foreground transition-colors">Apply</button>
            </motion.div>
          ))}
        </div>
      </section>
    </>
  );
}
