export interface LinkedRepo {
  id: string;
  name: string;
  fullName: string;
  url: string;
}

export interface RepoSelectorProps {
  projectId: string;
  linkedRepo?: LinkedRepo | null;
  onRepoLinked?: () => void;
  onRepoUnlinked?: () => void;
}
