import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SubPageShell } from "@/components/SubPageShell";
import { CheckCircle2, Circle, Sparkles, Video, ClipboardList, Copy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/internships/prep")({
  head: () => ({
    meta: [
      { title: "Interview Prep — Question Bank & STAR Builder | CareerPilot AI" },
      {
        name: "description",
        content:
          "Track-specific interview question banks, a STAR answer builder, and a prep checklist that saves your progress.",
      },
      { property: "og:title", content: "Interview Prep — Question Bank & STAR Builder" },
      { property: "og:description", content: "Case studies, coding rounds, and behavioral prep for internship offers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const TRACKS = {
  Technical: [
    "Walk me through a project you built end to end.",
    "How would you debug a page that loads slowly for one user only?",
    "Explain a data structure you picked and why it fit.",
    "Describe a bug that took you far too long to find.",
    "How do you decide when code is 'done'?",
  ],
  Case: [
    "A campus café is losing money. How would you diagnose it?",
    "Estimate the number of delivery riders needed in your city.",
    "Our signups grew 40% but revenue is flat. What happened?",
    "How would you price a student subscription?",
  ],
  Behavioral: [
    "Tell me about a time you disagreed with a teammate.",
    "Describe a deadline you missed and what you changed after.",
    "When did you take ownership of something outside your role?",
    "Tell me about feedback that was hard to hear.",
    "Give an example of leading without authority.",
  ],
  "HR & Closing": [
    "Why this internship, and why now?",
    "Where do you want to be in two years?",
    "What questions do you have for us?",
    "What are your salary/stipend expectations?",
  ],
} as const;

const CHECKLIST = [
  "Researched the company's product and last 3 announcements",
  "Prepared 5 STAR stories I can reuse",
  "Practiced out loud with the camera on",
  "Timed my answers to under 2 minutes",
  "Prepared 3 questions to ask the interviewer",
  "Tested my mic, camera, and internet connection",
];

const STORAGE_KEY = "cp_interview_prep_checklist";

function Page() {
  const trackNames = Object.keys(TRACKS) as Array<keyof typeof TRACKS>;
  const [track, setTrack] = useState<keyof typeof TRACKS>("Behavioral");
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [star, setStar] = useState({ situation: "", task: "", action: "", result: "" });

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setDone(JSON.parse(raw) as Record<string, boolean>);
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = (item: string) => {
    setDone((prev) => {
      const next = { ...prev, [item]: !prev[item] };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const progress = useMemo(
    () => Math.round((CHECKLIST.filter((c) => done[c]).length / CHECKLIST.length) * 100),
    [done],
  );

  const starText = useMemo(
    () =>
      [
        star.situation && `Situation: ${star.situation}`,
        star.task && `Task: ${star.task}`,
        star.action && `Action: ${star.action}`,
        star.result && `Result: ${star.result}`,
      ]
        .filter(Boolean)
        .join("\n"),
    [star],
  );

  return (
    <SubPageShell
      eyebrow="Internships"
      title="Interview Prep"
      description="Track-specific question banks, a STAR answer builder, and a prep checklist that remembers where you left off."
      parentLabel="Internships"
      parentTo="/internships"
    >
      <div className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        {/* Question bank */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList className="size-4 text-cyan-300" />
            <span className="text-sm font-medium text-white">Question bank</span>
          </div>
          <div className="flex flex-wrap gap-2 mb-5">
            {trackNames.map((t) => (
              <button
                key={t}
                onClick={() => setTrack(t)}
                className={`rounded-full px-3 py-1.5 text-xs border transition-colors ${
                  track === t
                    ? "bg-cyan-400/15 border-cyan-400/50 text-cyan-200"
                    : "bg-white/5 border-white/10 text-white/70 hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <ul className="space-y-2">
            {TRACKS[track].map((q) => (
              <li key={q} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm text-white/80 flex items-start justify-between gap-3">
                <span>{q}</span>
                <button
                  onClick={() => {
                    void navigator.clipboard?.writeText(q);
                    toast.success("Question copied");
                  }}
                  className="text-white/40 hover:text-white shrink-0"
                  aria-label="Copy question"
                >
                  <Copy className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
          <Link
            to="/assessment/interview"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-neutral-900 px-4 py-2 text-sm font-semibold"
          >
            <Video className="size-4" /> Practice live in the Mock Interview Studio
          </Link>
        </div>

        <div className="space-y-4">
          {/* Checklist */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-white">Prep checklist</span>
              <span className="text-xs text-white/60">{progress}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mb-4">
              <div className="h-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <ul className="space-y-2">
              {CHECKLIST.map((c) => (
                <li key={c}>
                  <button
                    onClick={() => toggle(c)}
                    className="w-full text-left flex items-start gap-2 text-sm text-white/75 hover:text-white"
                  >
                    {done[c] ? (
                      <CheckCircle2 className="size-4 text-cyan-300 shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="size-4 text-white/30 shrink-0 mt-0.5" />
                    )}
                    <span className={done[c] ? "line-through text-white/40" : ""}>{c}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* STAR builder */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="size-4 text-fuchsia-300" />
              <span className="text-sm font-medium text-white">STAR answer builder</span>
            </div>
            {(["situation", "task", "action", "result"] as const).map((k) => (
              <div key={k} className="mb-3">
                <label className="block text-[10px] uppercase tracking-widest text-white/45 mb-1">{k}</label>
                <textarea
                  rows={2}
                  value={star[k]}
                  onChange={(e) => setStar((s) => ({ ...s, [k]: e.target.value }))}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/35 outline-none focus:border-cyan-400/60 resize-y"
                  placeholder={`Describe the ${k}…`}
                />
              </div>
            ))}
            <button
              disabled={!starText}
              onClick={() => {
                void navigator.clipboard?.writeText(starText);
                toast.success("STAR answer copied");
              }}
              className="rounded-lg border border-white/15 text-white px-4 py-2 text-sm disabled:opacity-40"
            >
              Copy full answer
            </button>
          </div>
        </div>
      </div>
    </SubPageShell>
  );
}
