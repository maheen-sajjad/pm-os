"use client";

import { useMemo } from "react";
import { Button } from "@/atoms/Button";
import { KanbanColumn } from "@/organisms/KanbanColumn";
import { cn } from "@/utils/cn";
import type { KanbanBoardProps } from "./KanbanBoard.types";
import type { TaskStatus } from "@/features/projects/types";

const COLUMNS: { status: TaskStatus; title: string; icon: string }[] = [
  { status: "backlog", title: "Backlog", icon: "○" },
  { status: "in_progress", title: "In Progress", icon: "◐" },
  { status: "review", title: "Review", icon: "◑" },
  { status: "done", title: "Done", icon: "●" },
];

export function KanbanBoard({
  projectName,
  tasks,
  repo,
  teamMembers,
  onTaskClick,
  onTaskMove,
  onAssigneeChanged,
  onAddTask,
}: KanbanBoardProps) {
  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, typeof tasks> = {
      backlog: [],
      in_progress: [],
      review: [],
      done: [],
    };

    tasks.forEach((task) => {
      grouped[task.status].push(task);
    });

    return grouped;
  }, [tasks]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-secondary-900 dark:text-neutral-100">
            {projectName}
          </h2>
          {repo && (
            <div className="flex items-center gap-2">
              <a
                href={`https://github.com/${repo.fullName}`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs",
                  "bg-secondary-100 dark:bg-neutral-800",
                  "text-secondary-600 dark:text-neutral-400",
                  "hover:bg-secondary-200 dark:hover:bg-neutral-700",
                  "transition-colors"
                )}
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                </svg>
                {repo.fullName}
              </a>
              <span className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-medium",
                "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              )}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-soft" />
                Connected
              </span>
            </div>
          )}
        </div>

        <Button onClick={onAddTask} size="sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Task
        </Button>
      </div>

      {/* Tip */}
      <div className={cn(
        "mb-4 px-3 py-2 rounded-lg",
        "bg-primary-500/5 border border-primary-500/10",
        "dark:bg-primary-500/10 dark:border-primary-500/20"
      )}>
        <p className="text-xs text-primary-700 dark:text-primary-300">
          <span className="font-medium">Pro tip:</span> Name branches{" "}
          <code className="px-1 py-0.5 bg-primary-500/10 rounded text-2xs font-mono">
            PMOS-{"{task-id}"}-description
          </code>{" "}
          to auto-link PRs
        </p>
      </div>

      {/* Board */}
      <div className="flex-1 grid grid-cols-4 gap-4 min-h-0">
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.status}
            title={column.title}
            icon={column.icon}
            status={column.status}
            tasks={tasksByStatus[column.status]}
            count={tasksByStatus[column.status].length}
            teamMembers={teamMembers}
            onTaskClick={onTaskClick}
            onDrop={onTaskMove}
            onAssigneeChanged={onAssigneeChanged}
          />
        ))}
      </div>
    </div>
  );
}
