"use client";

import { NavItem } from "@/molecules/NavItem";
import { cn } from "@/shared/utils/cn";
import { SidebarProps } from "./Sidebar.types";

export function Sidebar({ navigation, className }: SidebarProps) {
  return (
    <aside
      className={cn(
        "flex flex-col w-60 h-screen",
        "bg-secondary-50 dark:bg-neutral-900",
        "border-r border-secondary-100 dark:border-neutral-800",
        className
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-14 px-4 border-b border-secondary-100 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <span className="font-semibold text-secondary-900 dark:text-neutral-100">
            PM-OS
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navigation.map((item, index) => (
          <NavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            shortcut={item.shortcut}
          />
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="p-3 border-t border-secondary-100 dark:border-neutral-800">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-neutral-800 cursor-pointer transition-colors">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-medium">
            U
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-secondary-900 dark:text-neutral-100 truncate">
              User
            </p>
            <p className="text-xs text-secondary-500 dark:text-neutral-500 truncate">
              user@example.com
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
