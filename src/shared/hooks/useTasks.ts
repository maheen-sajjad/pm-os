"use client";

import { useState, useEffect, useCallback } from "react";
import { tasksService, Task, CreateTaskData, UpdateTaskData } from "@/shared/services";

interface UseTasksFilters {
  featureId?: string;
  status?: string;
  assigneeId?: string;
}

export function useTasks(filters?: UseTasksFilters) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await tasksService.getAll(filters);
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tasks");
    } finally {
      setIsLoading(false);
    }
  }, [filters?.featureId, filters?.status, filters?.assigneeId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = async (data: CreateTaskData) => {
    const task = await tasksService.create(data);
    setTasks((prev) => [...prev, task]);
    return task;
  };

  const updateTask = async (id: string, data: UpdateTaskData) => {
    const task = await tasksService.update(id, data);
    setTasks((prev) => prev.map((t) => (t.id === id ? task : t)));
    return task;
  };

  const deleteTask = async (id: string) => {
    await tasksService.delete(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // Group tasks by status for kanban board
  const tasksByStatus = {
    BACKLOG: tasks.filter((t) => t.status === "BACKLOG"),
    IN_PROGRESS: tasks.filter((t) => t.status === "IN_PROGRESS"),
    REVIEW: tasks.filter((t) => t.status === "REVIEW"),
    DONE: tasks.filter((t) => t.status === "DONE"),
  };

  return {
    tasks,
    tasksByStatus,
    isLoading,
    error,
    refresh: fetchTasks,
    createTask,
    updateTask,
    deleteTask,
  };
}

export function useTask(id: string | null) {
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTask = useCallback(async () => {
    if (!id) {
      setTask(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await tasksService.getById(id);
      setTask(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch task");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  const updateTask = async (data: UpdateTaskData) => {
    if (!id) return null;
    const updated = await tasksService.update(id, data);
    setTask(updated);
    return updated;
  };

  return {
    task,
    isLoading,
    error,
    refresh: fetchTask,
    updateTask,
  };
}
