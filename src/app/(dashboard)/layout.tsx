"use client";

import { DashboardLayout } from "@/templates/DashboardLayout";
import { usePathname } from "next/navigation";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/projects": "Projects",
  "/dashboard/tasks": "Tasks",
  "/dashboard/team": "Team",
  "/dashboard/settings": "Settings",
};

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const title = pageTitles[pathname] || "Dashboard";

  return <DashboardLayout title={title}>{children}</DashboardLayout>;
}
