"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { KanbanBoard } from "@/organisms/KanbanBoard";
import { KBChatPanel } from "@/organisms/KBChatPanel";
import { ProjectSettingsForm } from "@/molecules/ProjectSettingsForm";
import { AITaskAnalyzer } from "@/molecules/AITaskAnalyzer";
import { Button } from "@/atoms/Button";
import { Typography } from "@/atoms/Typography";
import { Badge } from "@/atoms/Badge";
import { Avatar } from "@/atoms/Avatar";
import { usePermissions } from "@/hooks/usePermissions";
import type { Task, TeamMember, GitHubRepo, TaskStatus } from "@/features/projects/types";

interface Project {
  id: string;
  name: string;
  prefix?: string | null;
  description: string | null;
  status: "PLANNING" | "ACTIVE" | "PAUSED" | "PENDING_APPROVAL" | "COMPLETED";
  totalTasks: number;
  completedTasks: number;
  lead: { id: string; name: string | null; email: string; image: string | null } | null;
  creator: { id: string; name: string | null; email: string; image: string | null };
  approvedBy: { id: string; name: string | null; email: string; image: string | null } | null;
  approvedAt: string | null;
  repo: GitHubRepo | null;
  features: Array<{
    id: string;
    name: string;
    tasks: Task[];
  }>;
}

interface User {
  id: string;
  name: string | null;
  email: string;
  canApproveCreatives: boolean;
}

