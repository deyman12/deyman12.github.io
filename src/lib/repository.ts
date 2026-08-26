import type { RepoCategory, Repository } from "../types/repository";
import { profile } from "../data/profile";

/**
 * Topic → category signals. Deliberately conservative: a category is only
 * applied when the topic clearly implies it. Backup is structural (forked
 * from the main account), never topic-based.
 */
const TOPIC_SIGNALS: ReadonlyArray<readonly [RegExp, RepoCategory]> = [
  [/^(archive|archived|deprecated|abandoned)$/, "archive"],
  [
    /^(collection|awesome|resources?|lists?|curated|reading-list)$/,
    "collection",
  ],
  [
    /^(experiment|experiments|experimental|playground|sandbox|research|reverse-engineering|reversing|poc|prototype|proof-of-concept|study|studies|learning|writeups?|ctf)$/,
    "experiment",
  ],
  [/^(patch(es)?|modified|customized|fixed|port(ed)?)$/, "modified"],
];

/**
 * Derive categories for a repository.
 *
 * Classification priority:
 *   1. Backup — fork whose upstream owner is the main account.
 *   2. Modified — fork with evidence of divergence (timestamp).
 *   3. Fork — any other fork.
 *   4. Topic-driven categories (archive, collection, experiment).
 *   5. Default — experiment (a lab's resting state).
 */
export function deriveCategories(
  repo: Omit<Repository, "categories">,
): RepoCategory[] {
  const categories = new Set<RepoCategory>();

  if (repo.isArchived || repo.topics.some((t) => t === "archived")) {
    categories.add("archive");
  }

  for (const topic of repo.topics) {
    for (const [pattern, category] of TOPIC_SIGNALS) {
      if (pattern.test(topic)) categories.add(category);
    }
  }

  // Structural fork classification: backup > modified > plain fork.
  if (repo.isMotebayaBackup) {
    categories.add("backup");
    if (repo.modifiedFork) categories.add("modified");
  } else if (repo.modifiedFork) {
    categories.add("modified");
  } else if (repo.isFork) {
    categories.add("fork");
  }

  if (categories.size === 0) {
    categories.add(repo.isFork ? "fork" : "experiment");
  }

  // Stable display order.
  const order: RepoCategory[] = [
    "backup",
    "modified",
    "fork",
    "archive",
    "collection",
    "experiment",
  ];
  return [...categories].sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

/** A fork counts as modified only with evidence: pushed after its parent. */
export function markModifiedFork(repo: Repository): boolean {
  if (!repo.isFork || !repo.parent?.pushedAt) return false;
  const mine = new Date(repo.updatedAt).getTime();
  const parent = new Date(repo.parent.pushedAt).getTime();
  return mine > parent + 60_000; // tolerate 1min of clock skew
}

/** Backup = fork whose upstream belongs to the main account. */
export function markBackup(repo: Repository): boolean {
  return (
    repo.isFork && repo.parent?.ownerLogin === profile.mainAccount.username
  );
}

/** Small curated map — GitHub's own linguist palette, subset we care about. */
export const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  PHP: "#4F5D95",
  Go: "#00ADD8",
  Rust: "#dea584",
  C: "#555555",
  "C++": "#f34b7d",
  "C#": "#178600",
  Java: "#b07219",
  Kotlin: "#A97BFF",
  Ruby: "#701516",
  Shell: "#89e051",
  Lua: "#000080",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Vue: "#41b883",
  Svelte: "#ff3e00",
  Assembly: "#6E4C13",
  Zig: "#ec915c",
  Haskell: "#5e5086",
  OCaml: "#3be133",
  Nix: "#7e7eff",
  Dockerfile: "#384d54",
  "Jupyter Notebook": "#DA5B0B",
};
