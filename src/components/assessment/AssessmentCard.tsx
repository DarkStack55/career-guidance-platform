import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export type CardStatus = "Unlocked" | "In Progress" | "Complete";

const statusStyle: Record<CardStatus, string> = {
  Unlocked: "border-border bg-secondary text-muted-foreground",
  "In Progress": "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-200",
  Complete: "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-200",
};

export function AssessmentCard({
  index,
  title,
  subtitle,
  badge,
  status,
  cta,
  to,
  preview,
}: {
  index: number;
  title: string;
  subtitle: string;
  badge: string;
  status: CardStatus;
  cta: string;
  to: string;
  preview: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
      whileHover={{ y: -6 }}
      className="group relative rounded-lg border border-border bg-card/70 p-5 backdrop-blur-xl transition-colors duration-300 hover:border-primary/30 hover:bg-accent/10 hover:shadow-elevated"
    >
      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-[radial-gradient(500px_circle_at_20%_0%,rgba(34,211,238,0.10),transparent_60%)]" />

      <div className="relative flex items-start justify-between gap-3">
        <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-primary">
          {badge}
        </span>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium ${statusStyle[status]}`}>
          <span className="size-1.5 rounded-full bg-current" />
          {status}
        </span>
      </div>

      <div className="relative mt-4">{preview}</div>

      <h3 className="relative mt-4 text-lg font-semibold text-foreground">{title}</h3>
      <p className="relative mt-1.5 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>

      <Link
        to={to as never}
        className="relative mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground transition-all hover:bg-primary hover:text-primary-foreground"
      >
        {cta}
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </motion.div>
  );
}
