import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const monthYear = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** "2026-07-14T…" → "Jul 2026" */
export function formatMonthYear(iso: string): string {
  return monthYear.format(new Date(iso));
}

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/**
 * Relative "last touched" label: fresh dates get relative treatment,
 * older ones collapse to "Mon YYYY" so the index doesn't rot into noise.
 */
export function formatUpdated(iso: string): string {
  const then = new Date(iso).getTime();
  const days = Math.round((then - Date.now()) / 86_400_000);
  if (days > -1) return "today";
  if (days > -30) return rtf.format(days, "day");
  return formatMonthYear(iso);
}

/** 1234 → "1.2k", keeps metadata rows compact */
export function formatCount(n: number): string {
  if (n < 1000) return String(n);
  const k = n / 1000;
  return `${k >= 100 ? Math.round(k) : k.toFixed(1)}k`;
}
