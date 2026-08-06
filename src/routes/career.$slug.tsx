import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft, Bookmark, BookmarkCheck, Download, GitCompare, MessageSquare,
  Users, Globe, Laptop, Gauge, GraduationCap, Building2, Award, Briefcase,
  Sparkles, TrendingUp, CheckCircle2,
} from "lucide-react";
import { careerBySlug, careersByGroup, streamById, type Career } from "@/lib/career-hub";
import { saveCareer } from "@/lib/saved-careers.functions";
import { openChatGate } from "@/lib/chatGate";
import { CareerCard } from "@/components/career/CareerCard";

export const Route = createFileRoute("/career/$slug")({
  loader: ({ params }) => {
    const career = careerBySlug(params.slug);
    if (!career) throw notFound();
    return { career };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Career not found — CareerPilot AI" }, { name: "robots", content: "noindex" }] };
    }
    const c = loaderData.career;
    const title = `${c.title} — Career Path, Salary & Roadmap | CareerPilot AI`;
    const description = `${c.blurb} Salary ₹${c.salary.entry}–${c.salary.senior} LPA, +${c.growth}% growth, top colleges, exams and a year-by-year roadmap.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: CareerDetail,
});

const WISHLIST_KEY = "cp_career_wishlist";

function CareerDetail() {
  const { career } = Route.useLoaderData() as { career: Career };
  const save = useServerFn(saveCareer);
  const [saved, setSaved] = useState(false);
  const [salaryLevel, setSalaryLevel] = useState(1);
  const stream = streamById(career.stream);
  const related = careersByGroup(career.stream, career.group).filter((c) => c.slug !== career.slug).slice(0, 3);

  useEffect(() => {
    try {
      const list = JSON.parse(localStorage.getItem(WISHLIST_KEY) ?? "[]") as string[];
      setSaved(list.includes(career.slug));
    } catch { /* ignore */ }
  }, [career.slug]);

  const toggleSave = async () => {
    const next = !saved;
    setSaved(next);
    try {
      const list = new Set(JSON.parse(localStorage.getItem(WISHLIST_KEY) ?? "[]") as string[]);
      if (next) list.add(career.slug);
      else list.delete(career.slug);
      localStorage.setItem(WISHLIST_KEY, JSON.stringify([...list]));
    } catch { /* ignore */ }
    if (next) {
      try {
        await save({ data: { career_slug: career.slug, title: career.title, industry: career.group } });
      } catch { /* guest — wishlist stays local */ }
    }
  };

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) await navigator.share({ title: career.title, url });
      else await navigator.clipboard.writeText(url);
    } catch { /* cancelled */ }
  };

  const salaries = [
    { label: "Entry", value: career.salary.entry },
    { label: "Mid", value: career.salary.mid },
    { label: "Senior", value: career.salary.senior },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero banner */}
      <div className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 left-1/4 size-[560px] rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-52 right-0 size-[520px] rounded-full bg-accent/10 blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-6 pt-12 pb-12">
          <Link
            to="/stream/$id"
            params={{ id: career.stream }}
            className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="size-3.5" /> Back to {stream?.label} dashboard
          </Link>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-primary mb-3">
              <Sparkles className="size-3.5" /> {stream?.label} · {career.group}
            </div>
            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight">{career.title}</h1>
            <p className="mt-4 max-w-2xl text-muted-foreground leading-relaxed">{career.overview}</p>

            <div className="mt-7 grid gap-3 grid-cols-2 md:grid-cols-4">
              <Metric label="AI match" value={`${career.match}%`} />
              <Metric label="Future demand" value={`${career.demand}/100`} />
              <Metric label="Growth" value={`+${career.growth}% YoY`} />
              <Metric label="Difficulty" value={"★".repeat(career.difficulty) + "☆".repeat(5 - career.difficulty)} />
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <button onClick={toggleSave} className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold">
                {saved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
                {saved ? "Saved to wishlist" : "Save career"}
              </button>
              <Link to="/compare" className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:border-primary">
                <GitCompare className="size-4" /> Compare careers
              </Link>
              <button onClick={() => openChatGate()} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:border-primary">
                <MessageSquare className="size-4" /> Chat with AI mentor
              </button>
              <Link to="/mentors/book" className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:border-primary">
                <Users className="size-4" /> Book expert mentor
              </Link>
              <button onClick={() => typeof window !== "undefined" && window.print()} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:border-primary">
                <Download className="size-4" /> Download PDF
              </button>
              <button onClick={share} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:border-primary">
                Share
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-14 grid gap-10 lg:grid-cols-[1fr_320px]">
        <div className="space-y-10">
          <Block title="Daily work" icon={<Briefcase className="size-4" />}>
            <ul className="space-y-2">
              {career.dailyWork.map((d) => (
                <li key={d} className="flex gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" /> {d}
                </li>
              ))}
            </ul>
          </Block>

          <Block title="Required skills" icon={<Gauge className="size-4" />}>
            <div className="flex flex-wrap gap-2">
              {career.skills.map((s) => (
                <span key={s} className="rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs text-foreground">{s}</span>
              ))}
            </div>
            <div className="mt-4 text-xs uppercase tracking-widest text-muted-foreground mb-2">AI skills that multiply you</div>
            <div className="flex flex-wrap gap-2">
              {career.aiSkills.map((s) => (
                <span key={s} className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs text-primary">{s}</span>
              ))}
            </div>
          </Block>

          <Block title="Salary explorer" icon={<TrendingUp className="size-4" />}>
            <input
              type="range" min={0} max={2} step={1} value={salaryLevel}
              onChange={(e) => setSalaryLevel(Number(e.target.value))}
              className="w-full accent-primary"
              aria-label="Experience level"
            />
            <div className="mt-3 flex items-baseline justify-between">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">{salaries[salaryLevel].label} level</div>
                <div className="text-3xl font-semibold text-foreground">₹{salaries[salaryLevel].value} LPA</div>
              </div>
              <div className="text-xs text-muted-foreground">Placement rate {career.placement}%</div>
            </div>
          </Block>

          <Block title="Career roadmap" icon={<GraduationCap className="size-4" />}>
            <ol className="relative border-l border-border pl-6 space-y-6">
              {career.roadmap.map((r) => (
                <li key={r.phase}>
                  <span className="absolute -left-[7px] mt-1.5 size-3 rounded-full bg-primary" />
                  <div className="text-[11px] uppercase tracking-widest text-primary">{r.phase}</div>
                  <div className="text-sm font-semibold text-foreground">{r.title}</div>
                  <p className="text-sm text-muted-foreground">{r.detail}</p>
                </li>
              ))}
            </ol>
          </Block>

          <div className="grid gap-6 md:grid-cols-2">
            <Block title="Top colleges" icon={<Building2 className="size-4" />}>
              <ListLines items={career.colleges} />
            </Block>
            <Block title="Entrance exams" icon={<Award className="size-4" />}>
              <ListLines items={career.exams} />
            </Block>
            <Block title="Required subjects" icon={<GraduationCap className="size-4" />}>
              <ListLines items={career.subjects} />
            </Block>
            <Block title="Certifications" icon={<Award className="size-4" />}>
              <ListLines items={career.certifications} />
            </Block>
            <Block title="Top recruiters" icon={<Building2 className="size-4" />}>
              <ListLines items={career.companies} />
            </Block>
            <Block title="Job opportunities" icon={<Briefcase className="size-4" />}>
              <ListLines items={career.jobs} />
            </Block>
          </div>

          <Block title="Success story" icon={<Sparkles className="size-4" />}>
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground font-medium">{career.story.name}</span> — {career.story.line}
            </p>
            <p className="mt-3 text-sm text-muted-foreground"><span className="text-foreground font-medium">Portfolio tip:</span> {career.portfolioTip}</p>
          </Block>

          {related.length > 0 && (
            <Block title="Compare with similar careers" icon={<GitCompare className="size-4" />}>
              <div className="grid gap-4 sm:grid-cols-3">
                {related.map((c, i) => <CareerCard key={c.slug} career={c} index={i} />)}
              </div>
            </Block>
          )}
        </div>

        {/* sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-24 self-start">
          <div className="rounded-2xl border border-border bg-card/70 backdrop-blur-xl p-5">
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Future demand meter</div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${career.demand}%` }} transition={{ duration: 0.9 }}
                className="h-full bg-gradient-to-r from-cyan-400 to-fuchsia-500"
              />
            </div>
            <div className="mt-2 text-sm text-foreground">{career.demand}/100 · {career.demand > 75 ? "Extreme demand" : career.demand > 60 ? "High demand" : "Steady demand"}</div>
            <div className="mt-4 space-y-2 text-sm">
              <Row icon={<Laptop className="size-4" />} label="Remote work" value={career.flags.includes("remote") ? "Available" : "Mostly on-site"} />
              <Row icon={<Globe className="size-4" />} label="Global opportunities" value={career.flags.includes("abroad") ? "Strong" : "Domestic first"} />
              <Row icon={<Briefcase className="size-4" />} label="Freelancing" value={career.flags.includes("freelance") ? "Viable" : "Limited"} />
              <Row icon={<GraduationCap className="size-4" />} label="Study duration" value={career.duration} />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/70 backdrop-blur-xl p-5 space-y-2">
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Take action</div>
            <Link to="/internships" className="block rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold text-center">Apply for internship</Link>
            <Link to="/jobs" className="block rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground text-center hover:border-primary">Explore live jobs</Link>
            <Link to="/scholarships" className="block rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground text-center hover:border-primary">Find scholarships</Link>
            <Link to="/resume" className="block rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground text-center hover:border-primary">Build resume</Link>
            <Link to="/assessment/interview" className="block rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground text-center hover:border-primary">Interview prep</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-4">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold text-foreground">{value}</div>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="inline-flex items-center gap-2 text-muted-foreground">{icon} {label}</span>
      <span className="text-foreground font-medium text-right">{value}</span>
    </div>
  );
}

function ListLines({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((i) => (
        <li key={i} className="text-sm text-muted-foreground flex gap-2">
          <span className="text-primary">•</span> {i}
        </li>
      ))}
    </ul>
  );
}

function Block({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card/60 backdrop-blur-xl p-6">
      <h2 className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground mb-4">{icon} {title}</h2>
      {children}
    </section>
  );
}
