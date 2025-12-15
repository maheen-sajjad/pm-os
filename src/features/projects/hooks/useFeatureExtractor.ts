"use client";

import { useState, useCallback } from "react";
import { aiService } from "@/shared/services";
import type { ExtractedTaskGroup, TaskCategory } from "../types";

interface UseFeatureExtractorReturn {
  featureName: string;
  setFeatureName: (name: string) => void;
  featureDoc: string;
  setFeatureDoc: (doc: string) => void;
  taskGroups: ExtractedTaskGroup[];
  isExtracting: boolean;
  error: string | null;
  summary: string | null;
  extractTasks: () => Promise<void>;
  toggleTask: (taskId: string) => void;
  editTask: (taskId: string, newTitle: string) => void;
  addTask: (category: TaskCategory) => void;
  selectAll: () => void;
  deselectAll: () => void;
  reset: () => void;
}

// Map API categories to UI categories
const categoryMap: Record<string, TaskCategory> = {
  BACKEND: "backend",
  FRONTEND: "frontend",
  DESIGN: "design",
  QA: "qa",
  DEVOPS: "devops",
};

export function useFeatureExtractor(): UseFeatureExtractorReturn {
  const [featureName, setFeatureName] = useState("");
  const [featureDoc, setFeatureDoc] = useState("");
  const [taskGroups, setTaskGroups] = useState<ExtractedTaskGroup[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);

  const extractTasks = useCallback(async () => {
    if (!featureName.trim() || !featureDoc.trim()) {
      setError("Please provide both feature name and document content");
      return;
    }

    setIsExtracting(true);
    setError(null);

    try {
      const result = await aiService.extractTasks({
        featureName,
        documentContent: featureDoc,
      });

      // Group tasks by category
      const groupedTasks: Record<TaskCategory, ExtractedTaskGroup> = {
        backend: { category: "backend", tasks: [] },
        frontend: { category: "frontend", tasks: [] },
        design: { category: "design", tasks: [] },
        qa: { category: "qa", tasks: [] },
        devops: { category: "devops", tasks: [] },
      };

      result.tasks.forEach((task, index) => {
        const category = categoryMap[task.category] || "backend";
        groupedTasks[category].tasks.push({
          id: `${category}-${Date.now()}-${index}`,
          title: task.title,
          selected: true,
        });
      });

      // Filter out empty groups and set state
      const nonEmptyGroups = Object.values(groupedTasks).filter(
        (group) => group.tasks.length > 0
      );

      setTaskGroups(nonEmptyGroups);
      setSummary(result.summary || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to extract tasks");
      setTaskGroups([]);
    } finally {
      setIsExtracting(false);
    }
  }, [featureName, featureDoc]);

  const toggleTask = useCallback((taskId: string) => {
    setTaskGroups((prev) =>
      prev.map((group) => ({
        ...group,
        tasks: group.tasks.map((task) =>
          task.id === taskId ? { ...task, selected: !task.selected } : task
        ),
      }))
    );
  }, []);

  const editTask = useCallback((taskId: string, newTitle: string) => {
    setTaskGroups((prev) =>
      prev.map((group) => ({
        ...group,
        tasks: group.tasks.map((task) =>
          task.id === taskId ? { ...task, title: newTitle } : task
        ),
      }))
    );
  }, []);

  const addTask = useCallback((category: TaskCategory) => {
    const newTask = {
      id: `${category}-${Date.now()}`,
      title: "New task",
      selected: true,
    };

    setTaskGroups((prev) => {
      const hasCategory = prev.some((g) => g.category === category);
      if (hasCategory) {
        return prev.map((group) =>
          group.category === category
            ? { ...group, tasks: [...group.tasks, newTask] }
            : group
        );
      }
      // Add new category group if it doesn't exist
      return [...prev, { category, tasks: [newTask] }];
    });
  }, []);

  const selectAll = useCallback(() => {
    setTaskGroups((prev) =>
      prev.map((group) => ({
        ...group,
        tasks: group.tasks.map((task) => ({ ...task, selected: true })),
      }))
    );
  }, []);

  const deselectAll = useCallback(() => {
    setTaskGroups((prev) =>
      prev.map((group) => ({
        ...group,
        tasks: group.tasks.map((task) => ({ ...task, selected: false })),
      }))
    );
  }, []);

  const reset = useCallback(() => {
    setFeatureName("");
    setFeatureDoc("");
    setTaskGroups([]);
    setError(null);
    setSummary(null);
  }, []);

  return {
    featureName,
    setFeatureName,
    featureDoc,
    setFeatureDoc,
    taskGroups,
    isExtracting,
    error,
    summary,
    extractTasks,
    toggleTask,
    editTask,
    addTask,
    selectAll,
    deselectAll,
    reset,
  };
}