const statusConfig: Record<string, { label: string; variant: "success" | "warning" | "default" | "info" }> = {
  PLANNING: { label: "Planning", variant: "warning" },
  ACTIVE: { label: "Active", variant: "success" },
  PAUSED: { label: "Paused", variant: "default" },
  PENDING_APPROVAL: { label: "Pending Approval", variant: "info" },
  COMPLETED: { label: "Completed", variant: "success" },
};

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { data: session } = useSession();
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [availableRepos, setAvailableRepos] = useState<GitHubRepo[]>([]);
  const [reposError, setReposError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const { can, isSuperAdmin, canApproveCreatives } = usePermissions();
  const userId = session?.user?.id;
  const isLeadOrCreator = project && (userId === project.lead?.id || userId === project.creator?.id);
  const canAssignLead = can("projects:assign-lead");

  useEffect(() => {
    fetchProject();
    fetchUsers();
  }, [id]);

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data);
      } else {
        router.push("/projects");
      }
    } catch (error) {
      console.error("Failed to fetch project:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const fetchRepos = async () => {
    setReposError(null);
    try {
      const res = await fetch("/api/github/repos");
      if (res.ok) {
        const data = await res.json();
        // Convert numeric IDs to strings to match frontend types
        const repos = data.map((repo: any) => ({
          ...repo,
          id: String(repo.id),
        }));
        setAvailableRepos(repos);
      } else {
        const error = await res.json();
        setReposError(error.error || "Failed to fetch repositories");
      }
    } catch (error) {
      setReposError("Failed to fetch GitHub repositories");
    }
  };

  const handleSubmitForApproval = async () => {
    if (!confirm("Submit this project for creative approval?")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/projects/${id}/submit-for-approval`, {
        method: "POST",
      });
      if (res.ok) {
        fetchProject();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to submit for approval");
      }
    } catch (error) {
      console.error("Failed to submit for approval:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproval = async (action: "approve" | "reject") => {
    const message = action === "approve"
      ? "Approve this project? This will mark it as completed."
      : "Reject this project? It will be sent back to active status for revisions.";

    if (!confirm(message)) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/projects/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        fetchProject();
      } else {
        const error = await res.json();
        alert(error.error || `Failed to ${action} project`);
      }
    } catch (error) {
      console.error(`Failed to ${action} project:`, error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleTaskMove = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus.toUpperCase() }),
      });
      if (res.ok) {
        fetchProject();
      } else {
        const error = await res.json();
        console.error("Failed to move task:", error);
      }
    } catch (error) {
      console.error("Failed to move task:", error);
    }
  };

  const handleUpdateProject = async (data: { name?: string; status?: string; leadId?: string }) => {
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        fetchProject();
        setShowSettings(false);
      }
    } catch (error) {
      console.error("Failed to update project:", error);
    }
  };

  const handleLinkRepo = async (repoId: string) => {
    const repo = availableRepos.find((r) => r.id === repoId);
    if (!repo) return;

    try {
      const res = await fetch(`/api/projects/${id}/repo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: repo.name,
          fullName: repo.fullName,
          url: repo.url,
          isPrivate: repo.isPrivate,
        }),
      });
      if (res.ok) {
        fetchProject();
      } else {
        const error = await res.json();
        console.error("Failed to link repo:", error.error);
      }
    } catch (error) {
      console.error("Failed to link repo:", error);
    }
  };

  // Check if current user can approve (uses hook which checks role + flag)
  const canApprove = canApproveCreatives;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <Typography variant="h3" className="text-secondary-500">
          Project not found
        </Typography>
      </div>
    );
  }

  const allTasks = project.features.flatMap((f) => f.tasks);
  const config = statusConfig[project.status];

  // Map task data to expected format
  const mappedTasks: Task[] = allTasks.map((task: any) => ({
    id: task.id,
    taskNumber: task.taskNumber,
    projectPrefix: project.prefix || undefined,
    title: task.title,
    description: task.description,
    status: task.status.toLowerCase() as TaskStatus,
    category: task.category.toLowerCase() as any,
    priority: task.priority.toLowerCase() as any,
    assignee: task.assignee ? {
      id: task.assignee.id,
      name: task.assignee.name || task.assignee.email,
      email: task.assignee.email,
      role: "member" as const,
    } : undefined,
    linkedPR: task.linkedPR ? {
      id: task.linkedPR.id,
      number: task.linkedPR.number,
      title: task.linkedPR.title,
      url: task.linkedPR.url,
      status: task.linkedPR.status.toLowerCase() as any,
      author: task.linkedPR.author,
      commitsCount: task.linkedPR.commitsCount,
    } : undefined,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  }));

  const teamMembers: TeamMember[] = users.map((u) => ({
    id: u.id,
    name: u.name || u.email,
    email: u.email,
    role: "member" as const,
  }));

  return (
    <div className="h-full">
      {showSettings ? (
        <div className="max-w-xl mx-auto">
          <div className="mb-6">
            <button
              onClick={() => setShowSettings(false)}
              className="flex items-center gap-1 text-sm text-secondary-500 hover:text-secondary-700 mb-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Board
            </button>
            <Typography variant="h2" className="text-secondary-900 dark:text-neutral-100">
              Project Settings
            </Typography>
          </div>

          {reposError && (
            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-700 dark:text-amber-300">{reposError}</p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Connect your GitHub account in Settings to access repositories.
              </p>
            </div>
          )}

          <ProjectSettingsForm
            teamMembers={teamMembers}
            repos={availableRepos.length > 0 ? availableRepos : (project.repo ? [project.repo] : [])}
            selectedLead={project.lead?.id || ""}
            selectedRepo={project.repo?.id || ""}
            onLeadChange={(leadId) => handleUpdateProject({ leadId })}
            onRepoChange={(repoId) => handleLinkRepo(repoId)}
            onSubmit={() => setShowSettings(false)}
          />
        </div>
      ) : (
        <div className="h-full flex flex-col">
          {/* Project Header */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-secondary-200 dark:border-neutral-800">
            <div className="flex items-center gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <Typography variant="h2" className="text-secondary-900 dark:text-neutral-100">
                    {project.name}
                  </Typography>
                  <Badge variant={config.variant}>{config.label}</Badge>
                </div>
                {project.lead && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-secondary-500 dark:text-neutral-400">Lead:</span>
                    <Avatar
                      name={project.lead.name || project.lead.email}
                      src={project.lead.image || undefined}
                      size="sm"
                    />
                    <span className="text-sm text-secondary-600 dark:text-neutral-300">
                      {project.lead.name || project.lead.email}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Submit for Approval Button */}
              {project.status === "ACTIVE" && (isLeadOrCreator || isSuperAdmin) && (
                <Button
                  onClick={handleSubmitForApproval}
                  disabled={actionLoading}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  Submit for Approval
                </Button>
              )}

              {/* Approval Actions */}
              {project.status === "PENDING_APPROVAL" && canApprove && (
                <>
                  <Button
                    onClick={() => handleApproval("reject")}
                    disabled={actionLoading}
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    Request Revisions
                  </Button>
                  <Button
                    onClick={() => handleApproval("approve")}
                    disabled={actionLoading}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    Approve Project
                  </Button>
                </>
              )}

              {canAssignLead && (
                <Button variant="outline" onClick={() => { setShowSettings(true); fetchRepos(); }}>
                  Settings
                </Button>
              )}
              <Button variant="outline" onClick={() => router.push(`/projects/${id}/knowledge-base`)}>
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Knowledge Base
              </Button>
              {project.repo && (
                <AITaskAnalyzer projectId={id} onTasksUpdated={fetchProject} />
              )}
              <Button variant="outline" onClick={() => setChatOpen(true)}>
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                Ask AI
              </Button>
            </div>
          </div>

          {/* Approval Status Banner */}
          {project.status === "PENDING_APPROVAL" && (
            <div className="mb-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="text-blue-800 dark:text-blue-200 font-medium">
                  This project is awaiting creative approval
                </span>
              </div>
            </div>
          )}

          {/* Completed with Approval Info */}
          {project.status === "COMPLETED" && project.approvedBy && (
            <div className="mb-4 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-green-800 dark:text-green-200 font-medium">
                  Approved by {project.approvedBy.name || project.approvedBy.email}
                </span>
                {project.approvedAt && (
                  <span className="text-green-600 dark:text-green-400 text-sm">
                    on {new Date(project.approvedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Kanban Board */}
          <div className="flex-1">
            <KanbanBoard
              projectName={project.name}
              tasks={mappedTasks}
              repo={project.repo || undefined}
              teamMembers={teamMembers}
              onTaskMove={handleTaskMove}
              onAssigneeChanged={() => fetchProject()}
            />
          </div>
        </div>
      )}

      {/* Knowledge Base Chat Panel */}
      <KBChatPanel
        projectId={id}
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        projectName={project?.name}
      />
    </div>
  );
}
