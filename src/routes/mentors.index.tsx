import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Calendar, Star, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/mentors/")({
  head: () => ({
    meta: [
      { title: "Mentor Booking — CareerPilot AI" },
      { name: "description", content: "Book 1:1 sessions with industry mentors across 44 career domains." },
    ],
  }),
  component: Mentors,
});

const mentors = [
  { name: "Dr. Aisha Khan", role: "Senior AI Researcher · DeepMind", price: "$120 / 30min", rating: 4.9, sessions: 412, tags: ["AI", "Research", "PhD"] },
  { name: "Marcus Lee", role: "Principal PM · Stripe", price: "$95 / 30min", rating: 4.8, sessions: 287, tags: ["Product", "FAANG"] },
  { name: "Priya Sharma", role: "Cardiothoracic Surgeon · AIIMS", price: "$80 / 30min", rating: 5.0, sessions: 198, tags: ["Medical", "Surgery"] },
  { name: "Diego Morales", role: "Lead Designer · Pixar", price: "$110 / 30min", rating: 4.9, sessions: 322, tags: ["Animation", "Design"] },
  { name: "Capt. Ravi Menon", role: "Commercial Pilot · Emirates", price: "$90 / 30min", rating: 4.8, sessions: 154, tags: ["Aviation"] },
  { name: "Lena Kowalski", role: "Founder · YC W22", price: "$150 / 30min", rating: 4.9, sessions: 241, tags: ["Startup", "Fundraising"] },
];

function Mentors() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <div className="font-mono text-xs text-primary tracking-widest mb-3">MENTOR_NETWORK</div>
      <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">Learn from people who did it.</h1>
      <p className="text-muted-foreground mt-3 text-lg max-w-2xl">Book 1:1 sessions with vetted operators across every domain. Real careers, real advice.</p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
        {mentors.map((m, i) => (
          <motion.div key={m.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} className="glass-strong rounded-2xl p-6 hover-lift">
            <div className="flex items-start gap-4 mb-4">
              <div className="size-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-lg font-bold text-primary-foreground flex-shrink-0">
                {m.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold">{m.name}</div>
                <div className="text-xs text-muted-foreground">{m.role}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs mb-4">
              <span className="flex items-center gap-1"><Star className="size-3 fill-primary text-primary" />{m.rating}</span>
              <span className="text-muted-foreground">{m.sessions} sessions</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {m.tags.map(t => <span key={t} className="text-[10px] font-mono px-2 py-0.5 bg-white/5 border border-border rounded">{t}</span>)}
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-border">
              <span className="text-sm font-bold text-primary">{m.price}</span>
              <button className="px-3 py-1.5 rounded-lg bg-foreground text-neutral-900 text-xs font-bold flex items-center gap-1.5 hover:bg-primary hover:text-primary-foreground transition-colors">
                <Calendar className="size-3" /> Book
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
