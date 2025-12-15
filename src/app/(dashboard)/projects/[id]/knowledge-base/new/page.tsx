"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/atoms/Button";
import { Typography } from "@/atoms/Typography";
import { KBEntryEditor } from "@/organisms/KBEntryEditor";
import { knowledgeBaseService } from "@/shared/services/knowledgeBase";
import type { KBEntryCategory } from "@/shared/services/knowledgeBase";

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}

export default function NewKBEntryPage({ params }: { params: { id: string } }) {
  const { id: projectId } = params;
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<KBEntryCategory>("DOCUMENTATION");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const entry = await knowledgeBaseService.create(projectId, {
        title: title.trim(),
        content: content.trim(),
        category,
      });
      router.push(`/projects/${projectId}/knowledge-base/${entry.id}` as any);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create entry");
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/projects/${projectId}/knowledge-base` as any);
  };

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-neutral-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/projects/${projectId}/knowledge-base` as any}
            className="inline-flex items-center gap-2 text-secondary-600 dark:text-neutral-400 hover:text-secondary-900 dark:hover:text-neutral-100 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Back to Knowledge Base</span>
          </Link>

          <Typography variant="h1" className="text-2xl font-bold">
            New Knowledge Base Entry
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
              {isSaving ? "Creating..." : "Create Entry"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
