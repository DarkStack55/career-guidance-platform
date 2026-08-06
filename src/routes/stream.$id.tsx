import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import {
  ArrowLeft, Search, Sparkles, GraduationCap, Compass, Rocket, Award,
  BookOpen, Building2, LineChart, Filter,
} from "lucide-react";
import {
  careersByStream, careersByGroup, streamById, filterOptions, scienceGroups,
  highSchoolSectors, futureSkills, topEntranceExams, scholarshipList, careerClusters,
  type CareerFlag, type StreamId,
} from "@/lib/career-hub";
import { CareerCard } from "@/components/career/CareerCard";

export const Route = createFileRoute("/stream/$id")({
  head: () => ({
    meta: [
      { title: "Stream Career Dashboard — CareerPilot AI" },
      { name: "description", content: "Explore every career your stream unlocks: salaries, colleges, entrance exams, roadmaps and AI match scores." },
      { property: "og:title", content: "Stream Career Dashboard — CareerPilot AI" },
      { property: "og:description", content: "Careers, colleges, exams and roadmaps mapped to your educational stream." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StreamDashboard,
});

const SORTS = [
  { id: "match", label: "AI match" },
  { id: "salary", label: "Salary" },
  { id: "demand", label: "Future demand" },
  { id: "difficulty", label: "Easiest first" },
] as const;

function StreamDashboard() {
  const { id } = Route.useParams();
  const stream = streamById(id);
  const streamId = (stream?.id ?? "high-school") as StreamId;

  const [group, setGroup] = useState<string>(streamId === "science" ? "PCM" : "");
  const [q, setQ] = useState("");
  const [flags, setFlags] = useState<CareerFlag[]>([]);
  const [sort, setSort] = useState<(typeof SORTS)[number]["id"]>("match");
  const [showFilters, setShowFilters] = useState(false);

  const list = useMemo(() => {
    let base = group ? careersByGroup(streamId, group) : careersByStream(streamId);
    if (q.trim()) {
      const s = q.toLowerCase();
      base = base.filter(
        (c) => c.title.toLowerCase().includes(s) || c.skills.join(" ").toLowerCase().includes(s) || c.group.toLowerCase().includes(s),
      );
    }
    if (flags.length) base = base.filter((c) => flags.every((f) => c.flags.includes(f)));
    const sorted = [...base];
    sorted.sort((a, b) => {
      if (sort === "salary") return b.salary.senior - a.salary.senior;
      if (sort === "demand") return b.demand - a.demand;
      if (sort === "difficulty") return a.difficulty - b.difficulty;
      return b.match - a.match;
    });
    return sorted;
  }, [streamId, group, q, flags, sort]);

  if (!stream) {
    return (
      <div className="min-h-screen bg-background text-foreground grid place-items-center px-6">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">That stream doesn't exist.</p>
          <Link to="/assessment/career-fit" className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold">
            Choose a stream
          </Link>
        </div>
      </div>
    );
  }

  const toggleFlag = (f: CareerFlag) =>
    setFlags((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -left-32 size-[520px] rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute -bottom-48 -right-32 size-[520px] rounded-full bg-fuchsia-500/10 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 pt-14 pb-8">
          <Link to="/assessment/career-fit" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="size-3.5" /> All streams
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border bg-card/70 backdrop-blur-xl p-8 md:p-10 shadow-elevated"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{stream.icon}</span>
              <span className="text-[11px] uppercase tracking-[0.18em] text-primary">{stream.tagline}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight">{stream.label} Career Dashboard</h1>
            <p className="mt-4 max-w-2xl text-muted-foreground leading-relaxed">{stream.description}</p>
            <div className="mt-6 flex flex-wrap gap-3 text-xs">
              <Stat icon={<Compass className="size-3.5" />} label={`${careersByStream(streamId).length} careers`} />
              <Stat icon={<Building2 className="size-3.5" />} label="Top colleges & recruiters" />
              <Stat icon={<Award className="size-3.5" />} label="Entrance exams & scholarships" />
              <Stat icon={<Sparkles className="size-3.5" />} label="AI recommendation scores" />
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-24 space-y-12">
        {/* science stream tabs */}
        {streamId === "science" && (
          <div className="flex flex-wrap gap-2">
            {scienceGroups.map((g) => (
              <button
                key={g}
                onClick={() => setGroup(g)}
                className={`rounded-xl px-5 py-2.5 text-sm font-semibold border transition-all ${
                  group === g
                    ? "border-primary bg-primary text-primary-foreground shadow-elevated"
                    : "border-border bg-card/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                {g}
              </button>
            ))}
            <button
              onClick={() => setGroup("")}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold border transition-all ${
                group === "" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              All science
            </button>
          </div>
        )}

        {/* high school sectors */}
        {streamId === "high-school" && (
          <Section title="Career Clusters" icon={<Compass className="size-4" />} sub="Six broad directions every Class 10 student can grow into.">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {careerClusters.map((c, i) => (
                <motion.div
                  key={c.name}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-2xl border border-border bg-card/70 backdrop-blur-xl p-5"
                >
                  <div className="text-sm font-semibold text-foreground">{c.name}</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {c.sectors.map((s) => (
                      <span key={s} className="rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground">{s}</span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </Section>
        )}

        {/* explorer */}
        <Section
          title={streamId === "high-school" ? "Career Exploration — all sectors" : "Career Options"}
          icon={<Search className="size-4" />}
          sub="Filter, sort and open any career for the full breakdown."
        >
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-xl p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-3 md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search careers or skills…"
                  className="w-full rounded-xl border border-border bg-background/60 pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as typeof sort)}
                  className="rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                >
                  {SORTS.map((s) => (
                    <option key={s.id} value={s.id}>Sort: {s.label}</option>
                  ))}
                </select>
                <button
                  onClick={() => setShowFilters((v) => !v)}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm text-foreground hover:border-primary"
                >
                  <Filter className="size-4" /> Filters{flags.length ? ` (${flags.length})` : ""}
                </button>
              </div>
            </div>
            {showFilters && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
                <div className="pt-4 flex flex-wrap gap-2">
                  {filterOptions.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => toggleFlag(f.id)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        flags.includes(f.id)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-muted/30 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {list.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
              No careers match those filters yet — try clearing one.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((c, i) => (
                <CareerCard key={c.slug} career={c} index={i} />
              ))}
            </div>
          )}
        </Section>

        {streamId === "high-school" && (
          <>
            <Section title="Sectors covered" icon={<Rocket className="size-4" />} sub="Every sector below has a full career page.">
              <div className="flex flex-wrap gap-2">
                {highSchoolSectors.map((s) => (
                  <button
                    key={s}
                    onClick={() => setQ(s)}
                    className="rounded-full border border-border bg-card/60 px-3.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </Section>

            <Section title="Future Skills" icon={<Sparkles className="size-4" />} sub="Skills that stay valuable no matter which sector you pick.">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {futureSkills.map((s) => (
                  <div key={s} className="rounded-xl border border-border bg-card/60 p-4 text-sm text-foreground">{s}</div>
                ))}
              </div>
            </Section>
          </>
        )}

        <Section title="Top Entrance Exams" icon={<BookOpen className="size-4" />} sub="The gateways worth planning your year around.">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {topEntranceExams.map((e) => (
              <div key={e.name} className="rounded-xl border border-border bg-card/60 p-4">
                <div className="text-sm font-semibold text-foreground">{e.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">{e.for} · {e.when}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Scholarships" icon={<Award className="size-4" />} sub="Funding you can apply for while you study.">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {scholarshipList.map((s) => (
              <div key={s.name} className="rounded-xl border border-border bg-card/60 p-4">
                <div className="text-sm font-semibold text-foreground">{s.name}</div>
                <div className="mt-1 text-xs text-primary">{s.amount}</div>
                <div className="mt-1 text-xs text-muted-foreground">{s.who}</div>
              </div>
            ))}
          </div>
          <Link to="/scholarships" className="mt-4 inline-flex text-xs font-medium text-primary hover:underline">
            Browse all scholarships →
          </Link>
        </Section>

        <Section title="AI Recommendation" icon={<LineChart className="size-4" />} sub="Your top matches in this stream, ranked by our engine.">
          <div className="grid gap-4 md:grid-cols-3">
            {list.slice(0, 3).map((c, i) => (
              <Link
                key={c.slug}
                to="/career/$slug"
                params={{ slug: c.slug }}
                className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-5 hover:border-primary/60 transition-colors"
              >
                <div className="text-[10px] uppercase tracking-widest text-primary mb-2">
                  {i === 0 ? "Best match" : i === 1 ? "Second best" : "Hidden talent"}
                </div>
                <div className="text-lg font-semibold text-foreground">{c.title}</div>
                <div className="mt-1 text-sm text-muted-foreground">{c.match}% AI match · +{c.growth}% growth</div>
              </Link>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/assessment" className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold">
              <GraduationCap className="size-4" /> Improve accuracy with assessments
            </Link>
            <Link to="/career-universe" className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground">
              Explore the AI Career Universe
            </Link>
          </div>
        </Section>
      </div>
    </div>
  );
}

function Stat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/30 px-3 py-1.5 text-muted-foreground">
      {icon} {label}
    </span>
  );
}

function Section({ title, sub, icon, children }: { title: string; sub?: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-5">
        <h2 className="inline-flex items-center gap-2 text-xl md:text-2xl font-semibold tracking-tight text-foreground">
          {icon} {title}
        </h2>
        {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
      </div>
      {children}
    </section>
  );
}
