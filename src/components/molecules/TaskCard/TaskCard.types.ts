import type { Task, TeamMember } from "@/features/projects/types";
import type { TeamMember as AssigneeTeamMember } from "@/molecules/InlineTaskAssignee";

export interface TaskCardProps {
  task: Task;
  teamMembers?: TeamMember[];
  onClick?: (task: Task) => void;
  onAssigneeChanged?: (taskId: string, assignee: AssigneeTeamMember | null) => void;
  draggable?: boolean;
}
