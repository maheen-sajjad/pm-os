"use client";

import { useState, useEffect, useCallback } from "react";
import {
  projectsService,
  Project,
  CreateProjectData,
  UpdateProjectData,
} from "@/shared/services";

export function useProjects(status?: string) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await projectsService.getAll(status);
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch projects");
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = async (data: CreateProjectData) => {
    const project = await projectsService.create(data);
    setProjects((prev) => [project, ...prev]);
    return project;
  };

  const updateProject = async (id: string, data: UpdateProjectData) => {
    const project = await projectsService.update(id, data);
    setProjects((prev) => prev.map((p) => (p.id === id ? project : p)));
    return project;
  };

  const deleteProject = async (id: string) => {
    await projectsService.delete(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  return {
    projects,
    isLoading,
    error,
    refresh: fetchProjects,
    createProject,
    updateProject,
    deleteProject,
  };
}

export function useProject(id: string | null) {
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProject = useCallback(async () => {
    if (!id) {
      setProject(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await projectsService.getById(id);
      setProject(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch project");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const updateProject = async (data: UpdateProjectData) => {
    if (!id) return null;
    const updated = await projectsService.update(id, data);
    setProject(updated);
    return updated;
  };

  return {
    project,
    isLoading,
    error,
    refresh: fetchProject,
    updateProject,
  };
}
