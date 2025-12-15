import type { KBEntryCategory } from "@/shared/services/knowledgeBase";

export interface KBEntryEditorProps {
  title: string;
  content: string;
  category: KBEntryCategory;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  onCategoryChange: (category: KBEntryCategory) => void;
  className?: string;
}
