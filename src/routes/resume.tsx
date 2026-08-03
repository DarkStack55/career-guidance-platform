import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Upload, FileText, CheckCircle2, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/resume")({
  head: () => ({
    meta: [
      { title: "Resume Upload — CareerPilot AI" },
      { name: "description", content: "Upload your resume and let our AI extract skills, identify gaps, and suggest the right roles." },
      { property: "og:title", content: "Resume Upload" },
      { property: "og:description", content: "AI-powered resume analysis in seconds." },
    ],
  }),
  component: ResumePage,
});

function ResumePage() {
  const [file, setFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [done, setDone] = useState(false);

  const onPick = (f: File | null) => {
    if (!f) return;
    setFile(f);
    setDone(false);
    setScanning(true);
    setTimeout(() => { setScanning(false); setDone(true); }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
      <div className="font-mono text-xs text-primary tracking-widest mb-3">RESUME_SCAN</div>
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Upload your resume</h1>
      <p className="text-muted-foreground mb-10 max-w-2xl">
        Drop a PDF or DOCX. We'll extract your skills, role history, and transferable strengths — then map them against current market demand.
      </p>

      <label className="block glass rounded-3xl p-12 border-dashed border-2 border-border hover:border-primary/50 transition-colors cursor-pointer text-center">
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={(e) => onPick(e.target.files?.[0] ?? null)}
        />
        <div className="size-16 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
          <Upload className="size-7" />
        </div>
        <div className="font-bold text-lg mb-2">{file ? file.name : "Drag and drop or click to upload"}</div>
        <div className="text-sm text-muted-foreground">PDF or DOCX · up to 10MB</div>
      </label>

      {scanning && (
        <div className="mt-8 glass rounded-2xl p-6 animate-fade">
          <div className="font-mono text-xs text-primary mb-3">SCANNING…</div>
          <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-accent animate-pulse w-2/3" />
          </div>
          <p className="text-sm text-muted-foreground mt-3">Extracting skills, roles, and impact statements.</p>
        </div>
      )}

      {done && (
        <div className="mt-8 grid md:grid-cols-3 gap-4 animate-entrance">
          <ResultCard label="SKILLS DETECTED" value="24" hint="6 in-demand" />
          <ResultCard label="TOP MATCH" value="AI Engineer" hint="96% fit" />
          <ResultCard label="GAPS FOUND" value="3" hint="See roadmap" />
          <div className="md:col-span-3 glass rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="size-5 text-success" />
              <div>
                <div className="font-bold">Analysis complete</div>
                <div className="text-sm text-muted-foreground">Continue to your personalized dashboard.</div>
              </div>
            </div>
            <Link to="/dashboard" className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold flex items-center gap-2 hover:shadow-[var(--shadow-glow-primary)] transition-all">
              Open Dashboard <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      )}

      <div className="mt-12 grid md:grid-cols-3 gap-4">
        {[
          { t: "Private by default", d: "Your file never leaves your browser session." },
          { t: "ATS-friendly tips", d: "We score how readable your resume is by recruiter tools." },
          { t: "Skill-to-role mapping", d: "Skills are tagged to live job descriptions." },
        ].map((b) => (
          <div key={b.t} className="p-5 rounded-2xl border border-border bg-white/5">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="size-4 text-primary" />
              <div className="font-semibold text-sm">{b.t}</div>
            </div>
            <p className="text-xs text-muted-foreground">{b.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="glass p-5 rounded-2xl">
      <div className="text-[10px] font-mono text-primary tracking-widest mb-2">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{hint}</div>
    </div>
  );
}
