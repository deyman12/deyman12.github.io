import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

/**
 * Scroll-into-view reveal. Deliberately small distances — motion here is
 * hierarchy, not decoration. Collapses to a simple fade under reduced motion.
 */
export function Reveal({
  children,
  delay = 0,
  y = 14,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y }}
      whileInView={{ opacity: 1, ...(reduce ? {} : { y: 0 }) }}
      viewport={{ once: true, margin: "0px 0px -80px 0px" }}
      transition={{ duration: 0.55, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  );
}
