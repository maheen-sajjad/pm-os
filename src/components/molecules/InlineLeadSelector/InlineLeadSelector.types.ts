export interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

export interface InlineLeadSelectorProps {
  projectId: string;
  currentLead: User | null;
  onLeadChanged?: (lead: User | null) => void;
}
