import { createFileRoute } from "@tanstack/react-router";
import { Check, Clock } from "lucide-react";
import { roadmap } from "@/lib/careers";

export const Route = createFileRoute("/roadmap/")({
  head: () => ({
    meta: [
      { title: "Career Roadmap — CareerPilot AI" },
      { name: "description", content: "A 12-month personalized flight plan: foundations, specialization, production systems, and landing the role." },
      { property: "og:title", content: "Career Roadmap" },
      { property: "og:description", content: "Your 12-month AI-generated career flight plan." },
    ],
  }),
  component: RoadmapPage,
});

function RoadmapPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <div className="font-mono text-xs text-primary tracking-widest mb-3">FLIGHT_PLAN · AI_ENGINEER</div>
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Your 12-month roadmap</h1>
      <p className="text-muted-foreground max-w-2xl mb-12">A milestone-based plan generated from your assessment. Phases adapt as you complete items and the market shifts.</p>

      <div className="relative">
        <div className="absolute left-5 top-2 bottom-2 w-px bg-border" />
        <div className="space-y-6">
          {roadmap.map((p, i) => (
            <div key={p.phase} className="relative pl-14">
              <div className={`absolute left-0 top-1 size-10 rounded-xl flex items-center justify-center font-mono font-bold text-xs ${p.status === "active" ? "bg-primary text-primary-foreground shadow-[var(--shadow-glow-primary)]" : "bg-card border border-border text-muted-foreground"}`}>
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className={`glass p-6 rounded-2xl ${p.status === "active" ? "border-primary/50" : ""}`}>
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="font-mono text-[10px] text-muted-foreground tracking-widest">{p.phase} · {p.duration}</div>
                    <h3 className="text-xl font-bold mt-1">{p.title}</h3>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-1 rounded ${p.status === "active" ? "bg-primary/15 text-primary" : "bg-white/5 text-muted-foreground"}`}>
                    {p.status === "active" ? "IN PROGRESS" : "UPCOMING"}
                  </span>
                </div>
                <ul className="space-y-2 mt-3">
                  {p.items.map((it, idx) => (
                    <li key={it} className="flex items-center gap-3 text-sm">
                      <span className={`size-5 rounded-full flex items-center justify-center text-[10px] ${p.status === "active" && idx === 0 ? "bg-success/20 text-success" : "bg-white/5 text-muted-foreground border border-border"}`}>
                        {p.status === "active" && idx === 0 ? <Check className="size-3" /> : <Clock className="size-3" />}
                      </span>
                      <span className={p.status === "active" ? "text-foreground" : "text-muted-foreground"}>{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
