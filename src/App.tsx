import { useEffect, useMemo, useState } from "react";
import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero/Hero";
import { Manifest } from "./components/Manifest/Manifest";
import { RepositoryExplorer } from "./components/RepositoryExplorer/RepositoryExplorer";
import { ActivityTimeline } from "./components/ActivityTimeline/ActivityTimeline";
import { Ecosystem } from "./components/Ecosystem/Ecosystem";
import { Footer } from "./components/Footer/Footer";
import { CommandPalette } from "./components/CommandPalette/CommandPalette";
import { useRepositories } from "./hooks/useRepositories";
import { computeStats } from "./lib/stats";
import {
  destroySmoothScroll,
  initSmoothScroll,
  scrollToSection,
} from "./lib/smooth-scroll";
import type { RepoCategory } from "./types/repository";
import type { SectionId } from "./data/profile";
import { profile } from "./data/profile";

export default function App() {
  const { status, repos, notice, fetchedAt, retry } = useRepositories(
    profile.username,
  );
  const stats = useMemo(() => computeStats(repos), [repos]);

  const [filter, setFilter] = useState<RepoCategory | "all">("all");
  const [terminalOpen, setTerminalOpen] = useState(false);

  useEffect(() => {
    initSmoothScroll();
    return () => destroySmoothScroll();
  }, []);

  const navigateFromTerminal = (id: SectionId) => {
    setTerminalOpen(false);
    scrollToSection(id);
  };

  return (
    <>
      <a
        href="#repositories"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-sm focus:border focus:border-border-strong focus:bg-background focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:text-text"
      >
        skip to repository index
      </a>

      <Nav />

      <main>
        <Hero stats={stats} status={status} />
        <Manifest />
        <RepositoryExplorer
          repos={repos}
          status={status}
          notice={notice}
          fetchedAt={fetchedAt}
          filter={filter}
          onFilterChange={setFilter}
          onRetry={() => void retry()}
        />
        <ActivityTimeline repos={repos} />
        <Ecosystem />
      </main>

      <Footer status={status} onOpenTerminal={() => setTerminalOpen(true)} />

      <CommandPalette
        open={terminalOpen}
        onOpen={() => setTerminalOpen(true)}
        onClose={() => setTerminalOpen(false)}
        onNavigate={navigateFromTerminal}
        onFilter={setFilter}
      />
    </>
  );
}
