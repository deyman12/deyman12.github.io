import { useCallback, useEffect, useRef, useState } from "react";
import {
  readCache,
  writeCache,
  isCacheFresh,
  loadStaticSnapshot,
} from "../lib/github-cache";
import { fetchRepositories, fetchUser, GitHubError } from "../lib/github";
import { fallbackRepos } from "../data/profile";
import type { GitHubUser } from "../types/github";
import type { Repository } from "../types/repository";

export type DataStatus = "loading" | "ready" | "fallback";

export interface RepositoriesState {
  status: DataStatus;
  user: GitHubUser | null;
  repos: readonly Repository[];
  /** Human-readable reason when serving fallback data. */
  notice: string | null;
  /** ISO timestamp of when data was last fetched. */
  fetchedAt: string | null;
}

const IDLE: RepositoriesState = {
  status: "loading",
  user: null,
  repos: [],
  notice: null,
  fetchedAt: null,
};

/**
 * Data priority:
 *   1. Fresh client cache
 *   2. Static build-time snapshot
 *   3. Background API refresh (when cache is stale)
 *   4. Graceful fallback
 */
export function useRepositories(
  username: string,
): RepositoriesState & { retry: () => void } {
  const [state, setState] = useState<RepositoriesState>(IDLE);
  const [reloadKey, setReloadKey] = useState(0);
  const attemptRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const attempt = ++attemptRef.current;

      // 1. Try client cache first (instant)
      if (isCacheFresh()) {
        const cached = readCache();
        if (cached && !cancelled) {
          setState({
            status: "ready",
            user: cached.user,
            repos: cached.repos,
            notice: null,
            fetchedAt: cached.fetchedAt
              ? new Date(cached.fetchedAt).toISOString()
              : null,
          });
          return; // Cache is fresh — done.
        }
      }

      // 2. Try static snapshot (fast, no API)
      const snapshot = await loadStaticSnapshot();
      if (cancelled) return;

      if (snapshot && snapshot.repos.length > 0) {
        setState({
          status: "ready",
          user: snapshot.user,
          repos: snapshot.repos,
          notice: null,
          fetchedAt: snapshot.fetchedAt
            ? new Date(snapshot.fetchedAt).toISOString()
            : null,
        });

        // Snapshot is stale — background refresh.
        if (!isCacheFresh()) {
          refreshFromApi(username, cancelled, attempt);
        }
        return;
      }

      // 3. No cache, no snapshot — try API directly.
      await refreshFromApi(username, cancelled, attempt);
    }

    async function refreshFromApi(
      user: string,
      cancelled: boolean,
      attempt: number,
    ) {
      try {
        const [userResult, repoResult] = await Promise.allSettled([
          fetchUser(user),
          fetchRepositories(user),
        ]);
        if (cancelled || attempt !== attemptRef.current) return;

        if (repoResult.status === "fulfilled") {
          let u: GitHubUser | null =
            userResult.status === "fulfilled" ? userResult.value : null;
          if (!u) {
            u = {
              login: user,
              name: null,
              bio: null,
              html_url: `https://github.com/${user}`,
              avatar_url: "",
              public_repos: repoResult.value.length,
              followers: 0,
              created_at: new Date().toISOString(),
            };
          }
          const data = {
            version: 1 as const,
            fetchedAt: Date.now(),
            user: u,
            repos: repoResult.value,
          };
          writeCache(data);
          setState({
            status: "ready",
            user: u,
            repos: repoResult.value,
            notice: null,
            fetchedAt: new Date().toISOString(),
          });
          return;
        }

        // API failed — use whatever we have, or fallback.
        const reason =
          repoResult.reason instanceof GitHubError
            ? repoResult.reason.rateLimited
              ? "rate limit reached"
              : `api responded ${repoResult.reason.status}`
            : "api unreachable";

        setState({
          status: "fallback",
          user: null,
          repos: fallbackRepos,
          notice: reason,
          fetchedAt: null,
        });
      } catch {
        if (cancelled || attempt !== attemptRef.current) return;
        setState({
          status: "fallback",
          user: null,
          repos: fallbackRepos,
          notice: "api unreachable",
          fetchedAt: null,
        });
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [username, reloadKey]);

  const retry = useCallback(() => setReloadKey((k) => k + 1), []);

  return { ...state, retry };
}
