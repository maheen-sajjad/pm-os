import { Project, Task, DashboardStats } from "../types";

const API_BASE = "/api/dashboard";

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const response = await fetch(`${API_BASE}/stats`);
    if (!response.ok) throw new Error("Failed to fetch stats");
    return response.json();
  },

  async getProjects(): Promise<Project[]> {
    const response = await fetch(`${API_BASE}/projects`);
    if (!response.ok) throw new Error("Failed to fetch projects");
    return response.json();
  },

  async getTasks(projectId?: string): Promise<Task[]> {
    const url = projectId
      ? `${API_BASE}/tasks?projectId=${projectId}`
      : `${API_BASE}/tasks`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch tasks");
    return response.json();
  },

  async createProject(data: Omit<Project, "id" | "createdAt" | "updatedAt">): Promise<Project> {
    const response = await fetch(`${API_BASE}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create project");
    return response.json();
  },

  async createTask(data: Omit<Task, "id" | "createdAt">): Promise<Task> {
    const response = await fetch(`${API_BASE}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create task");
    return response.json();
  },
};
