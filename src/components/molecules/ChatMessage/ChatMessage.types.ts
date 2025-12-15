import type { ChatMessage as ChatMessageData } from "@/shared/services/chat";

export interface ChatMessageProps {
  message: ChatMessageData;
  userName: string;
  projectId: string;
}
