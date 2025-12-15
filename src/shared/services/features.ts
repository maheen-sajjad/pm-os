import { api } from "./api";
import type { Task } from "./tasks";

export interface Feature {
  id: string;
  name: string;
  description: string | null;
  docContent: string | null;
  progress: number;
  createdAt: string;
  updatedAt: string;
  tasks: Task[];
}

export interface CreateFeatureData {
  name: string;
  description?: string;
  docContent?: string;
  tasks?: {
    title: string;
    category: "BACKEND" | "FRONTEND" | "DESIGN" | "QA" | "DEVOPS";
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  }[];
}

export const featuresService = {
  getByProject: (projectId: string) => {
    return api.get<Feature[]>(`/projects/${projectId}/features`);
  },

  create: (projectId: string, data: CreateFeatureData) => {
    return api.post<Feature>(`/projects/${projectId}/features`, data);
  },
};
