import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowUpRight, TrendingUp } from "lucide-react";
import type { Career } from "@/lib/career-hub";

export function CareerCard({ career, index = 0 }: { career: Career; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.03, 0.3) }}
      whileHover={{ y: -6 }}
      className="group relative"
    >
      <Link
        to="/career/$slug"
        params={{ slug: career.slug }}
        className="block h-full rounded-2xl border border-border bg-card/70 backdrop-blur-xl p-5 shadow-elevated transition-colors hover:border-primary/50"
      >
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-base font-semibold text-foreground leading-snug">{career.title}</h3>
            <span className="shrink-0 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              {career.match}% match
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{career.blurb}</p>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {career.skills.slice(0, 3).map((s) => (
              <span key={s} className="rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground">
                {s}
              </span>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="font-medium text-foreground">
              ₹{career.salary.entry}–{career.salary.senior} LPA
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-500">
              <TrendingUp className="size-3.5" /> +{career.growth}%
            </span>
          </div>

          <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500"
              style={{ width: `${career.demand}%` }}
            />
          </div>
          <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
            Open career page <ArrowUpRight className="size-3" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
