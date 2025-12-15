export interface TeamMember {
  id: string;
  name: string | null;
  email: string;
  image?: string | null;
  role?: "admin" | "lead" | "member";
}

export interface InlineTaskAssigneeProps {
  taskId: string;
  currentAssignee: TeamMember | null;
  teamMembers: TeamMember[];
  onAssigneeChanged?: (assignee: TeamMember | null) => void;
  size?: "xs" | "sm";
}
