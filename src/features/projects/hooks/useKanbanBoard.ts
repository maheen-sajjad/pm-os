"use client";

import { useState, useCallback } from "react";
import type { Task, TaskStatus, ExtractedTaskGroup } from "../types";

interface UseKanbanBoardReturn {
  tasks: Task[];
  moveTask: (taskId: string, newStatus: TaskStatus) => void;
  initializeFromExtracted: (groups: ExtractedTaskGroup[]) => void;
}

export function useKanbanBoard(): UseKanbanBoardReturn {
  const [tasks, setTasks] = useState<Task[]>([]);

  const moveTask = useCallback((taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, status: newStatus, updatedAt: new Date().toISOString() }
          : task
      )
    );
  }, []);

  const initializeFromExtracted = useCallback(
    (groups: ExtractedTaskGroup[]) => {
      const newTasks: Task[] = [];

      groups.forEach((group) => {
        group.tasks
          .filter((t) => t.selected)
          .forEach((extractedTask) => {
            newTasks.push({
              id: extractedTask.id,
              title: extractedTask.title,
              status: "backlog",
              category: group.category,
              priority: "medium",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          });
      });

      setTasks(newTasks);
    },
    []
  );

  return {
    tasks,
    moveTask,
    initializeFromExtracted,
  };
}
