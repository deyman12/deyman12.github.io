import { scrollToSection } from "../../lib/smooth-scroll";
import type { DataStatus } from "../../hooks/useRepositories";
import { profile, sectionIds } from "../../data/profile";
import { IconGitHub } from "../ui/icons";
import { cn } from "../../lib/utils";

const labels: Record<string, string> = {
  manifest: "manifest",
  repositories: "repositories",
  activity: "activity",
  ecosystem: "ecosystem",
};

export function Footer({
  status,
  onOpenTerminal,
}: {
  status: DataStatus;
  onOpenTerminal: () => void;
}) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-8 border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-10 sm:px-8 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-mono text-sm text-text">
            deyman12<span className="text-accent">/</span>lab
          </p>
          <p className="mt-2 flex items-center gap-2 font-mono text-[11px] text-text-muted">
            <i
              aria-hidden
              className={cn(
                "size-1.5 rounded-full",
                status === "fallback" ? "bg-warn" : "bg-ok animate-pulse",
              )}
            />
            {status === "fallback"
              ? "status: cached snapshot"
              : "status: operational. probably."}
          </p>
        </div>

        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {sectionIds.map((id) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection(id);
                  }}
                  className="font-mono text-[11px] tracking-[0.16em] text-text-muted uppercase transition-colors hover:text-text"
                >
                  {labels[id]}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-3 text-right font-mono text-[11px] text-text-muted">
          <p>
            data:{" "}
            <a
              href={profile.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 transition-colors hover:text-text"
            >
              public github api <IconGitHub size={11} />
            </a>
          </p>
          <button
            type="button"
            onClick={onOpenTerminal}
            className="transition-colors hover:text-accent"
          >
            press{" "}
            <kbd className="rounded-sm border border-border px-1 py-0.5">⌃</kbd>{" "}
            <kbd className="rounded-sm border border-border px-1 py-0.5">/</kbd>{" "}
            for commands
          </button>
          <p>© {year} · built light, deployed static.</p>
        </div>
      </div>
    </footer>
  );
}
