import { useEffect, useState } from "react";
import { cn } from "../lib/utils";
import { scrollToSection } from "../lib/smooth-scroll";
import { useActiveSection } from "../hooks/useActiveSection";
import { useTheme } from "../hooks/useTheme";
import { profile, sectionIds } from "../data/profile";
import { IconGitHub } from "./ui/icons";
import { ThemeToggle } from "./ThemeToggle/ThemeToggle";

const labels: Record<string, string> = {
  manifest: "manifest",
  repositories: "repositories",
  activity: "activity",
  ecosystem: "ecosystem",
};

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const active = useActiveSection(sectionIds);
  const { resolved, toggle } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (id: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    scrollToSection(id);
  };

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-colors duration-300",
        scrolled
          ? "border-b border-border bg-background/75 backdrop-blur-md"
          : "border-b border-transparent",
      )}
    >
      <nav
        aria-label="Primary"
        className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-5 sm:px-8"
      >
        <a
          href="#hero"
          onClick={go("hero")}
          className="font-mono text-sm tracking-tight text-text transition-colors hover:text-accent"
        >
          deyman12<span className="text-accent">/</span>lab
        </a>

        <ul className="hidden items-center gap-7 md:flex">
          {sectionIds.map((id) => (
            <li key={id}>
              <a
                href={`#${id}`}
                onClick={go(id)}
                aria-current={active === id ? "true" : undefined}
                className={cn(
                  "font-mono text-[11px] tracking-[0.18em] uppercase transition-colors",
                  active === id
                    ? "text-accent"
                    : "text-text-muted hover:text-text",
                )}
              >
                {labels[id]}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <ThemeToggle resolved={resolved} onToggle={toggle} />
          <a
            href={profile.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 font-mono text-[11px] tracking-wider text-text-secondary uppercase transition-colors hover:text-text"
            aria-label={`${profile.username} on GitHub`}
          >
            <IconGitHub size={15} />
            <span className="hidden sm:inline">github ↗</span>
          </a>
        </div>
      </nav>
    </header>
  );
}
