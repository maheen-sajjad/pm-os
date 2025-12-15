import { api } from "./api";

export interface ChatSource {
  id: string;
  title: string;
  category: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  sources?: ChatSource[];
  codeFiles?: string[];
  tasksMentioned?: string[];
}

export interface SendMessageRequest {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  question: string;
}

export interface SendMessageResponse {
  answer: string;
  sources: ChatSource[];
  codeFiles?: string[];
  tasksMentioned?: string[];
}

export const chatService = {
  sendMessage: async (
    projectId: string,
    data: SendMessageRequest
  ): Promise<SendMessageResponse> => {
    return api.post<SendMessageResponse>(`/projects/${projectId}/chat`, data);
  },
};
