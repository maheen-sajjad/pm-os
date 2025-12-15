export interface KBChatPanelProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  projectName?: string;
}
