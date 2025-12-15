"use client";

import { useState, useEffect } from "react";
import { Button } from "@/atoms/Button";
import { Select } from "@/atoms/Select";
import { Typography } from "@/atoms/Typography";
import { useGitHubRepos, useProjectRepo } from "@/shared/hooks";
import type { RepoSelectorProps } from "./RepoSelector.types";

export function RepoSelector({
  projectId,
  linkedRepo,
  onRepoLinked,
  onRepoUnlinked,
}: RepoSelectorProps) {
  const [selectedRepoFullName, setSelectedRepoFullName] = useState("");
  const { repos, isLoading: isLoadingRepos, error: reposError, fetchRepos } = useGitHubRepos();
  const { isLinking, isSyncing, syncResult, error, linkRepo, unlinkRepo, syncPRs } =
    useProjectRepo(projectId);

  useEffect(() => {
    if (!linkedRepo) {
      fetchRepos();
    }
  }, [linkedRepo, fetchRepos]);

  const handleLink = async () => {
    const selectedRepo = repos.find((r) => r.fullName === selectedRepoFullName);
    if (selectedRepo) {
      const success = await linkRepo(selectedRepo);
      if (success) {
        onRepoLinked?.();
      }
    }
  };

  const handleUnlink = async () => {
    const success = await unlinkRepo();
    if (success) {
      onRepoUnlinked?.();
      setSelectedRepoFullName("");
      fetchRepos();
    }
  };

  const handleSync = async () => {
    await syncPRs();
  };

  if (linkedRepo) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg border border-secondary-200">
          <div className="flex items-center gap-3">
            <svg
              className="w-6 h-6 text-secondary-700"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            <div>
              <a
                href={linkedRepo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-secondary-900 hover:text-primary-600"
              >
                {linkedRepo.fullName}
              </a>
              <p className="text-sm text-secondary-500">Repository linked</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              isLoading={isSyncing}
            >
              Sync PRs
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUnlink}
              isLoading={isLinking}
            >
              Unlink
            </Button>
          </div>
        </div>

        {syncResult && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">{syncResult.message}</p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Typography variant="h4" className="mb-2">
          Link GitHub Repository
        </Typography>
        <p className="text-sm text-secondary-500 mb-3">
          Connect a GitHub repo to automatically track pull requests against tasks.
        </p>
      </div>

      {reposError && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-700">{reposError}</p>
          <p className="text-xs text-amber-600 mt-1">
            Make sure you&apos;re logged in with GitHub to access your repositories.
          </p>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex gap-2">
        <div className="flex-1">
          <Select
            value={selectedRepoFullName}
            onChange={(e) => setSelectedRepoFullName(e.target.value)}
            disabled={isLoadingRepos || repos.length === 0}
            placeholder={isLoadingRepos ? "Loading repositories..." : "Select a repository"}
            options={repos.map((repo) => ({
              value: repo.fullName,
              label: `${repo.fullName}${repo.isPrivate ? " (private)" : ""}`,
            }))}
          />
        </div>
        <Button
          onClick={handleLink}
          disabled={!selectedRepoFullName || isLinking}
          isLoading={isLinking}
        >
          Link
        </Button>
      </div>

      <p className="text-xs text-secondary-400">
        PRs will be auto-linked to tasks when branch names contain task IDs (e.g.,
        task-abc123 or feature/task-abc123-description)
      </p>
    </div>
  );
}
