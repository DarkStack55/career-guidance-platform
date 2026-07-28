import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export type CardStatus = "Unlocked" | "In Progress" | "Complete";

const statusStyle: Record<CardStatus, string> = {
  Unlocked: "border-white/15 bg-white/[0.06] text-white/60",
  "In Progress": "border-amber-400/30 bg-amber-400/10 text-amber-200",
  Complete: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200",
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
      className="group relative rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl transition-colors duration-300 hover:border-cyan-300/30 hover:bg-white/[0.06] hover:shadow-[0_30px_70px_-40px_rgba(34,211,238,0.6)]"
    >
      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-[radial-gradient(500px_circle_at_20%_0%,rgba(34,211,238,0.10),transparent_60%)]" />

      <div className="relative flex items-start justify-between gap-3">
        <span className="inline-flex items-center rounded-full border border-fuchsia-400/25 bg-fuchsia-400/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-fuchsia-200">
          {badge}
        </span>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium ${statusStyle[status]}`}>
          <span className="size-1.5 rounded-full bg-current" />
          {status}
        </span>
      </div>

      <div className="relative mt-4">{preview}</div>

      <h3 className="relative mt-4 text-lg font-semibold text-white">{title}</h3>
      <p className="relative mt-1.5 text-sm leading-relaxed text-white/60">{subtitle}</p>

      <Link
        to={to}
        className="relative mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.07] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-white hover:text-neutral-900"
      >
        {cta}
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </motion.div>
  );
}
