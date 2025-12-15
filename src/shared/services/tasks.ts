import { api } from "./api";

export interface TaskUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

export interface TaskPR {
  id: string;
  number: number;
  title: string;
  url: string;
  status: "OPEN" | "MERGED" | "CLOSED";
  author: string;
  commitsCount: number;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "BACKLOG" | "IN_PROGRESS" | "REVIEW" | "DONE";
  category: "BACKEND" | "FRONTEND" | "DESIGN" | "QA" | "DEVOPS";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  order: number;
  createdAt: string;
  updatedAt: string;
  assignee: TaskUser | null;
  linkedPR: TaskPR | null;
  feature?: {
    id: string;
    name: string;
    projectId: string;
  };
}

export interface CreateTaskData {
  title: string;
  description?: string;
  featureId: string;
  category: "BACKEND" | "FRONTEND" | "DESIGN" | "QA" | "DEVOPS";
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  assigneeId?: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: "BACKLOG" | "IN_PROGRESS" | "REVIEW" | "DONE";
  category?: "BACKEND" | "FRONTEND" | "DESIGN" | "QA" | "DEVOPS";
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  assigneeId?: string | null;
  order?: number;
}

export const tasksService = {
  getAll: (filters?: { featureId?: string; status?: string; assigneeId?: string }) => {
    const params = new URLSearchParams();
    if (filters?.featureId) params.append("featureId", filters.featureId);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.assigneeId) params.append("assigneeId", filters.assigneeId);
    const query = params.toString() ? `?${params.toString()}` : "";
    return api.get<Task[]>(`/tasks${query}`);
  },

  getById: (id: string) => {
    return api.get<Task>(`/tasks/${id}`);
  },

  create: (data: CreateTaskData) => {
    return api.post<Task>("/tasks", data);
  },

  update: (id: string, data: UpdateTaskData) => {
    return api.patch<Task>(`/tasks/${id}`, data);
  },

  delete: (id: string) => {
    return api.delete<{ success: boolean }>(`/tasks/${id}`);
  },
};
