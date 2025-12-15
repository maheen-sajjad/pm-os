"use client";

import { useState } from "react";
import { TaskCard } from "@/molecules/TaskCard";
import { cn } from "@/utils/cn";
import type { KanbanColumnProps } from "./KanbanColumn.types";

export function KanbanColumn({
  title,
  icon,
  status,
  tasks,
  count,
  teamMembers,
  onTaskClick,
  onDrop,
  onAssigneeChanged,
}: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId && onDrop) {
      onDrop(taskId, status);
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  return (
    <div
      className={cn(
        "flex flex-col min-h-[400px] rounded-xl transition-all duration-150",
        "bg-secondary-50/50 dark:bg-neutral-900/50",
        isDragOver && [
          "bg-primary-50 dark:bg-primary-950/30",
          "ring-2 ring-primary-500/30 ring-inset",
        ]
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-secondary-400 dark:text-neutral-500">
            {icon}
          </span>
          <span className="text-sm font-medium text-secondary-700 dark:text-neutral-300">
            {title}
          </span>
        </div>
        <span className={cn(
          "px-1.5 py-0.5 text-2xs font-medium rounded",
          "bg-secondary-200/70 dark:bg-neutral-800",
          "text-secondary-500 dark:text-neutral-500"
        )}>
          {count}
        </span>
      </div>

      {/* Task List */}
      <div className="flex-1 px-2 pb-2 space-y-2 overflow-y-auto">
        {tasks.map((task) => (
          <div
            key={task.id}
            draggable
            onDragStart={(e) => handleDragStart(e, task.id)}
            className="animate-fade-in"
          >
            <TaskCard task={task} teamMembers={teamMembers} onClick={onTaskClick} onAssigneeChanged={onAssigneeChanged} />
          </div>
        ))}

        {tasks.length === 0 && (
          <div className={cn(
            "flex items-center justify-center h-20 rounded-lg",
            "border border-dashed",
            isDragOver
              ? "border-primary-300 dark:border-primary-700 bg-primary-500/5"
              : "border-secondary-200 dark:border-neutral-800"
          )}>
            <span className="text-xs text-secondary-400 dark:text-neutral-600">
              {isDragOver ? "Drop here" : "No tasks"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
