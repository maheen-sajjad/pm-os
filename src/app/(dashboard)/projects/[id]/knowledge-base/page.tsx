"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/atoms/Button";
import { Input } from "@/atoms/Input";
import { Select } from "@/atoms/Select";
import { Typography } from "@/atoms/Typography";
import { KBEntryCard } from "@/molecules/KBEntryCard";
import { KBChatPanel } from "@/organisms/KBChatPanel";
import { useKnowledgeBase } from "@/hooks/useKnowledgeBase";
import { useDebounce } from "@/hooks/index";
import type { KBEntryCategory } from "@/shared/services/knowledgeBase";

interface IndexStatus {
  indexed: boolean;
  hasRepo: boolean;
  lastIndexedAt: string | null;
  totalFiles: number;
  totalChunks: number;
  inProgress: boolean;
  lastError: string | null;
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}

function BookOpenIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

function CodeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

const categoryOptions = [
  { value: "", label: "All Categories" },
  { value: "DOCUMENTATION", label: "Documentation" },
  { value: "GUIDE", label: "Guide" },
  { value: "REFERENCE", label: "Reference" },
  { value: "MEETING_NOTES", label: "Meeting Notes" },
  { value: "DECISION", label: "Decision" },
  { value: "OTHER", label: "Other" },
];

