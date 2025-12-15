"use client";

import { Avatar } from "@/atoms/Avatar";
import { InlineTaskAssignee } from "@/molecules/InlineTaskAssignee";
import { cn } from "@/utils/cn";
import type { TaskCardProps } from "./TaskCard.types";
import type { TaskCategory } from "@/features/projects/types";

const categoryConfig: Record<
  TaskCategory,
  { label: string; color: string; bgColor: string }
> = {
  backend: { label: "Backend", color: "bg-purple-500", bgColor: "bg-purple-500/10" },
  frontend: { label: "Frontend", color: "bg-blue-500", bgColor: "bg-blue-500/10" },
  design: { label: "Design", color: "bg-pink-500", bgColor: "bg-pink-500/10" },
  qa: { label: "QA", color: "bg-emerald-500", bgColor: "bg-emerald-500/10" },
  devops: { label: "DevOps", color: "bg-orange-500", bgColor: "bg-orange-500/10" },
};

const prStatusConfig: Record<string, { color: string; bgColor: string; label: string }> = {
  open: { color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-500/10", label: "Open" },
  merged: { color: "text-purple-600 dark:text-purple-400", bgColor: "bg-purple-500/10", label: "Merged" },
  closed: { color: "text-red-600 dark:text-red-400", bgColor: "bg-red-500/10", label: "Closed" },
};

export function TaskCard({ task, teamMembers, onClick, onAssigneeChanged, draggable = true }: TaskCardProps) {
  const category = categoryConfig[task.category];
  const prStatus = task.linkedPR
    ? prStatusConfig[task.linkedPR.status] || prStatusConfig.open
    : null;

  return (
    <div
      className={cn(
        "group relative p-3 rounded-lg border",
        "bg-white dark:bg-neutral-900",
        "border-secondary-100 dark:border-neutral-800",
        "transition-all duration-150",
        "hover:border-primary-200 dark:hover:border-primary-800",
        "hover:shadow-soft",
        draggable && "cursor-grab active:cursor-grabbing"
      )}
      onClick={() => onClick?.(task)}
      draggable={draggable}
    >
      {/* Task ID and Category */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xs font-mono text-secondary-400 dark:text-neutral-500">
          {task.taskNumber != null
            ? (task.projectPrefix ? `${task.projectPrefix}-${task.taskNumber}` : `#${task.taskNumber}`)
            : `PM-${task.id.slice(-4).toUpperCase()}`}
        </span>
        <div className="flex items-center gap-1.5">
          <span className={cn("w-2 h-2 rounded-full", category.color)} />
          <span className="text-2xs text-secondary-500 dark:text-neutral-500">
            {category.label}
          </span>
        </div>
      </div>

      {/* Task Title */}
      <p className="text-sm font-medium text-secondary-900 dark:text-neutral-100 line-clamp-2 mb-3">
        {task.title}
      </p>

      {/* Bottom Row */}
      <div className="flex items-center justify-between">
        {/* PR Link */}
        {task.linkedPR && prStatus ? (
          <a
            href={task.linkedPR.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center gap-1.5 px-2 py-0.5 rounded text-2xs",
              prStatus.bgColor,
              prStatus.color,
              "hover:opacity-80 transition-opacity"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
              <path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z" />
            </svg>
            <span className="font-medium">#{task.linkedPR.number}</span>
          </a>
        ) : (
          <div />
        )}

        {/* Assignee */}
        {teamMembers ? (
          <InlineTaskAssignee
            taskId={task.id}
            currentAssignee={task.assignee ? {
              id: task.assignee.id,
              name: task.assignee.name,
              email: task.assignee.email,
              image: null,
            } : null}
            teamMembers={teamMembers.map(m => ({
              id: m.id,
              name: m.name,
              email: m.email,
              image: null,
            }))}
            onAssigneeChanged={(assignee) => onAssigneeChanged?.(task.id, assignee)}
          />
        ) : task.assignee ? (
          <Avatar name={task.assignee.name} size="xs" />
        ) : (
          <span className="text-2xs text-secondary-400 dark:text-neutral-600">
            Unassigned
          </span>
        )}
      </div>

      {/* Hover Accent Border */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-0.5 rounded-l-lg",
          "bg-transparent group-hover:bg-primary-500",
          "transition-colors duration-150"
        )}
      />
    </div>
  );
}
