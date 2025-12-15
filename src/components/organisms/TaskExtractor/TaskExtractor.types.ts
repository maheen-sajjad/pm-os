import type { ExtractedTaskGroup, TaskCategory } from "@/features/projects/types";

export interface TaskExtractorProps {
  featureName: string;
  taskGroups: ExtractedTaskGroup[];
  onTaskToggle: (taskId: string) => void;
  onTaskEdit: (taskId: string, newTitle: string) => void;
  onAddTask: (category: TaskCategory) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onCreateBoard: () => void;
  onBack: () => void;
  isLoading?: boolean;
}
