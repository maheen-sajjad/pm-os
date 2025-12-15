"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/utils/cn";
import { NavItemProps } from "./NavItem.types";

export function NavItem({
  href,
  icon: Icon,
  label,
  shortcut,
  className,
}: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href as any}
      className={cn(
        "group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium",
        "transition-all duration-150",
        isActive
          ? [
              "bg-primary-500/10 text-primary-600",
              "dark:bg-primary-500/15 dark:text-primary-400",
            ]
          : [
              "text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900",
              "dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
            ],
        className
      )}
    >
      {Icon && (
        <Icon
          className={cn(
            "h-4 w-4 transition-colors",
            isActive
              ? "text-primary-500 dark:text-primary-400"
              : "text-secondary-400 group-hover:text-secondary-600 dark:text-neutral-500 dark:group-hover:text-neutral-300"
          )}
        />
      )}
      <span className="flex-1">{label}</span>
      {shortcut && (
        <span className="kbd opacity-0 group-hover:opacity-100 transition-opacity">
          {shortcut}
        </span>
      )}
    </Link>
  );
}
