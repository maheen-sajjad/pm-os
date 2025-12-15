"use client";

import { useState } from "react";
import { Input } from "@/atoms/Input";
import { Textarea } from "@/atoms/Textarea";
import { Select } from "@/atoms/Select";
import { MarkdownRenderer } from "@/atoms/MarkdownRenderer";
import { cn } from "@/utils/cn";
import type { KBEntryEditorProps } from "./KBEntryEditor.types";
import type { KBEntryCategory } from "@/shared/services/knowledgeBase";

const categoryOptions: { value: KBEntryCategory; label: string }[] = [
  { value: "DOCUMENTATION", label: "Documentation" },
  { value: "GUIDE", label: "Guide" },
  { value: "REFERENCE", label: "Reference" },
  { value: "MEETING_NOTES", label: "Meeting Notes" },
  { value: "DECISION", label: "Decision" },
  { value: "OTHER", label: "Other" },
];

export function KBEntryEditor({
  title,
  content,
  category,
  onTitleChange,
  onContentChange,
  onCategoryChange,
  className,
}: KBEntryEditorProps) {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-secondary-700 dark:text-neutral-300 mb-1">
            Title
          </label>
          <Input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Enter a descriptive title..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary-700 dark:text-neutral-300 mb-1">
            Category
          </label>
          <Select
            options={categoryOptions}
            value={category}
            onChange={(e) => onCategoryChange(e.target.value as KBEntryCategory)}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-secondary-700 dark:text-neutral-300">
            Content
          </label>
          <div className="flex items-center gap-1 bg-secondary-100 dark:bg-neutral-800 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className={cn(
                "px-3 py-1 text-sm rounded-md transition-colors",
                !showPreview
                  ? "bg-white dark:bg-neutral-700 text-secondary-900 dark:text-neutral-100 shadow-sm"
                  : "text-secondary-600 dark:text-neutral-400 hover:text-secondary-900 dark:hover:text-neutral-100"
              )}
            >
              Write
            </button>
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className={cn(
                "px-3 py-1 text-sm rounded-md transition-colors",
                showPreview
                  ? "bg-white dark:bg-neutral-700 text-secondary-900 dark:text-neutral-100 shadow-sm"
                  : "text-secondary-600 dark:text-neutral-400 hover:text-secondary-900 dark:hover:text-neutral-100"
              )}
            >
              Preview
            </button>
          </div>
        </div>

        {showPreview ? (
          <div className="min-h-[400px] p-4 border border-secondary-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900">
            {content ? (
              <MarkdownRenderer content={content} />
            ) : (
              <p className="text-secondary-400 dark:text-neutral-500 italic">
                Nothing to preview yet. Start writing in the Write tab.
              </p>
            )}
          </div>
        ) : (
          <Textarea
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            rows={18}
            placeholder="Write your content in Markdown...

# Heading 1
## Heading 2

**Bold text** and *italic text*

- Bullet point
- Another point

1. Numbered list
2. Second item

`inline code` or code blocks:

```javascript
const example = 'code';
```

> Blockquote

[Link text](https://example.com)"
            className="font-mono text-sm"
          />
        )}
      </div>

      <p className="text-xs text-secondary-500 dark:text-neutral-400">
        Supports Markdown formatting including headings, lists, code blocks, links, and more.
      </p>
    </div>
  );
}