export default function KnowledgeBasePage({ params }: { params: { id: string } }) {
  const { id: projectId } = params;
  const router = useRouter();

  const [searchInput, setSearchInput] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<KBEntryCategory | "">("");
  const [projectName, setProjectName] = useState<string>("");
  const [chatOpen, setChatOpen] = useState(false);
  const [indexStatus, setIndexStatus] = useState<IndexStatus | null>(null);
  const [indexLoading, setIndexLoading] = useState(false);
  const [indexError, setIndexError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(searchInput, 300);

  const fetchIndexStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/index-code`);
      if (res.ok) {
        const data = await res.json();
        setIndexStatus(data);
      }
    } catch (e) {
      console.error("Failed to fetch index status:", e);
    }
  }, [projectId]);

  const handleStartIndexing = async () => {
    setIndexLoading(true);
    setIndexError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/index-code`, {
        method: "POST",
      });
      if (res.ok) {
        // Start polling for status
        const pollInterval = setInterval(async () => {
          await fetchIndexStatus();
          if (indexStatus && !indexStatus.inProgress) {
            clearInterval(pollInterval);
          }
        }, 2000);
        // Also fetch immediately
        await fetchIndexStatus();
      } else {
        const data = await res.json();
        setIndexError(data.error || "Failed to start indexing");
      }
    } catch (e) {
      setIndexError("Failed to start indexing");
    } finally {
      setIndexLoading(false);
    }
  };

  // Poll for index status while indexing is in progress
  useEffect(() => {
    if (indexStatus?.inProgress) {
      const interval = setInterval(fetchIndexStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [indexStatus?.inProgress, fetchIndexStatus]);

  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      category: categoryFilter || undefined,
    }),
    [debouncedSearch, categoryFilter]
  );

  const { entries, isLoading, error } = useKnowledgeBase(projectId, filters);

  useEffect(() => {
    async function fetchProjectName() {
      try {
        const res = await fetch(`/api/projects/${projectId}`);
        if (res.ok) {
          const data = await res.json();
          setProjectName(data.name);
        }
      } catch (e) {
        // Ignore error
      }
    }
    fetchProjectName();
    fetchIndexStatus();
  }, [projectId, fetchIndexStatus]);

  const handleEntryClick = (entryId: string) => {
    router.push(`/projects/${projectId}/knowledge-base/${entryId}` as any);
  };

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-neutral-950">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/projects/${projectId}` as any}
            className="inline-flex items-center gap-2 text-secondary-600 dark:text-neutral-400 hover:text-secondary-900 dark:hover:text-neutral-100 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Back to Project</span>
          </Link>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                <BookOpenIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <Typography variant="h1" className="text-2xl font-bold">
                  Knowledge Base
                </Typography>
                {projectName && (
                  <p className="text-sm text-secondary-500 dark:text-neutral-400">
                    {projectName}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setChatOpen(true)}>
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                Ask AI
              </Button>
              <Button
                variant="primary"
                onClick={() => router.push(`/projects/${projectId}/knowledge-base/new` as any)}
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                New Entry
              </Button>
            </div>
          </div>
        </div>

        {/* Index Codebase Card */}
        {indexStatus && (
          <div className="mb-6 p-4 bg-white dark:bg-neutral-900 rounded-lg border border-secondary-200 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${indexStatus.indexed ? 'bg-green-100 dark:bg-green-900/30' : 'bg-secondary-100 dark:bg-neutral-800'}`}>
                  <CodeIcon className={`w-5 h-5 ${indexStatus.indexed ? 'text-green-600 dark:text-green-400' : 'text-secondary-500 dark:text-neutral-400'}`} />
                </div>
                <div>
                  <Typography variant="h4" className="text-sm font-semibold">
                    Codebase Index
                  </Typography>
                  {!indexStatus.hasRepo ? (
                    <p className="text-xs text-secondary-500 dark:text-neutral-400">
                      No GitHub repository linked
                    </p>
                  ) : indexStatus.inProgress ? (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Indexing in progress...
                    </p>
                  ) : indexStatus.indexed ? (
                    <p className="text-xs text-secondary-500 dark:text-neutral-400">
                      {indexStatus.totalFiles} files indexed • Last updated {new Date(indexStatus.lastIndexedAt!).toLocaleDateString()}
                    </p>
                  ) : (
                    <p className="text-xs text-secondary-500 dark:text-neutral-400">
                      Not indexed yet
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {indexStatus.indexed && (
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                )}
                {indexStatus.hasRepo && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStartIndexing}
                    disabled={indexLoading || indexStatus.inProgress}
                  >
                    {indexStatus.inProgress ? (
                      <>
                        <RefreshIcon className="w-4 h-4 mr-2 animate-spin" />
                        Indexing...
                      </>
                    ) : indexStatus.indexed ? (
                      <>
                        <RefreshIcon className="w-4 h-4 mr-2" />
                        Re-index
                      </>
                    ) : (
                      <>
                        <CodeIcon className="w-4 h-4 mr-2" />
                        Index Codebase
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
            {indexError && (
              <p className="mt-2 text-sm text-red-500">{indexError}</p>
            )}
            {indexStatus.lastError && !indexStatus.inProgress && (
              <p className="mt-2 text-sm text-red-500">Last error: {indexStatus.lastError}</p>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search entries..."
              className="pl-10"
            />
          </div>
          <Select
            options={categoryOptions}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as KBEntryCategory | "")}
            className="w-full sm:w-48"
          />
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500">{error}</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-neutral-900 rounded-lg border border-secondary-200 dark:border-neutral-800">
            <BookOpenIcon className="w-12 h-12 mx-auto text-secondary-300 dark:text-neutral-600 mb-4" />
            <Typography variant="h3" className="text-secondary-600 dark:text-neutral-400 mb-2">
              {searchInput || categoryFilter ? "No entries found" : "No knowledge base entries yet"}
            </Typography>
            <p className="text-sm text-secondary-500 dark:text-neutral-500 mb-6">
              {searchInput || categoryFilter
                ? "Try adjusting your search or filter"
                : "Create your first entry to start building your project's knowledge base"}
            </p>
            {!searchInput && !categoryFilter && (
              <Button
                variant="primary"
                onClick={() => router.push(`/projects/${projectId}/knowledge-base/new` as any)}
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Create First Entry
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {entries.map((entry) => (
              <KBEntryCard
                key={entry.id}
                entry={entry}
                onClick={() => handleEntryClick(entry.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Knowledge Base Chat Panel */}
      <KBChatPanel
        projectId={projectId}
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        projectName={projectName}
      />
    </div>
  );
}
