import { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { subpageContent, type SubCard } from "@/lib/subpage-content";
import { ArrowLeft, Sparkles } from "lucide-react";

export function SubPageShell({
  eyebrow,
  title,
  description,
  parentLabel,
  parentTo,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  parentLabel: string;
  parentTo: string;
  children?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-[520px] h-[520px] rounded-full bg-fuchsia-500/10 blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 pt-14 pb-10">
          <Link
            to={parentTo}
            className="inline-flex items-center gap-2 text-xs text-white/60 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="size-3.5" /> Back to {parentLabel}
          </Link>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-[0_8px_40px_-12px_rgba(0,0,0,0.6)] p-8 md:p-10">
            <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-cyan-300/90 mb-3">
              <Sparkles className="size-3.5" /> {eyebrow}
            </div>
            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
              {title}
            </h1>
            <p className="mt-4 max-w-2xl text-white/70 leading-relaxed">{description}</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-24">
        {children ?? <SubGrid />}
      </div>
    </div>
  );
}

const FALLBACK: SubCard[] = [
  { title: "Curated content", body: "We're assembling premium modules for this section." },
  { title: "Personalized to you", body: "Recommendations will adapt to your profile and goals." },
  { title: "Powered by Zoiee", body: "Ask our AI concierge for guidance while we build this out." },
];

function SubGrid() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const key = pathname.replace(/\/+$/, "") || "/";
  const items = subpageContent[key] ?? FALLBACK;

  return (
    <div className="mt-8 grid gap-4 md:grid-cols-3">
      {items.map((i) => {
        const inner = (
          <>
            <div className="text-sm font-medium text-white">{i.title}</div>
            <p className="mt-2 text-sm text-white/60 leading-relaxed">{i.body}</p>
            {i.to && <div className="mt-4 text-xs text-cyan-300">Open →</div>}
          </>
        );
        const cls =
          "block rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 hover:bg-white/[0.06] transition-colors";
        return i.to ? (
          <Link key={i.title} to={i.to} className={cls}>
            {inner}
          </Link>
        ) : (
          <div key={i.title} className={cls}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}
