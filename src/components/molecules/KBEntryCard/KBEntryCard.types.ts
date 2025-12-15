import type { KBEntry } from "@/shared/services/knowledgeBase";

export interface KBEntryCardProps {
  entry: KBEntry;
  onClick?: () => void;
  className?: string;
}
