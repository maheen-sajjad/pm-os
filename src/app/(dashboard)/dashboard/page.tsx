"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Typography } from "@/atoms/Typography";
import { Badge } from "@/atoms/Badge";
import { Avatar } from "@/atoms/Avatar";
import { StatsCard } from "@/features/dashboard";
import { InlineLeadSelector } from "@/molecules/InlineLeadSelector";
import type { User } from "@/molecules/InlineLeadSelector";

interface ProjectApproval {
  type: "DEV" | "QA" | "UI" | "UAT";
  approved: boolean;
  approvedAt: string | null;
  approvedBy: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
}

interface Project {
  id: string;
  name: string;
  status: "PLANNING" | "ACTIVE" | "PAUSED" | "PENDING_APPROVAL" | "COMPLETED";
  totalTasks: number;
  completedTasks: number;
  updatedAt: string;
  lead: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
  approvedBy: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
  approvedAt: string | null;
  approvals: ProjectApproval[];
}

interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  pendingApproval: number;
  completedProjects: number;
  totalUsers: number;
}

const statusConfig: Record<string, { label: string; variant: "success" | "warning" | "default" | "info"; color: string }> = {
  PLANNING: { label: "Planning", variant: "warning", color: "bg-amber-500" },
  ACTIVE: { label: "Active", variant: "success", color: "bg-green-500" },
  PAUSED: { label: "Paused", variant: "default", color: "bg-gray-500" },
  PENDING_APPROVAL: { label: "Pending Approval", variant: "info", color: "bg-blue-500" },
  COMPLETED: { label: "Completed", variant: "success", color: "bg-emerald-500" },
};

const approvalTypes = ["DEV", "QA", "UI", "UAT"] as const;

function ApprovalBadges({ approvals }: { approvals: ProjectApproval[] }) {
  const approvalMap = new Map(approvals.map((a) => [a.type, a]));

  return (
    <div className="flex items-center gap-1">
      {approvalTypes.map((type) => {
        const approval = approvalMap.get(type);
        const isApproved = approval?.approved ?? false;

        return (
          <div
            key={type}
            className={`
              relative group/badge px-1.5 py-0.5 rounded text-[10px] font-medium cursor-default
              ${isApproved
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-secondary-100 text-secondary-400 dark:bg-neutral-800 dark:text-neutral-500"
              }
            `}
            title={isApproved && approval?.approvedBy?.name
              ? `Approved by ${approval.approvedBy.name}`
              : `${type} - Not approved`
            }
          >
            {isApproved && (
              <svg className="inline w-2.5 h-2.5 mr-0.5 -mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
            {type}
          </div>
        );
      })}
    </div>
  );
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    activeProjects: 0,
    pendingApproval: 0,
    completedProjects: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [projectsRes, usersRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/users"),
      ]);

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(projectsData);

        // Calculate stats
        const totalProjects = projectsData.length;
        const activeProjects = projectsData.filter((p: Project) => p.status === "ACTIVE").length;
        const pendingApproval = projectsData.filter((p: Project) => p.status === "PENDING_APPROVAL").length;
        const completedProjects = projectsData.filter((p: Project) => p.status === "COMPLETED").length;

        let totalUsers = 0;
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          totalUsers = usersData.length;
        }

        setStats({
          totalProjects,
          activeProjects,
          pendingApproval,
          completedProjects,
          totalUsers,
        });
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleLeadChanged = (projectId: string, newLead: User | null) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId ? { ...p, lead: newLead } : p
      )
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Projects" value={stats.totalProjects} />
        <StatsCard title="Active" value={stats.activeProjects} />
        <StatsCard title="Pending Approval" value={stats.pendingApproval} />
        <StatsCard title="Team Members" value={stats.totalUsers} />
      </div>

      {/* Projects Overview */}
      <div className="group relative p-6 rounded-xl bg-white dark:bg-neutral-900 border border-secondary-200 dark:border-neutral-800 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <Typography variant="h4" className="text-secondary-900 dark:text-neutral-100">
            All Projects
          </Typography>
          <Link href="/projects" className="text-sm text-primary-500 hover:text-primary-600">
            View all
          </Link>
        </div>

        {projects.length === 0 ? (
          <p className="text-secondary-500 dark:text-neutral-400 text-center py-8">
            No projects yet. Create your first project!
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-secondary-500 dark:text-neutral-400 border-b border-secondary-100 dark:border-neutral-800">
                  <th className="pb-3 font-medium">Project</th>
                  <th className="pb-3 font-medium">Lead</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Approvals</th>
                  <th className="pb-3 font-medium">Progress</th>
                  <th className="pb-3 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100 dark:divide-neutral-800">
                {projects.map((project) => {
                  const config = statusConfig[project.status];
                  const progress = project.totalTasks > 0
                    ? Math.round((project.completedTasks / project.totalTasks) * 100)
                    : 0;

                  return (
                    <tr key={project.id} className="group/row">
                      <td className="py-3">
                        <Link
                          href={`/projects/${project.id}`}
                          className="font-medium text-secondary-900 dark:text-neutral-100 hover:text-primary-500"
                        >
                          {project.name}
                        </Link>
                      </td>
                      <td className="py-3">
                        <InlineLeadSelector
                          projectId={project.id}
                          currentLead={project.lead}
                          onLeadChanged={(lead) => handleLeadChanged(project.id, lead)}
                        />
                      </td>
                      <td className="py-3">
                        <Badge variant={config.variant} size="sm">
                          {config.label}
                        </Badge>
                        {project.status === "COMPLETED" && project.approvedBy && (
                          <div className="mt-1 flex items-center gap-1 text-xs text-secondary-500 dark:text-neutral-400">
                            <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>by {project.approvedBy.name}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3">
                        <ApprovalBadges approvals={project.approvals || []} />
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-1.5 bg-secondary-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary-500 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-secondary-500 dark:text-neutral-400">
                            {project.completedTasks}/{project.totalTasks}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 text-sm text-secondary-500 dark:text-neutral-400">
                        {formatDate(project.updatedAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pending Approvals Section */}
      {stats.pendingApproval > 0 && (
        <div className="group relative p-6 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <Typography variant="h4" className="text-blue-900 dark:text-blue-100 mb-4">
            Pending Creative Approval
          </Typography>
          <div className="space-y-3">
            {projects
              .filter((p) => p.status === "PENDING_APPROVAL")
              .map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-neutral-800 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="font-medium text-secondary-900 dark:text-neutral-100">
                      {project.name}
                    </span>
                  </div>
                  {project.lead && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-secondary-500 dark:text-neutral-400">
                        Lead:
                      </span>
                      <Avatar
                        name={project.lead.name || project.lead.email}
                        src={project.lead.image || undefined}
                        size="sm"
                      />
                    </div>
                  )}
                </Link>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
