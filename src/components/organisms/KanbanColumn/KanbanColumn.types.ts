import type { Task, TaskStatus, TeamMember } from "@/features/projects/types";
import type { TeamMember as AssigneeTeamMember } from "@/molecules/InlineTaskAssignee";

export interface KanbanColumnProps {
  title: string;
  icon?: string;
  status: TaskStatus;
  tasks: Task[];
  count: number;
  teamMembers?: TeamMember[];
  onTaskClick?: (task: Task) => void;
  onDrop?: (taskId: string, newStatus: TaskStatus) => void;
  onAssigneeChanged?: (taskId: string, assignee: AssigneeTeamMember | null) => void;
}
