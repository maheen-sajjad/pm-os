import type { TeamMember, GitHubRepo } from "@/features/projects/types";

export interface ProjectSettingsFormProps {
  teamMembers: TeamMember[];
  repos: GitHubRepo[];
  selectedLead?: string;
  selectedRepo?: string;
  onLeadChange: (leadId: string) => void;
  onRepoChange: (repoId: string) => void;
  onSubmit: () => void;
  isLoading?: boolean;
}
