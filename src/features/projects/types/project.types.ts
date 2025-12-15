export type TaskStatus = "backlog" | "in_progress" | "review" | "done";

export type TaskCategory = "backend" | "frontend" | "design" | "qa" | "devops";

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  taskNumber?: number; // Sequential number within project (nullable for legacy data)
  projectPrefix?: string; // For display: "UD-1", "AG-2"
  title: string;
  description?: string;
  status: TaskStatus;
  category: TaskCategory;
  priority: TaskPriority;
  assignee?: TeamMember;
  linkedPR?: PullRequest;
  createdAt: string;
  updatedAt: string;
}

export interface PullRequest {
  id: string;
  number: number;
  title: string;
  url: string;
  status: "open" | "merged" | "closed";
  author: string;
  commitsCount: number;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: "admin" | "lead" | "member";
}

export interface GitHubRepo {
  id: string;
  name: string;
  fullName: string;
  url: string;
  isPrivate: boolean;
}

export interface Feature {
  id: string;
  name: string;
  description?: string;
  tasks: Task[];
  progress: number;
  createdAt: string;
}

export type ProjectStatus = "planning" | "active" | "paused" | "completed";

export interface Project {
  id: string;
  name: string;
  prefix?: string; // Short prefix for task IDs, e.g., "UD" for "User Dashboard" (nullable for legacy data)
  description?: string;
  status: ProjectStatus;
  lead?: TeamMember;
  repo?: GitHubRepo;
  features: Feature[];
  totalTasks: number;
  completedTasks: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExtractedTask {
  id: string;
  title: string;
  selected: boolean;
}

export interface ExtractedTaskGroup {
  category: TaskCategory;
  tasks: ExtractedTask[];
}
