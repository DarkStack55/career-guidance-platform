import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft, Upload, Sparkles, Loader2, Plus, Trash2, Target, CheckCircle2, AlertTriangle,
  FileDown, Copy, Check,
} from "lucide-react";

import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { ScoreRing } from "@/components/ScoreRing";
import {
  parseResumeToDraft,
  generateGapPlan,
  emptyDraft,
  type ResumeDraft,
  type GapPlan,
} from "@/lib/resume-builder.functions";
import { exportGapPlanPdf } from "@/lib/gap-plan-share.functions";


export const Route = createFileRoute("/assessment/resume-builder")({
  head: () => ({
    meta: [
      { title: "Resume Builder & Skill-Gap Plan — CareerPilot AI" },
      {
        name: "description",
        content:
          "Upload or write your resume, edit every section, then get an AI skill-gap analysis and a month-by-month improvement plan for your target role.",
      },
      { property: "og:title", content: "Resume Builder & Skill-Gap Plan — CareerPilot AI" },
      {
        property: "og:description",
        content: "Edit your resume and get a tailored skill-gap analysis and improvement plan.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResumeBuilderPage,
});

const input =
  "w-full rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground px-3 py-2 text-sm outline-none focus:border-primary/60";

function ResumeBuilderPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const parseFn = useServerFn(parseResumeToDraft);
  const planFn = useServerFn(generateGapPlan);

  const [draft, setDraft] = useState<ResumeDraft>(emptyDraft);
  const [pasted, setPasted] = useState("");
  const [busy, setBusy] = useState<"idle" | "parsing" | "planning">("idle");
  const [targetRole, setTargetRole] = useState("");
  const [timeframeMonths, setTimeframe] = useState(12);
  const [plan, setPlan] = useState<GapPlan | null>(null);

  const set = <K extends keyof ResumeDraft>(k: K, v: ResumeDraft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const onDrop = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file || !user) return;
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      if (!["pdf", "docx", "txt"].includes(ext)) return toast.error("Upload a PDF, DOCX, or TXT file.");
      if (file.size > 8 * 1024 * 1024) return toast.error("File is too large. Max 8 MB.");

      setBusy("parsing");
      try {
        const path = `${user.id}/resumes/${crypto.randomUUID()}.${ext}`;
        const up = await supabase.storage.from("user-uploads").upload(path, file, {
          contentType: file.type || undefined,
        });
        if (up.error) throw new Error(up.error.message);
        const res = (await parseFn({ data: { filePath: path, fileName: file.name } })) as { draft: ResumeDraft };
        setDraft(res.draft);
        toast.success("Resume imported — review and edit below.");
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setBusy("idle");
      }
    },
    [parseFn, user],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    disabled: busy !== "idle" || !user,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
    },
  });

  const importPasted = async () => {
    if (pasted.trim().length < 60) return toast.error("Paste a bit more of your resume first.");
    setBusy("parsing");
    try {
      const res = (await parseFn({ data: { rawText: pasted } })) as { draft: ResumeDraft };
      setDraft(res.draft);
      toast.success("Resume parsed — review and edit below.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy("idle");
    }
  };

  const runPlan = async () => {
    if (targetRole.trim().length < 2) return toast.error("Tell us the role you're targeting.");
    setBusy("planning");
    setPlan(null);
    try {
      const res = (await planFn({ data: { draft, targetRole, timeframeMonths } })) as GapPlan;
      setPlan(res);
      toast.success("Your plan is ready.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy("idle");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-6 pt-14 pb-24 space-y-8">
        <Link to="/assessment" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> Back to Assessment
        </Link>

        <header className="rounded-lg border border-border bg-card/70 backdrop-blur-xl p-8 md:p-10">
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-primary mb-3">
            <Sparkles className="size-3.5" /> Resume Builder
          </div>
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight">Build it, edit it, close the gaps.</h1>
          <p className="mt-4 max-w-2xl text-muted-foreground leading-relaxed">
            Import an existing resume or write one from scratch. Then pick a target role and Zoiee maps exactly which
            skills you're missing and how to close each one, month by month.
          </p>
        </header>

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : !user ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground mb-4">Sign in to build and analyze your resume.</p>
            <button
              onClick={() => navigate({ to: "/login", search: { next: "/assessment/resume-builder" } as never })}
              className="rounded-lg bg-primary text-primary-foreground px-5 py-2 text-sm font-semibold"
            >
              Sign in to continue
            </button>
          </div>
        ) : (
          <>
            {/* Step 1 — import */}
            <section className="grid gap-4 md:grid-cols-2">
              <div
                {...getRootProps()}
                className={`rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
                  isDragActive ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-secondary"
                } ${busy !== "idle" ? "pointer-events-none opacity-70" : ""}`}
              >
                <input {...getInputProps()} />
                <div className="mx-auto size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                  {busy === "parsing" ? <Loader2 className="size-5 animate-spin" /> : <Upload className="size-5" />}
                </div>
                <div className="font-medium">{busy === "parsing" ? "Parsing your resume…" : "Upload a resume to auto-fill"}</div>
                <div className="mt-1 text-xs text-muted-foreground">PDF, DOCX or TXT · up to 8 MB</div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="text-sm font-medium mb-2">…or paste your resume text</div>
                <textarea
                  value={pasted}
                  onChange={(e) => setPasted(e.target.value)}
                  rows={5}
                  placeholder="Paste your resume here and we'll structure it for you."
                  className={input}
                />
                <button
                  onClick={importPasted}
                  disabled={busy !== "idle"}
                  className="mt-3 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary disabled:opacity-50"
                >
                  Parse pasted text
                </button>
              </div>
            </section>

            {/* Step 2 — edit */}
            <section className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-6">
              <h2 className="text-lg font-semibold">Your resume</h2>

              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Full name" value={draft.fullName} onChange={(v) => set("fullName", v)} />
                <Field label="Headline" value={draft.headline} onChange={(v) => set("headline", v)} />
                <Field label="Email" value={draft.email} onChange={(v) => set("email", v)} />
                <Field label="Phone" value={draft.phone} onChange={(v) => set("phone", v)} />
                <Field label="Location" value={draft.location} onChange={(v) => set("location", v)} />
              </div>

              <div>
                <Label>Professional summary</Label>
                <textarea rows={3} className={input} value={draft.summary} onChange={(e) => set("summary", e.target.value)} />
              </div>

              <div>
                <Label>Skills (comma separated)</Label>
                <input
                  className={input}
                  value={draft.skills.join(", ")}
                  onChange={(e) => set("skills", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                />
              </div>

              {/* Experience */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Experience</Label>
                  <AddBtn
                    onClick={() =>
                      set("experience", [...draft.experience, { title: "", company: "", period: "", bullets: [] }])
                    }
                  />
                </div>
                {draft.experience.map((exp, i) => (
                  <div key={i} className="rounded-xl border border-border p-4 space-y-2">
                    <div className="grid gap-2 md:grid-cols-3">
                      <input className={input} placeholder="Title" value={exp.title} onChange={(e) => updateAt(setDraft, "experience", i, { title: e.target.value })} />
                      <input className={input} placeholder="Company" value={exp.company} onChange={(e) => updateAt(setDraft, "experience", i, { company: e.target.value })} />
                      <input className={input} placeholder="2022 — Present" value={exp.period} onChange={(e) => updateAt(setDraft, "experience", i, { period: e.target.value })} />
                    </div>
                    <textarea
                      rows={3}
                      className={input}
                      placeholder="One achievement per line"
                      value={exp.bullets.join("\n")}
                      onChange={(e) => updateAt(setDraft, "experience", i, { bullets: e.target.value.split("\n") })}
                    />
                    <RemoveBtn onClick={() => removeAt(setDraft, "experience", i)} />
                  </div>
                ))}
              </div>

              {/* Education */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Education</Label>
                  <AddBtn onClick={() => set("education", [...draft.education, { degree: "", institution: "", period: "" }])} />
                </div>
                {draft.education.map((ed, i) => (
                  <div key={i} className="rounded-xl border border-border p-4 space-y-2">
                    <div className="grid gap-2 md:grid-cols-3">
                      <input className={input} placeholder="Degree" value={ed.degree} onChange={(e) => updateAt(setDraft, "education", i, { degree: e.target.value })} />
                      <input className={input} placeholder="Institution" value={ed.institution} onChange={(e) => updateAt(setDraft, "education", i, { institution: e.target.value })} />
                      <input className={input} placeholder="2019 — 2023" value={ed.period} onChange={(e) => updateAt(setDraft, "education", i, { period: e.target.value })} />
                    </div>
                    <RemoveBtn onClick={() => removeAt(setDraft, "education", i)} />
                  </div>
                ))}
              </div>

              {/* Projects */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Projects</Label>
                  <AddBtn onClick={() => set("projects", [...draft.projects, { name: "", description: "" }])} />
                </div>
                {draft.projects.map((p, i) => (
                  <div key={i} className="rounded-xl border border-border p-4 space-y-2">
                    <input className={input} placeholder="Project name" value={p.name} onChange={(e) => updateAt(setDraft, "projects", i, { name: e.target.value })} />
                    <textarea rows={2} className={input} placeholder="What it was and the outcome" value={p.description} onChange={(e) => updateAt(setDraft, "projects", i, { description: e.target.value })} />
                    <RemoveBtn onClick={() => removeAt(setDraft, "projects", i)} />
                  </div>
                ))}
              </div>

              <div>
                <Label>Certifications (comma separated)</Label>
                <input
                  className={input}
                  value={draft.certifications.join(", ")}
                  onChange={(e) => set("certifications", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                />
              </div>
            </section>

            {/* Version history */}
            <VersionHistory draft={draft} onRestore={(d) => setDraft(d)} />

            {/* Step 3 — target + plan */}
            <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
              <div className="flex items-center gap-2 mb-4">
                <Target className="size-4 text-primary" />
                <h2 className="text-lg font-semibold">Skill-gap analysis</h2>
              </div>
              <div className="grid gap-3 md:grid-cols-[1fr_180px_auto] items-end">
                <div>
                  <Label>Target role</Label>
                  <input className={input} placeholder="e.g. Staff Nurse, Financial Analyst, UX Designer" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} />
                </div>
                <div>
                  <Label>Timeframe</Label>
                  <select className={input} value={timeframeMonths} onChange={(e) => setTimeframe(Number(e.target.value))}>
                    {[3, 6, 12, 18, 24, 36].map((m) => (
                      <option key={m} value={m}>{m} months</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={runPlan}
                  disabled={busy !== "idle"}
                  className="rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60"
                >
                  {busy === "planning" ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                  Generate plan
                </button>
              </div>
            </section>

            {plan && <PlanView plan={plan} candidateName={draft.fullName} />}
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

type ListKeys = "experience" | "education" | "projects";
function updateAt<K extends ListKeys>(
  setDraft: React.Dispatch<React.SetStateAction<ResumeDraft>>,
  key: K,
  index: number,
  patch: Partial<ResumeDraft[K][number]>,
) {
  setDraft((d) => {
    const list = [...d[key]] as ResumeDraft[K];
    list[index] = { ...list[index], ...patch } as ResumeDraft[K][number];
    return { ...d, [key]: list };
  });
}
function removeAt(setDraft: React.Dispatch<React.SetStateAction<ResumeDraft>>, key: ListKeys, index: number) {
  setDraft((d) => ({ ...d, [key]: (d[key] as unknown[]).filter((_, i) => i !== index) as never }));
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">{children}</div>;
}
function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <input className={input} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
function AddBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1.5 text-xs rounded-lg border border-border px-3 py-1.5 hover:bg-secondary">
      <Plus className="size-3.5" /> Add
    </button>
  );
}
function RemoveBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive">
      <Trash2 className="size-3.5" /> Remove
    </button>
  );
}

const importanceStyle: Record<string, string> = {
  critical: "border-destructive/40 bg-destructive/10 text-destructive",
  important: "border-primary/40 bg-primary/10 text-primary",
  "nice-to-have": "border-border bg-secondary text-muted-foreground",
};

function PlanView({ plan, candidateName }: { plan: GapPlan; candidateName: string }) {
  return (
    <div className="space-y-6">
      <ExportBar plan={plan} candidateName={candidateName} />

      <div className="rounded-2xl border border-border bg-card p-6 md:p-8 flex flex-col md:flex-row items-center gap-8">
        <ScoreRing score={plan.readiness_score} label="Readiness" />
        <div className="flex-1">
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
            Target · {plan.target_role}
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">{plan.verdict}</p>
          {plan.matched_skills.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {plan.matched_skills.map((s) => (
                <span key={s} className="inline-flex items-center gap-1 text-xs rounded-full border border-border bg-secondary px-3 py-1">
                  <CheckCircle2 className="size-3 text-primary" /> {s}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {plan.gaps.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {plan.gaps.map((g) => (
            <div key={g.skill} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="font-medium">{g.skill}</div>
                <span className={`text-[10px] uppercase tracking-wider rounded-full border px-2 py-0.5 ${importanceStyle[g.importance] ?? importanceStyle["nice-to-have"]}`}>
                  {g.importance}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-2">{g.why}</p>
              <p className="text-xs text-foreground/80 leading-relaxed">
                <AlertTriangle className="inline size-3 mr-1 text-primary" />
                {g.how}
              </p>
            </div>
          ))}
        </div>
      )}

      {plan.phases.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
          <h3 className="text-lg font-semibold mb-5">Improvement plan</h3>
          <ol className="space-y-5 border-l border-border pl-6">
            {plan.phases.map((p) => (
              <li key={p.phase} className="relative">
                <span className="absolute -left-[31px] top-1.5 size-2.5 rounded-full bg-primary" />
                <div className="flex flex-wrap items-baseline gap-2">
                  <div className="font-medium">{p.phase}</div>
                  <div className="text-xs text-muted-foreground">{p.timeframe}</div>
                </div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {p.focus.map((f) => (
                    <span key={f} className="text-[11px] rounded-full bg-secondary px-2 py-0.5 text-muted-foreground">{f}</span>
                  ))}
                </div>
                <ul className="mt-2 space-y-1 text-sm text-foreground/80 list-disc list-inside">
                  {p.actions.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {plan.resume_rewrites.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-sm font-medium mb-3">Resume rewrites for this role</div>
            <ol className="space-y-2 list-decimal list-inside text-sm text-foreground/80">
              {plan.resume_rewrites.map((r, i) => <li key={i} className="leading-relaxed">{r}</li>)}
            </ol>
          </div>
        )}
        {plan.suggested_roles.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-sm font-medium mb-3">Adjacent roles worth considering</div>
            <div className="flex flex-wrap gap-2">
              {plan.suggested_roles.map((r) => (
                <span key={r} className="text-xs rounded-full border border-primary/30 bg-primary/10 text-primary px-3 py-1">{r}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ExportBar({ plan, candidateName }: { plan: GapPlan; candidateName: string }) {
  const exportFn = useServerFn(exportGapPlanPdf);
  const [working, setWorking] = useState(false);
  const [share, setShare] = useState<{ url: string; downloadUrl: string | null } | null>(null);
  const [copied, setCopied] = useState(false);

  const run = async () => {
    setWorking(true);
    try {
      const res = (await exportFn({ data: { plan, candidateName } })) as {
        sharePath: string;
        downloadUrl: string | null;
      };
      const url = `${window.location.origin}${res.sharePath}`;
      setShare({ url, downloadUrl: res.downloadUrl });
      if (res.downloadUrl) window.open(res.downloadUrl, "_blank", "noopener");
      toast.success("PDF ready — share link created.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setWorking(false);
    }
  };

  const copy = async () => {
    if (!share) return;
    try {
      await navigator.clipboard.writeText(share.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      toast.success("Share link copied.");
    } catch {
      toast.error("Couldn't copy — select and copy the link manually.");
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <div className="text-sm font-medium">Export & share this plan</div>
        <div className="text-xs text-muted-foreground mt-0.5">
          Download a formatted PDF and get a link anyone can open — no sign-in needed.
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {share && (
          <>
            <input
              readOnly
              value={share.url}
              onFocus={(e) => e.currentTarget.select()}
              className="w-full md:w-72 rounded-lg border border-border bg-background text-foreground px-3 py-2 text-xs"
            />
            <button
              onClick={copy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs hover:bg-secondary"
            >
              {copied ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
              {copied ? "Copied" : "Copy link"}
            </button>
            {share.downloadUrl && (
              <a
                href={share.downloadUrl}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs hover:bg-secondary"
              >
                <FileDown className="size-3.5" /> PDF
              </a>
            )}
          </>
        )}
        <button
          onClick={run}
          disabled={working}
          className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold disabled:opacity-60"
        >
          {working ? <Loader2 className="size-4 animate-spin" /> : <FileDown className="size-4" />}
          {working ? "Generating…" : share ? "Regenerate" : "Export PDF & share"}
        </button>
      </div>
    </div>
  );
}
