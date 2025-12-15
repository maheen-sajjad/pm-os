"use client";

import Link from "next/link";
import type { KBSourceCardProps } from "./KBSourceCard.types";

function DocumentIcon({ className }: { className?: string }) {
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
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

export function KBSourceCard({ source, projectId, onClick }: KBSourceCardProps) {
  const href = `/projects/${projectId}/knowledge-base/${source.id}`;

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-2 px-2 py-1 rounded-md bg-secondary-50 dark:bg-neutral-800 border border-secondary-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-600 transition-colors text-left"
      >
        <DocumentIcon className="w-3 h-3 text-secondary-400 flex-shrink-0" />
        <span className="text-xs font-medium text-secondary-700 dark:text-neutral-300 truncate max-w-[150px]">
          {source.title}
        </span>
      </button>
    );
  }

  return (
    <Link
      href={href as any}
      target="_blank"
      className="flex items-center gap-2 px-2 py-1 rounded-md bg-secondary-50 dark:bg-neutral-800 border border-secondary-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-600 transition-colors"
    >
      <DocumentIcon className="w-3 h-3 text-secondary-400 flex-shrink-0" />
      <span className="text-xs font-medium text-secondary-700 dark:text-neutral-300 truncate max-w-[150px]">
        {source.title}
      </span>
    </Link>
  );
}
