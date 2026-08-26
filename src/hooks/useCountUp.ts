import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Animates 0 → target with an ease-out curve. Renders the final value
 * immediately when the user prefers reduced motion.
 */
export function useCountUp(
  target: number,
  active: boolean,
  duration = 700,
): number {
  const [value, setValue] = useState(0);
  const frameRef = useRef(0);
  const reduce = useMemo(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  useEffect(() => {
    if (!active || reduce) return;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(eased * target));
      if (t < 1) frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, active, duration, reduce]);

  return active && reduce ? target : value;
}
