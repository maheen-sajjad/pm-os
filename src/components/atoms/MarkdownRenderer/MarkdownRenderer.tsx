"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/utils/cn";
import type { MarkdownRendererProps } from "./MarkdownRenderer.types";

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none",
        // Headings
        "prose-headings:font-semibold prose-headings:text-secondary-900 dark:prose-headings:text-neutral-100",
        // Paragraphs
        "prose-p:text-secondary-700 dark:prose-p:text-neutral-300",
        // Links
        "prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline dark:prose-a:text-primary-400",
        // Code
        "prose-code:bg-secondary-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-secondary-800",
        "dark:prose-code:bg-neutral-800 dark:prose-code:text-neutral-200",
        "prose-pre:bg-secondary-900 prose-pre:text-secondary-100 dark:prose-pre:bg-neutral-900",
        // Lists
        "prose-li:text-secondary-700 dark:prose-li:text-neutral-300",
        "prose-ul:list-disc prose-ol:list-decimal",
        // Tables
        "prose-table:border-secondary-200 dark:prose-table:border-neutral-700",
        "prose-th:bg-secondary-50 prose-th:text-secondary-900 dark:prose-th:bg-neutral-800 dark:prose-th:text-neutral-100",
        "prose-td:border-secondary-200 dark:prose-td:border-neutral-700",
        // Blockquotes
        "prose-blockquote:border-primary-500 prose-blockquote:text-secondary-600 dark:prose-blockquote:text-neutral-400",
        // HR
        "prose-hr:border-secondary-200 dark:prose-hr:border-neutral-700",
        className
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
