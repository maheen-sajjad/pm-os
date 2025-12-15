"use client";

import { useState, useEffect, useCallback } from "react";
import { dashboardService } from "../services";
import { Project, Task, DashboardStats } from "../types";

interface DashboardState {
  stats: DashboardStats | null;
  projects: Project[];
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
}

export function useDashboard() {
  const [state, setState] = useState<DashboardState>({
    stats: null,
    projects: [],
    tasks: [],
    isLoading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const [stats, projects, tasks] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getProjects(),
        dashboardService.getTasks(),
      ]);
      setState({ stats, projects, tasks, isLoading: false, error: null });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to load dashboard",
      }));
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    ...state,
    refetch: fetchData,
  };
}
