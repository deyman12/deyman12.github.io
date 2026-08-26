import Lenis from "lenis";

const NAV_OFFSET = -72;

let lenis: Lenis | null = null;
let rafId = 0;
let locked = false;

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Start the smooth-scroll loop. No-op for users who prefer reduced motion. */
export function initSmoothScroll(): void {
  if (lenis || prefersReducedMotion()) return;
  lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 1 });
  const raf = (time: number) => {
    lenis?.raf(time);
    rafId = requestAnimationFrame(raf);
  };
  rafId = requestAnimationFrame(raf);
}

export function destroySmoothScroll(): void {
  cancelAnimationFrame(rafId);
  lenis?.destroy();
  lenis = null;
}

/** Freeze page scroll while an overlay (command palette) is open. */
export function setScrollLocked(active: boolean): void {
  if (locked === active) return;
  locked = active;
  if (active) lenis?.stop();
  else lenis?.start();
}

export function scrollToSection(id: string): void {
  const el = document.getElementById(id);
  if (!el) return;
  if (lenis) {
    lenis.scrollTo(el, { offset: NAV_OFFSET, duration: 1 });
  } else {
    const top = el.getBoundingClientRect().top + window.scrollY + NAV_OFFSET;
    window.scrollTo({
      top,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }
}
