"use client";

import { useState, useRef, useEffect } from "react";
import { Avatar } from "@/atoms/Avatar";
import { cn } from "@/utils/cn";
import type { InlineTaskAssigneeProps, TeamMember } from "./InlineTaskAssignee.types";

export function InlineTaskAssignee({
  taskId,
  currentAssignee,
  teamMembers,
  onAssigneeChanged,
  size = "xs",
}: InlineTaskAssigneeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleSelectMember = async (member: TeamMember | null) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeId: member?.id || null }),
      });

      if (res.ok) {
        onAssigneeChanged?.(member);
        setIsOpen(false);
      } else {
        const error = await res.json();
        console.error("Failed to update assignee:", error);
      }
    } catch (error) {
      console.error("Failed to update assignee:", error);
    } finally {
      setUpdating(false);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleClick}
        disabled={updating}
        className={cn(
          "flex items-center gap-1 rounded transition-all",
          "hover:ring-2 hover:ring-primary-500/30",
          updating && "opacity-50"
        )}
        title={currentAssignee ? `Assigned to ${currentAssignee.name || currentAssignee.email}` : "Unassigned - click to assign"}
      >
        {currentAssignee ? (
          <Avatar name={currentAssignee.name || currentAssignee.email} src={currentAssignee.image || undefined} size={size} />
        ) : (
          <span className="text-2xs text-primary-500 hover:text-primary-600 underline decoration-dashed">
            {updating ? "..." : "Assign"}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 mb-1 w-56 bg-white dark:bg-neutral-800 border border-secondary-200 dark:border-neutral-700 rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="max-h-48 overflow-y-auto">
            {/* Option to unassign */}
            {currentAssignee && (
              <button
                onClick={() => handleSelectMember(null)}
                disabled={updating}
                className="w-full px-3 py-2 text-left text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border-b border-secondary-100 dark:border-neutral-700"
              >
                Unassign
              </button>
            )}

            {/* Team member list */}
            {teamMembers.map((member) => (
              <button
                key={member.id}
                onClick={() => handleSelectMember(member)}
                disabled={updating || member.id === currentAssignee?.id}
                className={cn(
                  "w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-secondary-50 dark:hover:bg-neutral-700 transition-colors",
                  member.id === currentAssignee?.id && "bg-secondary-50 dark:bg-neutral-700"
                )}
              >
                <Avatar
                  name={member.name || member.email}
                  src={member.image || undefined}
                  size="xs"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-secondary-900 dark:text-neutral-100 truncate">
                    {member.name || member.email}
                  </p>
                </div>
                {member.id === currentAssignee?.id && (
                  <svg className="w-3 h-3 text-primary-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}

            {teamMembers.length === 0 && (
              <div className="px-3 py-2 text-xs text-secondary-500 dark:text-neutral-400">
                No team members available
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
