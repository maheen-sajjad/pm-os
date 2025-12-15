"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/atoms/Button";
import { Typography } from "@/atoms/Typography";
import { Badge } from "@/atoms/Badge";
import { Avatar } from "@/atoms/Avatar";
import { Modal } from "@/atoms/Modal";
import { MarkdownRenderer } from "@/atoms/MarkdownRenderer";
import { useKBEntry } from "@/hooks/useKnowledgeBase";
import { usePermissions } from "@/hooks/usePermissions";
import { knowledgeBaseService } from "@/shared/services/knowledgeBase";
import type { KBEntryCategory, KBAttachment } from "@/shared/services/knowledgeBase";

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function PaperclipIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  );
}

const categoryConfig: Record<
  KBEntryCategory,
  { label: string; variant: "default" | "primary" | "success" | "warning" | "info" }
> = {
  DOCUMENTATION: { label: "Documentation", variant: "info" },
  GUIDE: { label: "Guide", variant: "success" },
  REFERENCE: { label: "Reference", variant: "default" },
  MEETING_NOTES: { label: "Meeting Notes", variant: "warning" },
  DECISION: { label: "Decision", variant: "primary" },
  OTHER: { label: "Other", variant: "default" },
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(fileType: string): string {
  if (fileType.startsWith("image/")) return "🖼️";
  if (fileType.includes("pdf")) return "📄";
  if (fileType.includes("word") || fileType.includes("document")) return "📝";
  if (fileType.includes("excel") || fileType.includes("spreadsheet")) return "📊";
  if (fileType.includes("text")) return "📃";
  return "📎";
}

export default function KBEntryViewPage({
  params,
}: {
  params: { id: string; entryId: string };
}) {
  const { id: projectId, entryId } = params;
  const router = useRouter();
  const { data: session } = useSession();
  const { can } = usePermissions();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { entry, isLoading, error, uploadAttachment, deleteAttachment, refresh } =
    useKBEntry(projectId, entryId);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const isOwner = entry && session?.user?.id === entry.creator.id;
  const canEdit = isOwner || can("kb:edit-all");
  const canDelete = isOwner || can("kb:delete-all");

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await knowledgeBaseService.delete(projectId, entryId);
      router.push(`/projects/${projectId}/knowledge-base` as any);
    } catch (err) {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      await uploadAttachment(file);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to upload file");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      await deleteAttachment(attachmentId);
    } catch (err) {
      console.error("Failed to delete attachment:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="min-h-screen bg-secondary-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <Typography variant="h3" className="text-secondary-600 dark:text-neutral-400 mb-4">
            {error || "Entry not found"}
          </Typography>
          <Button variant="primary" onClick={() => router.push(`/projects/${projectId}/knowledge-base` as any)}>
            Back to Knowledge Base
          </Button>
        </div>
      </div>
    );
  }

  const config = categoryConfig[entry.category];

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-neutral-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/projects/${projectId}/knowledge-base` as any}
            className="inline-flex items-center gap-2 text-secondary-600 dark:text-neutral-400 hover:text-secondary-900 dark:hover:text-neutral-100 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Back to Knowledge Base</span>
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Badge variant={config.variant}>{config.label}</Badge>
              </div>
              <Typography variant="h1" className="text-2xl font-bold">
                {entry.title}
              </Typography>
            </div>
            {(canEdit || canDelete) && (
              <div className="flex items-center gap-2">
                {canEdit && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => router.push(`/projects/${projectId}/knowledge-base/${entryId}/edit` as any)}
                  >
                    <PencilIcon className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                )}
                {canDelete && (
                  <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)}>
                    <TrashIcon className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Meta info */}
          <div className="mt-4 flex items-center gap-4 text-sm text-secondary-500 dark:text-neutral-400">
            <div className="flex items-center gap-2">
              <Avatar
                name={entry.creator.name || entry.creator.email}
                src={entry.creator.image || undefined}
                size="sm"
              />
              <span>{entry.creator.name || entry.creator.email}</span>
            </div>
            <span>•</span>
            <span>Created {formatDate(entry.createdAt)}</span>
            {entry.updatedAt !== entry.createdAt && (
              <>
                <span>•</span>
                <span>Updated {formatDate(entry.updatedAt)}</span>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-secondary-200 dark:border-neutral-800 p-6 mb-6">
          <MarkdownRenderer content={entry.content} />
        </div>

        {/* Attachments */}
        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-secondary-200 dark:border-neutral-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PaperclipIcon className="w-5 h-5 text-secondary-500" />
              <Typography variant="h3" className="text-lg font-semibold">
                Attachments ({entry.attachments.length})
              </Typography>
            </div>
            {canEdit && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.svg,.doc,.docx,.xls,.xlsx,.txt,.md"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <UploadIcon className="w-4 h-4 mr-1" />
                  {isUploading ? "Uploading..." : "Upload File"}
                </Button>
              </>
            )}
          </div>

          {uploadError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {uploadError}
            </div>
          )}

          {entry.attachments.length === 0 ? (
            <p className="text-secondary-500 dark:text-neutral-400 text-sm">
              No attachments yet.
            </p>
          ) : (
            <div className="space-y-2">
              {entry.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-3 bg-secondary-50 dark:bg-neutral-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{getFileIcon(attachment.fileType)}</span>
                    <div>
                      <p className="font-medium text-secondary-900 dark:text-neutral-100">
                        {attachment.fileName}
                      </p>
                      <p className="text-xs text-secondary-500 dark:text-neutral-400">
                        {formatFileSize(attachment.fileSize)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={attachment.storagePath}
                      download={attachment.fileName}
                      className="p-2 text-secondary-500 hover:text-secondary-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                    >
                      <DownloadIcon className="w-4 h-4" />
                    </a>
                    {canEdit && (
                      <button
                        onClick={() => handleDeleteAttachment(attachment.id)}
                        className="p-2 text-red-500 hover:text-red-700"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Entry"
      >
        <div className="space-y-4">
          <p className="text-secondary-600 dark:text-neutral-400">
            Are you sure you want to delete &quot;{entry.title}&quot;? This action cannot be undone
            and will also delete all attachments.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
