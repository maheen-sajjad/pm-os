"use client";

import { Card, CardBody } from "@/atoms/Card";
import { Badge } from "@/atoms/Badge";
import { Avatar } from "@/atoms/Avatar";
import { cn } from "@/utils/cn";
import type { KBEntryCardProps } from "./KBEntryCard.types";
import type { KBEntryCategory } from "@/shared/services/knowledgeBase";

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
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  }
}

function PaperclipIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
      />
    </svg>
  );
}

export function KBEntryCard({ entry, onClick, className }: KBEntryCardProps) {
  const config = categoryConfig[entry.category];

  return (
    <Card
      variant="default"
      padding="md"
      className={cn(
        "cursor-pointer hover:shadow-md transition-all duration-200",
        "hover:border-primary-300 dark:hover:border-primary-700",
        className
      )}
      onClick={onClick}
    >
      <CardBody>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-secondary-900 dark:text-neutral-100 truncate">
              {entry.title}
            </h3>
            <p className="mt-1 text-sm text-secondary-500 dark:text-neutral-400 line-clamp-2">
              {entry.content.slice(0, 150)}
              {entry.content.length > 150 && "..."}
            </p>
          </div>
          <Badge variant={config.variant}>{config.label}</Badge>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-secondary-500 dark:text-neutral-400">
          <div className="flex items-center gap-2">
            <Avatar
              name={entry.creator.name || entry.creator.email}
              src={entry.creator.image || undefined}
              size="sm"
            />
            <span className="truncate max-w-[120px]">
              {entry.creator.name || entry.creator.email}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {entry._count.attachments > 0 && (
              <span className="flex items-center gap-1">
                <PaperclipIcon className="w-4 h-4" />
                {entry._count.attachments}
              </span>
            )}
            <span>{formatDate(entry.updatedAt)}</span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
