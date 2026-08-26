/** Raw shapes for the public GitHub REST API responses we consume. */

export interface GitHubUser {
  login: string;
  name: string | null;
  bio: string | null;
  html_url: string;
  avatar_url: string;
  public_repos: number;
  followers: number;
  created_at: string;
}

export interface GitHubRepoOwner {
  login: string;
  avatar_url?: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  topics?: string[];
  stargazers_count: number;
  forks_count: number;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  fork: boolean;
  archived: boolean;
  default_branch: string;
  owner?: GitHubRepoOwner;
  /** Present on /repos/{owner}/{repo} when the repository is a fork. */
  parent?: GitHubRepo;
}
