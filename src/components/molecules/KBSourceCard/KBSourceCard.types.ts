import type { ChatSource } from "@/shared/services/chat";

export interface KBSourceCardProps {
  source: ChatSource;
  projectId: string;
  onClick?: () => void;
}
