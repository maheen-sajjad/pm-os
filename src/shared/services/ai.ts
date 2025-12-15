import { api } from "./api";

export type TaskCategory = "BACKEND" | "FRONTEND" | "DESIGN" | "QA" | "DEVOPS";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface ExtractedTask {
  title: string;
  category: TaskCategory;
  priority: TaskPriority;
}

export interface ExtractionResult {
  tasks: ExtractedTask[];
  summary?: string;
}

export interface ExtractTasksParams {
  featureName: string;
  documentContent: string;
  model?: string;
}

export const aiService = {
  extractTasks: (params: ExtractTasksParams) => {
    return api.post<ExtractionResult>("/ai/extract-tasks", params);
  },
};
