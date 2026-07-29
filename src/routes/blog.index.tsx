import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { PageHero } from "@/components/PageHero";
import { Clock } from "lucide-react";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "Blog — CareerPilot AI" },
      { name: "description", content: "Career insights, AI trends, and real success playbooks." },
    ],
  }),
  component: Blog,
});

const posts = [
  { title: "The 12 careers AI is creating (not killing) in 2026", category: "Future of Work", read: "8 min", date: "May 12, 2026", gradient: "from-primary to-accent" },
  { title: "Why every commerce grad should learn one technical skill", category: "Skill Strategy", read: "5 min", date: "May 8, 2026", gradient: "from-accent to-primary" },
  { title: "Inside the salary jump: from intern to senior in 4 years", category: "Salary", read: "11 min", date: "May 3, 2026", gradient: "from-success to-primary" },
  { title: "Pilots, surgeons, and astronauts — what they share", category: "High-Stakes Careers", read: "7 min", date: "Apr 28, 2026", gradient: "from-primary to-success" },
  { title: "The honest guide to becoming a freelancer (no fluff)", category: "Freelance", read: "13 min", date: "Apr 21, 2026", gradient: "from-accent to-success" },
  { title: "Civil services vs corporate: a 10-year financial model", category: "Government", read: "9 min", date: "Apr 15, 2026", gradient: "from-primary to-accent" },
];

function Blog() {
  return (
    <>
      <PageHero
        eyebrow="THE_FLIGHT_DECK"
        title={<>Career intelligence, <span className="text-gradient-brand">decoded weekly.</span></>}
        subtitle="Real data, real stories, zero recycled LinkedIn advice."
      />
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {posts.map((p, i) => (
            <motion.article key={p.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % 6) * 0.05 }} className="glass-strong rounded-2xl overflow-hidden hover-lift group cursor-pointer">
              <div className={`aspect-[16/10] bg-gradient-to-br ${p.gradient} relative overflow-hidden`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.25),transparent_60%)]" />
                <div className="absolute bottom-3 left-4 text-[10px] font-mono uppercase tracking-widest text-white/90">{p.category}</div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold leading-snug group-hover:text-gradient-brand transition-all mb-3">{p.title}</h3>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{p.date}</span>
                  <span className="flex items-center gap-1"><Clock className="size-3" /> {p.read}</span>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        <div className="mt-16 glass-strong rounded-3xl p-10 text-center">
          <div className="font-mono text-xs text-primary tracking-widest mb-3">NEWSLETTER</div>
          <h3 className="text-3xl font-extrabold mb-3">One email. One career insight. Sundays.</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">Join 47,000 students and professionals.</p>
          <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto">
            <input placeholder="you@email.com" className="flex-1 min-w-[200px] glass-strong rounded-full px-5 py-3 text-sm outline-none" />
            <button className="px-5 py-3 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-bold">Subscribe</button>
          </div>
        </div>
      </section>
    </>
  );
}
