"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/atoms/Modal";
import { Button } from "@/atoms/Button";
import { Checkbox } from "@/atoms/Checkbox";
import { Badge } from "@/atoms/Badge";
import { githubService, GitHubRepo, ImportResult } from "@/shared/services/github";
import type { RepoImportModalProps } from "./RepoImportModal.types";

export function RepoImportModal({
  isOpen,
  onClose,
  onImportComplete,
}: RepoImportModalProps) {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [selectedRepos, setSelectedRepos] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isGitHubConnected, setIsGitHubConnected] = useState<boolean | null>(null);

  useEffect(() => {
    if (isOpen) {
      checkGitHubStatus();
    } else {
      // Reset state when modal closes
      setSelectedRepos(new Set());
      setResult(null);
      setError(null);
      setIsGitHubConnected(null);
    }
  }, [isOpen]);

  const checkGitHubStatus = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const status = await githubService.getStatus();
      setIsGitHubConnected(status.connected);

      if (status.connected) {
        await fetchRepos();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to check GitHub status"
      );
      setIsGitHubConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRepos = async () => {
    try {
      const data = await githubService.getRepos();
      setRepos(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch repositories"
      );
    }
  };

  const handleConnectGitHub = () => {
    // Redirect to GitHub OAuth connect endpoint
    window.location.href = "/api/github/connect";
  };

  const handleToggleRepo = (fullName: string) => {
    setSelectedRepos((prev) => {
      const next = new Set(prev);
      if (next.has(fullName)) {
        next.delete(fullName);
      } else {
        next.add(fullName);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedRepos.size === repos.length) {
      setSelectedRepos(new Set());
    } else {
      setSelectedRepos(new Set(repos.map((r) => r.fullName)));
    }
  };

  const handleImport = async () => {
    if (selectedRepos.size === 0) return;

    setIsImporting(true);
    setError(null);

    try {
      const reposToImport = repos.filter((r) => selectedRepos.has(r.fullName));
      const importResult = await githubService.importAsProjects(reposToImport);
      setResult(importResult);
      onImportComplete?.(importResult);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to import repositories"
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleDone = () => {
    onClose();
  };

  // Show result screen after import
  if (result) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Import Complete" size="lg">
        <div className="space-y-4">
          {result.created.length > 0 && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="font-medium text-green-700 dark:text-green-400 mb-2">
                {result.created.length} project(s) created
              </p>
              <ul className="text-sm text-green-600 dark:text-green-300 space-y-1">
                {result.created.map((item) => (
                  <li key={item.projectId}>{item.repoFullName}</li>
                ))}
              </ul>
            </div>
          )}

          {result.skipped.length > 0 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="font-medium text-amber-700 dark:text-amber-400 mb-2">
                {result.skipped.length} repository(s) skipped
              </p>
              <ul className="text-sm text-amber-600 dark:text-amber-300 space-y-1">
                {result.skipped.map((item) => (
                  <li key={item.repoFullName}>
                    {item.repoFullName} - {item.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.errors.length > 0 && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="font-medium text-red-700 dark:text-red-400 mb-2">
                {result.errors.length} error(s)
              </p>
              <ul className="text-sm text-red-600 dark:text-red-300 space-y-1">
                {result.errors.map((item) => (
                  <li key={item.repoFullName}>
                    {item.repoFullName} - {item.error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button onClick={handleDone}>Done</Button>
          </div>
        </div>
      </Modal>
    );
  }

  // Show connect GitHub screen if not connected
  if (isGitHubConnected === false && !isLoading) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Connect GitHub"
        size="md"
      >
        <div className="space-y-6 py-4">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-secondary-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-secondary-600 dark:text-neutral-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-neutral-100 mb-2">
              GitHub Not Connected
            </h3>
            <p className="text-sm text-secondary-500 dark:text-neutral-400 mb-6">
              Connect your GitHub account to import repositories as projects and
              track pull requests.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-center gap-3">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleConnectGitHub}>
              <svg
                className="w-4 h-4 mr-2"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              Connect GitHub
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Repositories as Projects"
      size="lg"
    >
      <div className="space-y-4">
        <p className="text-sm text-secondary-500 dark:text-neutral-400">
          Select repositories to create as new projects. Each repository will be
          automatically linked to its project.
        </p>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
          </div>
        ) : repos.length === 0 ? (
          <div className="text-center py-8 text-secondary-500 dark:text-neutral-400">
            No repositories found.
          </div>
        ) : (
          <>
            {/* Select all */}
            <div className="flex items-center justify-between pb-2 border-b border-secondary-200 dark:border-neutral-700">
              <Checkbox
                checked={selectedRepos.size === repos.length}
                onChange={handleSelectAll}
                label={`Select all (${repos.length})`}
              />
              <span className="text-sm text-secondary-500 dark:text-neutral-400">
                {selectedRepos.size} selected
              </span>
            </div>

            {/* Repo list */}
            <div className="max-h-80 overflow-y-auto space-y-2">
              {repos.map((repo) => (
                <label
                  key={repo.fullName}
                  className="flex items-center gap-3 p-3 rounded-lg border border-secondary-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-700 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={selectedRepos.has(repo.fullName)}
                    onChange={() => handleToggleRepo(repo.fullName)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-secondary-500 dark:text-neutral-400 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                      >
                        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                      </svg>
                      <span className="font-medium text-secondary-900 dark:text-neutral-100 truncate">
                        {repo.fullName}
                      </span>
                      {repo.isPrivate && (
                        <Badge variant="default" size="sm">
                          Private
                        </Badge>
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-secondary-200 dark:border-neutral-700">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={selectedRepos.size === 0 || isImporting}
            isLoading={isImporting}
          >
            Import {selectedRepos.size > 0 ? `(${selectedRepos.size})` : ""}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
