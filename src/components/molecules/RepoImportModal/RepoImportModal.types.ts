import type { ImportResult } from "@/shared/services/github";

export interface RepoImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: (result: ImportResult) => void;
}
