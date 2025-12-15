import { api } from "./api";

export interface ProjectUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role?: string;
}

export interface ProjectRepo {
  id: string;
  name: string;
  fullName: string;
  url: string;
}

export interface ProjectFeature {
  id: string;
  name: string;
  progress: number;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: "PLANNING" | "ACTIVE" | "PAUSED" | "COMPLETED";
  totalTasks: number;
  completedTasks: number;
  createdAt: string;
  updatedAt: string;
  lead: ProjectUser | null;
  repo: ProjectRepo | null;
  features: ProjectFeature[];
}

export interface CreateProjectData {
  name: string;
  description?: string;
  leadId?: string;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  status?: "PLANNING" | "ACTIVE" | "PAUSED" | "COMPLETED";
  leadId?: string | null;
}

export const projectsService = {
  getAll: (status?: string) => {
    const query = status ? `?status=${status}` : "";
    return api.get<Project[]>(`/projects${query}`);
  },

  getById: (id: string) => {
    return api.get<Project>(`/projects/${id}`);
  },

  create: (data: CreateProjectData) => {
    return api.post<Project>("/projects", data);
  },

  update: (id: string, data: UpdateProjectData) => {
    return api.patch<Project>(`/projects/${id}`, data);
  },

  delete: (id: string) => {
    return api.delete<{ success: boolean }>(`/projects/${id}`);
  },
};
