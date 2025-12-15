export interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  shortcut?: string;
  className?: string;
}
