import type { Task, TaskStatus, GitHubRepo, TeamMember } from "@/features/projects/types";
import type { TeamMember as AssigneeTeamMember } from "@/molecules/InlineTaskAssignee";

export interface KanbanBoardProps {
  projectName: string;
  tasks: Task[];
  repo?: GitHubRepo;
  teamMembers?: TeamMember[];
  onTaskClick?: (task: Task) => void;
  onTaskMove?: (taskId: string, newStatus: TaskStatus) => void;
  onAssigneeChanged?: (taskId: string, assignee: AssigneeTeamMember | null) => void;
  onAddTask?: () => void;
}
