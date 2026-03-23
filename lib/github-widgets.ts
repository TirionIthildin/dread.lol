/**
 * GitHub stats widgets: last push, public repo count, contribution calendar snippet.
 * Uses GitHub REST API and GraphQL API (https://docs.github.com/en/rest, https://docs.github.com/en/graphql).
 * GraphQL contribution calendar requires a server GITHUB_TOKEN; results are cached per username.
 */

import { unstable_cache } from "next/cache";

export type GithubWidgetType = "lastPush" | "publicRepos" | "contributions";

const ALLOWED: readonly GithubWidgetType[] = ["lastPush", "publicRepos", "contributions"];
const ALLOWED_SET = new Set<string>(ALLOWED);

export interface GithubWidgetData {
  login: string;
  profileUrl: string;
  avatarUrl?: string;
  lastPush?: { at: string; repoName?: string };
  publicRepos?: number;
  contributions?: {
    total: number;
    /** Last 4 weeks × 7 days, raw counts (for heatmap colors). */
    heatmap: number[][];
  };
  /** GraphQL unavailable (missing GITHUB_TOKEN or API error). */
  contributionsUnavailable?: boolean;
}

const UA = "Dread.lol-profile-widget/1.0";

function githubHeaders(acceptJson = true): HeadersInit {
  const h: Record<string, string> = {
    "User-Agent": UA,
  };
  if (acceptJson) h.Accept = "application/vnd.github+json";
  const t = process.env.GITHUB_TOKEN?.trim();
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
}

/**
 * Normalize GitHub login from raw input (handles @user and github.com URLs).
 */
export function normalizeGithubUsername(raw: string | null | undefined): string | null {
  const s = raw?.trim();
  if (!s) return null;
  let candidate = s.replace(/^@+/, "");
  const urlMatch = candidate.match(/github\.com\/([^/?#]+)/i);
  if (urlMatch) candidate = urlMatch[1] ?? candidate;
  candidate = candidate.split("/")[0] ?? candidate;
  candidate = candidate.toLowerCase();
  if (!/^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){0,38}$/.test(candidate)) return null;
  return candidate;
}

/**
 * Parse CSV of widget keys from DB; allowlist only, preserve order, dedupe.
 */
export function parseEnabledGithubWidgets(raw: string | null | undefined): GithubWidgetType[] {
  if (!raw?.trim()) return [];
  const seen = new Set<string>();
  const out: GithubWidgetType[] = [];
  for (const part of raw.split(",")) {
    const id = part.trim().toLowerCase();
    const mapped =
      id === "lastpush"
        ? "lastPush"
        : id === "publicrepos"
          ? "publicRepos"
          : id === "contributions"
            ? "contributions"
            : null;
    if (!mapped || !ALLOWED_SET.has(mapped) || seen.has(mapped)) continue;
    seen.add(mapped);
    out.push(mapped);
  }
  return out;
}

interface GitHubUserJson {
  login?: string;
  public_repos?: number;
  html_url?: string;
  avatar_url?: string;
  message?: string;
}

interface GitHubRepoJson {
  pushed_at?: string;
  name?: string;
}

async function fetchGithubWidgetDataUncached(
  login: string,
  enabled: GithubWidgetType[]
): Promise<GithubWidgetData | null> {
  const userRes = await fetch(`https://api.github.com/users/${encodeURIComponent(login)}`, {
    headers: githubHeaders(),
  });
  if (userRes.status === 404) return null;
  if (!userRes.ok) return null;
  let userJson: GitHubUserJson;
  try {
    userJson = (await userRes.json()) as GitHubUserJson;
  } catch {
    return null;
  }
  if (!userJson.login || !userJson.html_url) return null;

  const data: GithubWidgetData = {
    login: userJson.login,
    profileUrl: userJson.html_url,
    ...(userJson.avatar_url ? { avatarUrl: userJson.avatar_url } : {}),
  };

  if (enabled.includes("publicRepos") && typeof userJson.public_repos === "number") {
    data.publicRepos = userJson.public_repos;
  }

  if (enabled.includes("lastPush")) {
    const repoRes = await fetch(
      `https://api.github.com/users/${encodeURIComponent(login)}/repos?sort=pushed&per_page=1&type=owner`,
      { headers: githubHeaders() }
    );
    if (repoRes.ok) {
      try {
        const repos = (await repoRes.json()) as unknown;
        const first = Array.isArray(repos) ? (repos[0] as GitHubRepoJson | undefined) : undefined;
        if (first?.pushed_at) {
          data.lastPush = {
            at: first.pushed_at,
            ...(first.name ? { repoName: first.name } : {}),
          };
        }
      } catch {
        /* ignore */
      }
    }
  }

  if (enabled.includes("contributions")) {
    const token = process.env.GITHUB_TOKEN?.trim();
    if (!token) {
      data.contributionsUnavailable = true;
    } else {
      const gql = await fetchContributionsGraphql(login, token);
      if (gql) {
        data.contributions = gql;
      } else {
        data.contributionsUnavailable = true;
      }
    }
  }

  return data;
}

async function fetchContributionsGraphql(
  login: string,
  token: string
): Promise<{ total: number; heatmap: number[][] } | null> {
  const query = `
    query ($login: String!) {
      user(login: $login) {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                contributionCount
              }
            }
          }
        }
      }
    }
  `;
  try {
    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        "User-Agent": UA,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables: { login } }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      data?: {
        user?: {
          contributionsCollection?: {
            contributionCalendar?: {
              totalContributions?: number;
              weeks?: Array<{ contributionDays?: Array<{ contributionCount?: number }> }>;
            };
          };
        };
      };
      errors?: unknown;
    };
    if (json.errors || !json.data?.user?.contributionsCollection?.contributionCalendar) return null;
    const cal = json.data.user.contributionsCollection.contributionCalendar;
    const total = cal.totalContributions;
    if (typeof total !== "number") return null;
    const weeks = cal.weeks ?? [];
    const last4 = weeks.slice(-4);
    const heatmap: number[][] = last4.map((w) => {
      const days = w.contributionDays ?? [];
      const row: number[] = [];
      for (let i = 0; i < 7; i++) {
        row.push(days[i]?.contributionCount ?? 0);
      }
      return row;
    });
    return { total, heatmap };
  } catch {
    return null;
  }
}

/**
 * Fetch GitHub widget payload for a profile. Cached ~1h per login + enabled set.
 */
export async function getGithubWidgetData(
  usernameRaw: string | null | undefined,
  rawCsv: string | null | undefined
): Promise<GithubWidgetData | null> {
  const login = normalizeGithubUsername(usernameRaw);
  const enabled = parseEnabledGithubWidgets(rawCsv);
  if (!login || enabled.length === 0) return null;

  const key = enabled.slice().sort().join(",");
  return unstable_cache(
    () => fetchGithubWidgetDataUncached(login, enabled),
    ["github-profile-widget", login, key],
    { revalidate: 3600 }
  )();
}
