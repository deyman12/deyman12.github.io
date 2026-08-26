import { IconSun, IconMoon } from "../ui/icons";

export function ThemeToggle({
  resolved,
  onToggle,
}: {
  resolved: "light" | "dark";
  onToggle: () => void;
}) {
  const isDark = resolved === "dark";
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="flex size-8 items-center justify-center rounded-sm border border-[var(--border)] text-[var(--text-muted)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
    >
      {isDark ? <IconSun size={15} /> : <IconMoon size={15} />}
    </button>
  );
}
