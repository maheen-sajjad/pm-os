"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/shared/utils/cn";
import { SearchBarProps } from "./SearchBar.types";

export function SearchBar({
  onSearch,
  placeholder = "Search...",
  shortcut = "K",
  className,
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === shortcut.toLowerCase()) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        inputRef.current?.blur();
        setQuery("");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [shortcut]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(query);
  };

  return (
    <form onSubmit={handleSubmit} className={cn("relative", className)}>
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg border",
          "bg-secondary-50 dark:bg-neutral-900",
          "transition-all duration-150",
          isFocused
            ? "border-primary-500 ring-2 ring-primary-500/20 dark:border-primary-400 dark:ring-primary-400/20"
            : "border-secondary-200 dark:border-neutral-700 hover:border-secondary-300 dark:hover:border-neutral-600"
        )}
      >
        <svg
          className={cn(
            "w-4 h-4 transition-colors",
            isFocused
              ? "text-primary-500 dark:text-primary-400"
              : "text-secondary-400 dark:text-neutral-500"
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={cn(
            "flex-1 bg-transparent text-sm outline-none",
            "text-secondary-900 dark:text-neutral-100",
            "placeholder:text-secondary-400 dark:placeholder:text-neutral-500"
          )}
        />
        {!isFocused && !query && (
          <div className="flex items-center gap-1">
            <span className="kbd">
              {navigator?.platform?.includes("Mac") ? "⌘" : "Ctrl"}
            </span>
            <span className="kbd">{shortcut}</span>
          </div>
        )}
      </div>
    </form>
  );
}
