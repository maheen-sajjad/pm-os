import { SearchBar } from "@/molecules/SearchBar";
import { cn } from "@/shared/utils/cn";
import { HeaderProps } from "./Header.types";

export function Header({ title, showSearch = true, className }: HeaderProps) {
  return (
    <header
      className={cn(
        "flex items-center justify-between h-14 px-6",
        "border-b border-secondary-100 dark:border-neutral-800",
        "bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md",
        "sticky top-0 z-10",
        className
      )}
    >
      <h1 className="text-lg font-semibold text-secondary-900 dark:text-neutral-100">
        {title}
      </h1>
      {showSearch && (
        <SearchBar
          className="w-72"
          placeholder="Search tasks..."
          onSearch={(query) => console.log("Search:", query)}
        />
      )}
    </header>
  );
}
