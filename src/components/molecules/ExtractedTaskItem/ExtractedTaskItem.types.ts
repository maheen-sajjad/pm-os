import type { ExtractedTask } from "@/features/projects/types";

export interface ExtractedTaskItemProps {
  task: ExtractedTask;
  onToggle: (taskId: string) => void;
  onEdit?: (taskId: string, newTitle: string) => void;
}
