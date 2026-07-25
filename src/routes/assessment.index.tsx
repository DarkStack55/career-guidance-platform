import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";

export const Route = createFileRoute("/assessment/")({
  head: () => ({
    meta: [
      { title: "Career Assessment — CareerPilot AI" },
      { name: "description", content: "Take the 5-minute AI career assessment to unlock your personalized recommendations and roadmap." },
      { property: "og:title", content: "Career Assessment" },
      { property: "og:description", content: "Discover your top 5 career matches in 5 minutes." },
    ],
  }),
  component: AssessmentPage,
});

const steps = [
  { key: "qualification", label: "Qualification", options: ["High school", "Bachelor's", "Master's", "PhD", "Self-taught"] },
  { key: "stream", label: "Graduation stream", options: ["Computer Science", "Engineering", "Business", "Design", "Humanities", "Science", "Other"] },
  { key: "experience", label: "Experience level", options: ["Student / 0 yrs", "1–2 yrs", "3–5 yrs", "6–10 yrs", "10+ yrs"] },
  { key: "interests", label: "Top interests", options: ["AI & ML", "Web / Mobile", "Design", "Security", "Cloud", "Business", "Creative", "Healthcare"], multi: true },
  { key: "personality", label: "Personality type", options: ["Analytical", "Creative", "Leader", "Collaborator", "Independent"] },
  { key: "salary", label: "Preferred salary", options: ["$40k–$70k", "$70k–$120k", "$120k–$180k", "$180k+"] },
  { key: "location", label: "Location preference", options: ["Remote", "Hybrid", "On-site", "Anywhere"] },
  { key: "goal", label: "Primary goal", options: ["Land first job", "Switch careers", "Get promoted", "Start a business"] },
];

function AssessmentPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const total = steps.length;
  const current = steps[step];
  const value = answers[current.key];
  const canNext = current.multi ? Array.isArray(value) && value.length > 0 : !!value;

  const select = (opt: string) => {
    if (current.multi) {
      const arr = Array.isArray(value) ? value : [];
      setAnswers({ ...answers, [current.key]: arr.includes(opt) ? arr.filter((x) => x !== opt) : [...arr, opt] });
    } else {
      setAnswers({ ...answers, [current.key]: opt });
    }
  };

  const next = () => {
    if (step < total - 1) setStep(step + 1);
    else navigate({ to: "/dashboard" });
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-20">
      <div className="font-mono text-xs text-primary tracking-widest mb-3">ASSESSMENT · STEP {step + 1}/{total}</div>
      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mb-10">
        <div className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500" style={{ width: `${((step + 1) / total) * 100}%` }} />
      </div>

      <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">{current.label}</h1>
      <p className="text-muted-foreground mb-8">{current.multi ? "Select all that apply." : "Pick the option that fits best."}</p>

      <div className="grid sm:grid-cols-2 gap-3 mb-10">
        {current.options.map((opt) => {
          const selected = current.multi ? Array.isArray(value) && value.includes(opt) : value === opt;
          return (
            <button
              key={opt}
              onClick={() => select(opt)}
              className={`text-left p-4 rounded-xl border transition-all flex items-center justify-between ${
                selected ? "border-primary bg-primary/10 text-foreground" : "border-border bg-white/5 hover:bg-white/10"
              }`}
            >
              <span className="font-medium">{opt}</span>
              {selected && <Check className="size-4 text-primary" />}
            </button>
          );
        })}
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium disabled:opacity-30 flex items-center gap-2"
        >
          <ArrowLeft className="size-4" /> Back
        </button>
        <button
          onClick={next}
          disabled={!canNext}
          className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-40 flex items-center gap-2 hover:shadow-[var(--shadow-glow-primary)] transition-all"
        >
          {step === total - 1 ? "See results" : "Next"} <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
