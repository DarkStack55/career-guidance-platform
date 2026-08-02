import { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function AssessmentShell({
  eyebrow,
  title,
  description,
  nextPath,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  nextPath: string;
  children: ReactNode;
}) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-[520px] h-[520px] rounded-full bg-fuchsia-500/10 blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-6 pt-14 pb-8">
          <Link to="/assessment" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="size-3.5" /> Back to Assessment
          </Link>
          <div className="rounded-lg border border-border bg-card/70 backdrop-blur-xl p-8 md:p-10 shadow-elevated">
            <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-primary mb-3">
              <Sparkles className="size-3.5" /> {eyebrow}
            </div>
            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="mt-4 max-w-2xl text-muted-foreground leading-relaxed">{description}</p>
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-6 pb-24">
        {loading ? (
          <div className="text-muted-foreground text-sm">Loading…</div>
        ) : !user ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground mb-4">Sign in to take this assessment and save your score.</p>
            <button
              onClick={() => navigate({ to: "/login", search: { next: nextPath } as never })}
              className="rounded-lg bg-primary text-primary-foreground px-5 py-2 text-sm font-semibold"
            >
              Sign in to continue
            </button>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
