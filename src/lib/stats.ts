import type { Repository } from "../types/repository";

export interface LabStats {
  repositories: number;
  experiments: number;
  /** All forks, including modified ones. */
  forks: number;
  /** Forks whose upstream belongs to the main account. */
  backups: number;
  /** Explicitly archived or carrying the archive category. */
  archives: number;
  stars: number;
}

export function computeStats(repos: readonly Repository[]): LabStats {
  return {
    repositories: repos.length,
    experiments: repos.filter((r) => r.categories.includes("experiment"))
      .length,
    forks: repos.filter((r) => r.isFork).length,
    backups: repos.filter((r) => r.isMotebayaBackup).length,
    archives: repos.filter(
      (r) => r.isArchived || r.categories.includes("archive"),
    ).length,
    stars: repos.reduce((sum, r) => sum + r.stars, 0),
  };
}
