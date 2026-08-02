import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Upload, FileText, Sparkles, Trash2, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { ScoreRing } from "@/components/ScoreRing";
import {
  analyzeResume,
  listResumeAnalyses,
  deleteResumeAnalysis,
  type ResumeAnalysis,
} from "@/lib/ai-grader.functions";

export const Route = createFileRoute("/assessment/resume")({
  head: () => ({
    meta: [
      { title: "AI Resume Grader — CareerPilot AI" },
      { name: "description", content: "Upload your resume and get an instant recruiter-grade score, ATS analysis, and rewrite suggestions." },
      { property: "og:title", content: "AI Resume Grader — CareerPilot AI" },
      { property: "og:description", content: "Instant, recruiter-grade resume feedback powered by AI." },
    ],
  }),
  component: ResumeGraderPage,
});

type HistoryRow = {
  id: string;
  file_name: string;
  overall_score: number;
  ats_score: number;
  summary: string | null;
  created_at: string;
};

function ResumeGraderPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const analyzeFn = useServerFn(analyzeResume);
  const listFn = useServerFn(listResumeAnalyses);
  const deleteFn = useServerFn(deleteResumeAnalysis);

  const [busy, setBusy] = useState<"idle" | "uploading" | "analyzing">("idle");
  const [result, setResult] = useState<ResumeAnalysis | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);

  const refresh = useCallback(async () => {
    try {
      const rows = (await listFn()) as HistoryRow[];
      setHistory(rows);
    } catch {
      /* ignore — likely unauthenticated */
    }
  }, [listFn]);

  useEffect(() => {
    if (user) void refresh();
  }, [user, refresh]);

  const onDrop = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file || !user) return;
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      if (!["pdf", "docx", "txt"].includes(ext)) {
        toast.error("Please upload a PDF, DOCX, or TXT file.");
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        toast.error("File is too large. Max 8 MB.");
        return;
      }

      setResult(null);
      setBusy("uploading");
      const path = `${user.id}/resumes/${crypto.randomUUID()}.${ext}`;
      const up = await supabase.storage.from("user-uploads").upload(path, file, {
        contentType: file.type || undefined,
        upsert: false,
      });
      if (up.error) {
        setBusy("idle");
        toast.error(up.error.message || "Upload failed");
        return;
      }

      setBusy("analyzing");
      try {
        const analysis = (await analyzeFn({ data: { filePath: path, fileName: file.name } })) as ResumeAnalysis;
        setResult(analysis);
        toast.success("Analysis complete");
        void refresh();
      } catch (e) {
        toast.error((e as Error).message);
        // best-effort cleanup
        await supabase.storage.from("user-uploads").remove([path]);
      } finally {
        setBusy("idle");
      }
    },
    [analyzeFn, refresh, user],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
    },
    disabled: busy !== "idle" || !user,
  });

  const onDelete = async (id: string) => {
    try {
      await deleteFn({ data: { id } });
      setHistory((h) => h.filter((r) => r.id !== id));
      if (result?.id === id) setResult(null);
      toast.success("Deleted");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-[520px] h-[520px] rounded-full bg-fuchsia-500/10 blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 pt-14 pb-8">
          <Link to="/assessment" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="size-3.5" /> Back to Assessment
          </Link>
          <div className="rounded-lg border border-border bg-card/70 backdrop-blur-xl p-8 md:p-10 shadow-elevated">
            <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-primary mb-3">
              <Sparkles className="size-3.5" /> AI Resume Grader
            </div>
            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground">
              Score, tune, and land the interview.
            </h1>
            <p className="mt-4 max-w-2xl text-muted-foreground leading-relaxed">
              Drop your resume — Zoiee grades it like a senior recruiter: overall impression, ATS parseability,
              per-section breakdown, and concrete rewrite instructions.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-24 space-y-8">
        {loading ? (
          <div className="text-muted-foreground text-sm">Loading…</div>
        ) : !user ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground mb-4">Sign in to save analyses and view your history.</p>
            <button
              onClick={() => navigate({ to: "/login", search: { next: "/assessment/resume" } as never })}
              className="rounded-lg bg-primary text-primary-foreground px-5 py-2 text-sm font-semibold"
            >
              Sign in to continue
            </button>
          </div>
        ) : (
          <>
            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={`rounded-3xl border-2 border-dashed p-12 text-center transition-colors cursor-pointer ${
                isDragActive ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-secondary"
              } ${busy !== "idle" ? "pointer-events-none opacity-70" : ""}`}
            >
              <input {...getInputProps()} />
              <div className="mx-auto size-14 rounded-2xl bg-cyan-500/10 text-cyan-300 flex items-center justify-center mb-4">
                {busy === "idle" ? <Upload className="size-6" /> : <Loader2 className="size-6 animate-spin" />}
              </div>
              <div className="text-lg font-medium">
                {busy === "uploading"
                  ? "Uploading…"
                  : busy === "analyzing"
                  ? "Zoiee is reading your resume…"
                  : isDragActive
                  ? "Drop it here"
                  : "Drag & drop your resume, or click to browse"}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">PDF, DOCX, or TXT · up to 8 MB · stored privately</div>
            </div>

            {/* Result */}
            {result && <ResultCard result={result} />}

            {/* History */}
            {history.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <div className="text-sm font-medium text-white/80 mb-3">Your past analyses</div>
                <div className="divide-y divide-white/5">
                  {history.map((h) => (
                    <div key={h.id} className="flex items-center gap-3 py-3 text-sm">
                      <FileText className="size-4 text-white/50 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-white/90">{h.file_name}</div>
                        <div className="text-xs text-white/50">
                          {new Date(h.created_at).toLocaleString()} · Overall {h.overall_score} · ATS {h.ats_score}
                        </div>
                      </div>
                      <button
                        onClick={() => onDelete(h.id)}
                        className="text-white/40 hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ResultCard({ result }: { result: ResumeAnalysis }) {
  const sectionEntries = Object.entries(result.sections ?? {});
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-center gap-8 justify-around">
          <ScoreRing score={result.overall_score} label="Overall" />
          <ScoreRing score={result.ats_score} label="ATS" />
          <div className="flex-1 min-w-0 max-w-md">
            <div className="text-xs uppercase tracking-widest text-white/50 mb-2">Summary</div>
            <p className="text-white/80 leading-relaxed text-sm">{result.summary || "No summary provided."}</p>
            {result.suggested_roles?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {result.suggested_roles.map((r) => (
                  <span key={r} className="text-xs rounded-full border border-cyan-400/30 bg-cyan-400/10 text-cyan-200 px-3 py-1">
                    {r}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {sectionEntries.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sectionEntries.map(([name, data]) => (
            <div key={name} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-white capitalize">{name}</div>
                <div className="text-xs text-white/60">{data.score}/100</div>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-fuchsia-500"
                  style={{ width: `${Math.max(0, Math.min(100, data.score))}%` }}
                />
              </div>
              <p className="text-xs text-white/70 leading-relaxed">{data.feedback}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <FeedbackList title="Strengths" items={result.strengths} tone="ok" />
        <FeedbackList title="Weaknesses" items={result.weaknesses} tone="warn" />
      </div>

      {result.suggestions?.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="text-sm font-medium text-white mb-3">Rewrite suggestions</div>
          <ol className="space-y-2 list-decimal list-inside text-sm text-white/80">
            {result.suggestions.map((s, i) => (
              <li key={i} className="leading-relaxed">{s}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function FeedbackList({ title, items, tone }: { title: string; items: string[]; tone: "ok" | "warn" }) {
  const Icon = tone === "ok" ? CheckCircle2 : XCircle;
  const color = tone === "ok" ? "text-emerald-400" : "text-amber-400";
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div className="text-sm font-medium text-white mb-3">{title}</div>
      {items?.length ? (
        <ul className="space-y-2">
          {items.map((s, i) => (
            <li key={i} className="flex gap-2 text-sm text-white/80">
              <Icon className={`size-4 mt-0.5 shrink-0 ${color}`} />
              <span className="leading-relaxed">{s}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-white/50">None noted.</p>
      )}
    </div>
  );
}
