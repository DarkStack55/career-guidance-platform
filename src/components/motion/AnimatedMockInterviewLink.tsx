import { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ExternalLink, Sparkles } from "lucide-react";

const URL = "https://ai-mock-interview-si-dyh6.bolt.host/";

export function AnimatedMockInterviewLink() {
  const prefersReducedMotion = useReducedMotion();
  const reduced = prefersReducedMotion ?? false;

  return (
    <motion.a
      href={URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Try the AI Mock Interview on an external site (opens in a new tab)"
      className="group relative block overflow-hidden rounded-2xl border border-primary/30 bg-primary/5 p-5 backdrop-blur-sm transition-colors duration-300 hover:border-primary/60 hover:bg-primary/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={reduced ? {} : { scale: 1.015 }}
      whileTap={reduced ? {} : { scale: 0.985 }}
      data-testid="animated-mock-interview-link"
    >
      {/* subtle animated glow */}
      {!reduced && (
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-1 rounded-2xl opacity-60 blur-md"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, var(--primary), transparent 60%)",
          }}
        >
          <motion.span
            className="absolute inset-0 rounded-2xl"
            animate={{
              opacity: [0.35, 0.7, 0.35],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </span>
      )}

      {/* animated border shimmer */}
      {!reduced && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background:
              "linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.35) 45%, rgba(255,255,255,0.35) 55%, transparent 75%)",
            backgroundSize: "200% 100%",
            WebkitMask:
              "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            padding: "1px",
          }}
        >
          <motion.span
            className="absolute inset-0 block"
            animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              background:
                "linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.5) 45%, rgba(255,255,255,0.5) 55%, transparent 75%)",
              backgroundSize: "200% 100%",
            }}
          />
        </span>
      )}

      <span className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <span className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Sparkles className="size-4" />
          </span>
          <span className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">
              Try the AI Mock Interview
            </span>
            <span className="mt-0.5 text-xs text-muted-foreground">
              Launch the interactive external interview simulator and practice with a live AI interviewer.
            </span>
          </span>
        </span>

        <span className="inline-flex items-center justify-center gap-2 self-start sm:self-auto rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-300 group-hover:shadow-[0_0_24px_rgba(139,92,246,0.35)] group-hover:brightness-110">
          <span>Start interview</span>
          <ExternalLink className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </span>

      {/* floating dot accents */}
      {!reduced && (
        <>
          <motion.span
            aria-hidden
            className="pointer-events-none absolute right-8 top-2 size-1.5 rounded-full bg-primary/60"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.span
            aria-hidden
            className="pointer-events-none absolute right-20 bottom-2 size-1 rounded-full bg-accent/70"
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
          />
        </>
      )}
    </motion.a>
  );
}
