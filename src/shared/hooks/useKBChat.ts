"use client";

import { useState, useCallback, useRef } from "react";
import { chatService, ChatMessage, ChatSource } from "@/shared/services/chat";

interface UseKBChatOptions {
  projectId: string;
  maxHistoryLength?: number;
}

interface UseKBChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (question: string) => Promise<void>;
  clearChat: () => void;
}

export function useKBChat({
  projectId,
  maxHistoryLength = 10,
}: UseKBChatOptions): UseKBChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep track of conversation for API calls
  const conversationRef = useRef<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);

  const sendMessage = useCallback(
    async (question: string) => {
      if (!question.trim() || isLoading) return;

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: question.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      // Add to conversation history
      conversationRef.current.push({ role: "user", content: question.trim() });

      try {
        const response = await chatService.sendMessage(projectId, {
          messages: conversationRef.current.slice(-maxHistoryLength),
          question: question.trim(),
        });

        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: response.answer,
          timestamp: new Date(),
          sources: response.sources,
          codeFiles: response.codeFiles,
          tasksMentioned: response.tasksMentioned,
        };

        setMessages((prev) => [...prev, assistantMessage]);
        conversationRef.current.push({
          role: "assistant",
          content: response.answer,
        });

        // Trim conversation history if too long
        if (conversationRef.current.length > maxHistoryLength * 2) {
          conversationRef.current = conversationRef.current.slice(
            -maxHistoryLength
          );
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to send message";
        setError(errorMsg);
      } finally {
        setIsLoading(false);
      }
    },
    [projectId, isLoading, maxHistoryLength]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    conversationRef.current = [];
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
  };
}
