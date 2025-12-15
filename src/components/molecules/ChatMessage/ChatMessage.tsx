"use client";

import { cn } from "@/utils/cn";
import { Avatar } from "@/atoms/Avatar";
import { MarkdownRenderer } from "@/atoms/MarkdownRenderer";
import { KBSourceCard } from "@/molecules/KBSourceCard";
import type { ChatMessageProps } from "./ChatMessage.types";

export function ChatMessage({ message, userName, projectId }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <Avatar
        name={isUser ? userName : "AI"}
        size="sm"
        className={cn(
          "flex-shrink-0",
          !isUser && "bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300"
        )}
      />
      <div
        className={cn(
          "flex flex-col max-w-[80%]",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "px-4 py-3 rounded-xl",
            isUser
              ? "bg-primary-500 text-white rounded-br-sm"
              : "bg-secondary-100 dark:bg-neutral-800 rounded-bl-sm"
          )}
        >
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          ) : (
            <MarkdownRenderer
              content={message.content}
              className="text-sm"
            />
          )}
        </div>

        {/* Sources */}
        {message.sources && message.sources.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {message.sources.map((source) => (
              <KBSourceCard
                key={source.id}
                source={source}
                projectId={projectId}
              />
            ))}
          </div>
        )}

        <span className="text-xs text-secondary-400 dark:text-neutral-500 mt-1">
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}
