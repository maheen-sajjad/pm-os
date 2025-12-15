"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/atoms/Button";
import { Typography } from "@/atoms/Typography";
import { KBEntryEditor } from "@/organisms/KBEntryEditor";
import { useKBEntry } from "@/hooks/useKnowledgeBase";
import { usePermissions } from "@/hooks/usePermissions";
import type { KBEntryCategory } from "@/shared/services/knowledgeBase";

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}

export default function EditKBEntryPage({
  params,
}: {
  params: { id: string; entryId: string };
}) {
  const { id: projectId, entryId } = params;
  const router = useRouter();
  const { data: session } = useSession();
  const { can } = usePermissions();

  const { entry, isLoading, error: fetchError, updateEntry } = useKBEntry(projectId, entryId);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<KBEntryCategory>("DOCUMENTATION");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const isOwner = entry && session?.user?.id === entry.creator.id;
  const canEdit = isOwner || can("kb:edit-all");

  // Initialize form when entry loads
  useEffect(() => {
    if (entry && !initialized) {
      setTitle(entry.title);
      setContent(entry.content);
      setCategory(entry.category);
      setInitialized(true);
    }
  }, [entry, initialized]);

  // Redirect if no permission
  useEffect(() => {
    if (!isLoading && entry && !canEdit) {
      router.push(`/projects/${projectId}/knowledge-base/${entryId}` as any);
    }
  }, [isLoading, entry, canEdit, projectId, entryId, router]);

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!content.trim()) {
      setError("Content is required");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await updateEntry({
        title: title.trim(),
        content: content.trim(),
        category,
      });
      router.push(`/projects/${projectId}/knowledge-base/${entryId}` as any);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update entry");
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/projects/${projectId}/knowledge-base/${entryId}` as any);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (fetchError || !entry) {
    return (
      <div className="min-h-screen bg-secondary-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <Typography variant="h3" className="text-secondary-600 dark:text-neutral-400 mb-4">
            {fetchError || "Entry not found"}
          </Typography>
          <Button
            variant="primary"
            onClick={() => router.push(`/projects/${projectId}/knowledge-base` as any)}
          >
            Back to Knowledge Base
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-neutral-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/projects/${projectId}/knowledge-base/${entryId}` as any}
            className="inline-flex items-center gap-2 text-secondary-600 dark:text-neutral-400 hover:text-secondary-900 dark:hover:text-neutral-100 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Back to Entry</span>
          </Link>

          <Typography variant="h1" className="text-2xl font-bold">
            Edit Entry
          </Typography>
        </div>

        {/* Editor */}
        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-secondary-200 dark:border-neutral-800 p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <KBEntryEditor
            title={title}
            content={content}
            category={category}
            onTitleChange={setTitle}
            onContentChange={setContent}
            onCategoryChange={setCategory}
          />

          <div className="mt-6 flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={handleCancel} disabled={isSaving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
