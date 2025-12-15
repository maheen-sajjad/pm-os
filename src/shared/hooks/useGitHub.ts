"use client";

import { useState, useCallback } from "react";
import { githubService, GitHubRepo, SyncResult } from "@/shared/services";

export function useGitHubRepos() {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRepos = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await githubService.getRepos();
      setRepos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch repositories");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    repos,
    isLoading,
    error,
    fetchRepos,
  };
}

export function useProjectRepo(projectId: string) {
  const [isLinking, setIsLinking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const linkRepo = useCallback(
    async (repo: GitHubRepo) => {
      setIsLinking(true);
      setError(null);

      try {
        await githubService.linkRepo(projectId, repo);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to link repository");
        return false;
      } finally {
        setIsLinking(false);
      }
    },
    [projectId]
  );

  const unlinkRepo = useCallback(async () => {
    setIsLinking(true);
    setError(null);

    try {
      await githubService.unlinkRepo(projectId);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unlink repository");
      return false;
    } finally {
      setIsLinking(false);
    }
  }, [projectId]);

  const syncPRs = useCallback(async () => {
    setIsSyncing(true);
    setError(null);
    setSyncResult(null);

    try {
      const result = await githubService.syncPRs(projectId);
      setSyncResult(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync PRs");
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, [projectId]);

  return {
    isLinking,
    isSyncing,
    syncResult,
    error,
    linkRepo,
    unlinkRepo,
    syncPRs,
  };
}
