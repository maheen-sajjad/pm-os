"use client";

import { useMemo } from "react";
import { Typography } from "@/atoms/Typography";
import { Button } from "@/atoms/Button";
import { Card, CardBody, CardHeader } from "@/atoms/Card";
import { Badge } from "@/atoms/Badge";
import { ExtractedTaskItem } from "@/molecules/ExtractedTaskItem";
import type { TaskExtractorProps } from "./TaskExtractor.types";
import type { TaskCategory } from "@/features/projects/types";

const categoryConfig: Record<
  TaskCategory,
  { label: string; variant: "primary" | "success" | "warning" | "info" | "danger" }
> = {
  backend: { label: "Backend", variant: "primary" },
  frontend: { label: "Frontend", variant: "info" },
  design: { label: "Design", variant: "warning" },
  qa: { label: "QA", variant: "success" },
  devops: { label: "DevOps", variant: "danger" },
};

export function TaskExtractor({
  featureName,
  taskGroups,
  onTaskToggle,
  onTaskEdit,
  onAddTask,
  onSelectAll,
  onDeselectAll,
  onCreateBoard,
  onBack,
  isLoading = false,
}: TaskExtractorProps) {
  const stats = useMemo(() => {
    let total = 0;
    let selected = 0;

    taskGroups.forEach((group) => {
      total += group.tasks.length;
      selected += group.tasks.filter((t) => t.selected).length;
    });

    return { total, selected };
  }, [taskGroups]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-secondary-500 hover:text-secondary-700 mb-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
          <Typography variant="h2">Extracted Tasks</Typography>
          <p className="text-secondary-500 mt-1">
            Review and customize the tasks for{" "}
            <span className="font-medium text-secondary-700">{featureName}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-secondary-500">
            {stats.selected} of {stats.total} selected
          </span>
          <Button variant="ghost" size="sm" onClick={onSelectAll}>
            Select All
          </Button>
          <Button variant="ghost" size="sm" onClick={onDeselectAll}>
            Deselect All
          </Button>
        </div>
      </div>

      {/* AI Message */}
      <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-100 rounded-lg">
        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
          <svg
            className="w-5 h-5 text-primary-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
        <div>
          <p className="text-sm text-secondary-700">
            I found <span className="font-semibold">{stats.total} tasks</span> in
            your feature doc. Double-click any task to edit it, or use the
            checkboxes to exclude tasks you don&apos;t need.
          </p>
        </div>
      </div>

      {/* Task Groups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {taskGroups.map((group) => {
          const config = categoryConfig[group.category];
          return (
            <Card key={group.category} variant="default" padding="none">
              <CardHeader className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <Badge variant={config.variant}>{config.label}</Badge>
                  <span className="text-sm text-secondary-500">
                    {group.tasks.filter((t) => t.selected).length} /{" "}
                    {group.tasks.length}
                  </span>
                </div>
                <button
                  onClick={() => onAddTask(group.category)}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  + Add
                </button>
              </CardHeader>
              <CardBody className="px-2 py-2 max-h-64 overflow-y-auto">
                {group.tasks.map((task) => (
                  <ExtractedTaskItem
                    key={task.id}
                    task={task}
                    onToggle={onTaskToggle}
                    onEdit={onTaskEdit}
                  />
                ))}
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-secondary-100">
        <Button variant="outline" onClick={onBack}>
          Edit Feature Doc
        </Button>
        <Button
          onClick={onCreateBoard}
          disabled={stats.selected === 0 || isLoading}
          isLoading={isLoading}
        >
          Create Board ({stats.selected} tasks)
        </Button>
      </div>
    </div>
  );
}
