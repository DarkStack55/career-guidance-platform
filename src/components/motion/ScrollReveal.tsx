import { motion, useScroll, useTransform, useReducedMotion, type MotionValue } from "framer-motion";
import { ReactNode, useRef } from "react";

/**
 * Scroll-driven cinematic reveal: sections unblur and scale from 0.95 → 1
 * as they enter the viewport. Uses transform + filter only (GPU-friendly).
 */
export function ScrollReveal({
  children,
  className,
  as: Tag = "section",
  themeSurface,
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "div";
  themeSurface?: "dark";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 92%", "start 40%"],
  });

  const scale = useSafeTransform(scrollYProgress, [0, 1], [0.95, 1], reduce);
  const opacity = useSafeTransform(scrollYProgress, [0, 1], [0.35, 1], reduce);
  const blur = useSafeTransform(scrollYProgress, [0, 1], [10, 0], reduce);
  const filter = useTransform(blur, (b) => `blur(${b}px)`);

  const MotionTag = Tag === "section" ? motion.section : motion.div;

  return (
    <MotionTag
      ref={ref as never}
      className={className}
      data-theme-surface={themeSurface}
      style={reduce ? undefined : { scale, opacity, filter, willChange: "transform, filter, opacity" }}
    >
      {children}
    </MotionTag>
  );
}

function useSafeTransform(
  mv: MotionValue<number>,
  input: [number, number],
  output: [number, number],
  reduce: boolean | null,
) {
  const t = useTransform(mv, input, output, { clamp: true });
  return reduce ? (undefined as unknown as MotionValue<number>) : t;
}
