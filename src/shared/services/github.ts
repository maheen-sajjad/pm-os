import { api } from "./api";

export interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  url: string;
  isPrivate: boolean;
  defaultBranch?: string;
}

export interface LinkedRepo {
  id: string;
  name: string;
  fullName: string;
  url: string;
  isPrivate: boolean;
}

export interface SyncResult {
  message: string;
  synced: number;
  linked: number;
  errors: string[];
}

export interface ImportResult {
  created: Array<{
    projectId: string;
    projectName: string;
    repoFullName: string;
  }>;
  skipped: Array<{
    repoFullName: string;
    reason: string;
  }>;
  errors: Array<{
    repoFullName: string;
    error: string;
  }>;
}

export interface GitHubStatus {
  connected: boolean;
  hasAccount: boolean;
}

export const githubService = {
  // Check if GitHub is connected
  getStatus: () => {
    return api.get<GitHubStatus>("/github/status");
  },

  // Get user's GitHub repositories
  getRepos: () => {
    return api.get<GitHubRepo[]>("/github/repos");
  },

  // Import selected repos as new projects
  importAsProjects: (repos: GitHubRepo[]) => {
    return api.post<ImportResult>("/projects/import-from-github", { repos });
  },

  // Link a repo to a project
  linkRepo: (projectId: string, repo: GitHubRepo) => {
    return api.post<LinkedRepo>(`/projects/${projectId}/repo`, {
      name: repo.name,
      fullName: repo.fullName,
      url: repo.url,
      isPrivate: repo.isPrivate,
    });
  },

  // Unlink a repo from a project
  unlinkRepo: (projectId: string) => {
    return api.delete<{ success: boolean }>(`/projects/${projectId}/repo`);
  },

  // Sync PRs from GitHub
  syncPRs: (projectId: string) => {
    return api.post<SyncResult>(`/projects/${projectId}/sync-prs`);
  },
};
