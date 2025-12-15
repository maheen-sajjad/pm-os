import { Octokit } from "octokit";

export function createOctokit(accessToken: string) {
  return new Octokit({ auth: accessToken });
}

export interface GitHubRepoInfo {
  id: number;
  name: string;
  fullName: string;
  url: string;
  isPrivate: boolean;
  defaultBranch: string;
}

export interface GitHubPRInfo {
  number: number;
  title: string;
  url: string;
  state: "open" | "closed";
  merged: boolean;
  author: string;
  branchName: string;
  commitsCount: number;
  createdAt: string;
  updatedAt: string;
}

export async function getUserRepos(accessToken: string): Promise<GitHubRepoInfo[]> {
  const octokit = createOctokit(accessToken);

  const { data } = await octokit.rest.repos.listForAuthenticatedUser({
    sort: "updated",
    per_page: 100,
  });

  return data.map((repo) => ({
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    url: repo.html_url,
    isPrivate: repo.private,
    defaultBranch: repo.default_branch,
  }));
}

export async function getRepoPullRequests(
  accessToken: string,
  owner: string,
  repo: string,
  state: "open" | "closed" | "all" = "all"
): Promise<GitHubPRInfo[]> {
  const octokit = createOctokit(accessToken);

  const { data } = await octokit.rest.pulls.list({
    owner,
    repo,
    state,
    sort: "updated",
    direction: "desc",
    per_page: 100,
  });

  return data.map((pr) => ({
    number: pr.number,
    title: pr.title,
    url: pr.html_url,
    state: pr.state as "open" | "closed",
    merged: pr.merged_at !== null,
    author: pr.user?.login || "unknown",
    branchName: pr.head.ref,
    commitsCount: 0, // commits count not available in list endpoint
    createdAt: pr.created_at,
    updatedAt: pr.updated_at,
  }));
}

export async function getPullRequest(
  accessToken: string,
  owner: string,
  repo: string,
  pullNumber: number
): Promise<GitHubPRInfo> {
  const octokit = createOctokit(accessToken);

  const { data: pr } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: pullNumber,
  });

  return {
    number: pr.number,
    title: pr.title,
    url: pr.html_url,
    state: pr.state as "open" | "closed",
    merged: pr.merged_at !== null,
    author: pr.user?.login || "unknown",
    branchName: pr.head.ref,
    commitsCount: pr.commits || 0,
    createdAt: pr.created_at,
    updatedAt: pr.updated_at,
  };
}

// Parse task ID from branch name
// Supports formats: task-123, TASK-123, feature/task-123, fix/task-123-description
export function parseTaskIdFromBranch(branchName: string): string | null {
  const patterns = [
    /task[_-]([a-zA-Z0-9_-]+)/i,
    /^([a-zA-Z]+-\d+)/i, // JIRA-style: ABC-123
    /\/([a-zA-Z]+-\d+)/i, // feature/ABC-123
  ];

  for (const pattern of patterns) {
    const match = branchName.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

// Create a webhook for a repository
export async function createWebhook(
  accessToken: string,
  owner: string,
  repo: string,
  webhookUrl: string,
  secret: string
) {
  const octokit = createOctokit(accessToken);

  const { data } = await octokit.rest.repos.createWebhook({
    owner,
    repo,
    config: {
      url: webhookUrl,
      content_type: "json",
      secret,
    },
    events: ["pull_request"],
    active: true,
  });

  return data;
}

// Verify webhook signature
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const crypto = require("crypto");
  const hmac = crypto.createHmac("sha256", secret);
  const digest = "sha256=" + hmac.update(payload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

// ============== Code Indexing Functions ==============

export interface GitHubTreeItem {
  path: string;
  sha: string;
  type: "blob" | "tree";
  size?: number;
}

export interface GitHubFileContent {
  content: string;
  sha: string;
  size: number;
}

/**
 * Get the full tree (file listing) for a repository
 */
export async function getRepoTree(
  accessToken: string,
  owner: string,
  repo: string,
  branch: string = "main"
): Promise<GitHubTreeItem[]> {
  const octokit = createOctokit(accessToken);

  try {
    const { data } = await octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: branch,
      recursive: "true",
    });

    return data.tree
      .filter((item): item is typeof item & { path: string; sha: string } =>
        item.type === "blob" && item.path !== undefined && item.sha !== undefined
      )
      .map((item) => ({
        path: item.path,
        sha: item.sha,
        type: "blob" as const,
        size: item.size,
      }));
  } catch (error: any) {
    // Try 'master' branch if 'main' fails
    if (branch === "main" && error.status === 404) {
      return getRepoTree(accessToken, owner, repo, "master");
    }
    throw error;
  }
}

/**
 * Get the content of a specific file
 */
export async function getFileContent(
  accessToken: string,
  owner: string,
  repo: string,
  path: string,
  ref?: string
): Promise<GitHubFileContent> {
  const octokit = createOctokit(accessToken);

  const { data } = await octokit.rest.repos.getContent({
    owner,
    repo,
    path,
    ref,
  });

  if (Array.isArray(data) || data.type !== "file") {
    throw new Error(`Path ${path} is not a file`);
  }

  // GitHub returns base64 encoded content
  const content = Buffer.from(data.content, "base64").toString("utf-8");

  return {
    content,
    sha: data.sha,
    size: data.size,
  };
}

/**
 * Get the latest commit SHA for a branch
 */
export async function getLatestCommitSha(
  accessToken: string,
  owner: string,
  repo: string,
  branch: string = "main"
): Promise<string> {
  const octokit = createOctokit(accessToken);

  try {
    const { data } = await octokit.rest.repos.getBranch({
      owner,
      repo,
      branch,
    });

    return data.commit.sha;
  } catch (error: any) {
    // Try 'master' branch if 'main' fails
    if (branch === "main" && error.status === 404) {
      return getLatestCommitSha(accessToken, owner, repo, "master");
    }
    throw error;
  }
}
