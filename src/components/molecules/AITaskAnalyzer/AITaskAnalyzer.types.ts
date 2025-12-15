export interface TaskSuggestion {
  taskId: string;
  taskTitle: string;
  currentStatus: "BACKLOG" | "IN_PROGRESS" | "REVIEW" | "DONE";
  suggestedStatus: "BACKLOG" | "IN_PROGRESS" | "REVIEW" | "DONE";
  confidence: number;
  reason: string;
  evidence: {
    prStatus?: string;
    codeFiles: string[];
  };
  applied: boolean;
}

export interface AnalysisResult {
  analyzed: number;
  suggestions: TaskSuggestion[];
  autoApplied: number;
  message?: string;
}

export interface AnalysisAvailability {
  available: boolean;
  isIndexed: boolean;
  tasksToAnalyze: number;
  indexInfo: {
    lastIndexedAt: string;
    totalFiles: number;
    totalChunks: number;
  } | null;
}

export interface AITaskAnalyzerProps {
  projectId: string;
  onTasksUpdated?: () => void;
}
