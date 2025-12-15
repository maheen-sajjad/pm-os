"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Typography } from "@/atoms/Typography";
import { Button } from "@/atoms/Button";
import { Card, CardBody } from "@/atoms/Card";
import { Badge } from "@/atoms/Badge";
import { Avatar } from "@/atoms/Avatar";
import { RepoImportModal } from "@/molecules/RepoImportModal";

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
  repo: {
    name: string;
    fullName: string;
    url: string;
  } | null;
  approvedBy: {
    name: string | null;
  } | null;
}

const statusConfig: Record<string, { label: string; variant: "success" | "warning" | "default" | "info" }> = {
  PLANNING: { label: "Planning", variant: "warning" },
  ACTIVE: { label: "Active", variant: "success" },
  PAUSED: { label: "Paused", variant: "default" },
  PENDING_APPROVAL: { label: "Pending Approval", variant: "info" },
  COMPLETED: { label: "Completed", variant: "success" },
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
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

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Typography variant="h1" className="text-secondary-900 dark:text-neutral-100">Projects</Typography>
          <p className="text-secondary-500 dark:text-neutral-400 mt-1">
            Manage and track all your projects
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
            <svg
              className="w-4 h-4 mr-2"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            Import from GitHub
          </Button>
          <Link href="/projects/new">
            <Button>+ New Project</Button>
          </Link>
        </div>
      </div>

      {/* Project List */}
      {projects.length === 0 ? (
        <Card>
          <CardBody className="p-8 text-center">
            <p className="text-secondary-500 dark:text-neutral-400">
              No projects yet. Click "New Project" to create one.
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-3">
          {projects.map((project) => {
            const progress = project.totalTasks > 0
              ? Math.round((project.completedTasks / project.totalTasks) * 100)
              : 0;
            const status = statusConfig[project.status];

            return (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card
                  variant="outlined"
                  padding="none"
                  className="group hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
                >
                  <CardBody className="p-4">
                    <div className="flex items-center justify-between">
                      {/* Left side */}
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary-500/10 dark:bg-primary-500/20 flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-primary-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                          </svg>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Typography variant="h4" className="text-secondary-900 dark:text-neutral-100">{project.name}</Typography>
                            <Badge variant={status.variant} size="sm">
                              {status.label}
                            </Badge>
                            {project.status === "COMPLETED" && project.approvedBy && (
                              <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Approved
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-secondary-500 dark:text-neutral-400">
                            {project.repo && (
                              <span className="flex items-center gap-1">
                                <svg
                                  className="w-4 h-4"
                                  fill="currentColor"
                                  viewBox="0 0 16 16"
                                >
                                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                                </svg>
                                {project.repo.fullName}
                              </span>
                            )}
                            <span>Updated {formatDate(project.updatedAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right side */}
                      <div className="flex items-center gap-6">
                        {/* Progress */}
                        <div className="text-right">
                          <div className="text-sm text-secondary-500 dark:text-neutral-400 mb-1">
                            {project.completedTasks}/{project.totalTasks} tasks
                          </div>
                          <div className="w-32 h-1.5 bg-secondary-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary-500 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Lead */}
                        {project.lead ? (
                          <div className="flex items-center gap-2">
                            <Avatar
                              name={project.lead.name || project.lead.email}
                              src={project.lead.image || undefined}
                              size="sm"
                            />
                            <span className="text-sm text-secondary-600 dark:text-neutral-300">
                              {project.lead.name || project.lead.email}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-secondary-400 dark:text-neutral-500">
                            No lead
                          </span>
                        )}

                        {/* Arrow */}
                        <svg
                          className="w-5 h-5 text-secondary-400 dark:text-neutral-500 group-hover:text-primary-500 transition-colors"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Import from GitHub Modal */}
      <RepoImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={() => fetchProjects()}
      />
    </div>
  );
}
