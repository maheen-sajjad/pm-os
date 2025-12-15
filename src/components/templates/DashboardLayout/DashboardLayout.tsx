"use client";

import { Sidebar } from "@/organisms/Sidebar";
import { Header } from "@/organisms/Header";
import { cn } from "@/shared/utils/cn";
import { DashboardLayoutProps } from "./DashboardLayout.types";
import { dashboardNavigation } from "./DashboardLayout.config";

export function DashboardLayout({
  children,
  title,
  className,
}: DashboardLayoutProps) {
  return (
    <div className={cn(
      "flex h-screen",
      "bg-white dark:bg-neutral-950",
      "text-secondary-900 dark:text-neutral-100"
    )}>
      <Sidebar navigation={dashboardNavigation} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header title={title} />
        <main className={cn(
          "flex-1 overflow-auto p-6",
          "bg-secondary-50/50 dark:bg-neutral-950",
          className
        )}>
          {children}
        </main>
      </div>
    </div>
  );
}
