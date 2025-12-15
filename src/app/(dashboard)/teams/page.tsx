"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Typography } from "@/atoms/Typography";
import { Button } from "@/atoms/Button";
import { Card, CardBody } from "@/atoms/Card";
import { Badge } from "@/atoms/Badge";
import { Avatar } from "@/atoms/Avatar";

interface TeamMember {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  joinedAt: string;
}

interface Team {
  id: string;
  name: string;
  type: "DEVELOPMENT" | "QA" | "DESIGN" | "DEVOPS";
  members: TeamMember[];
  _count: { members: number };
}

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  canApproveCreatives: boolean;
}

const teamTypeConfig = {
  DEVELOPMENT: { label: "Development", variant: "info" as const, color: "text-blue-500" },
  QA: { label: "QA", variant: "warning" as const, color: "text-yellow-500" },
  DESIGN: { label: "Design", variant: "success" as const, color: "text-green-500" },
  DEVOPS: { label: "DevOps", variant: "default" as const, color: "text-purple-500" },
};

export default function TeamsPage() {
  const { data: session } = useSession();
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState<string | null>(null);
  const [newTeam, setNewTeam] = useState({ name: "", type: "DEVELOPMENT" });

  const isSuperAdmin = (session?.user as any)?.role === "SUPER_ADMIN";

  useEffect(() => {
    fetchTeams();
    fetchUsers();
  }, []);

  const fetchTeams = async () => {
    try {
      const res = await fetch("/api/teams");
      if (res.ok) {
        const data = await res.json();
        setTeams(data);
      }
    } catch (error) {
      console.error("Failed to fetch teams:", error);
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

  const createTeam = async () => {
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTeam),
      });
      if (res.ok) {
        setShowCreateModal(false);
        setNewTeam({ name: "", type: "DEVELOPMENT" });
        fetchTeams();
      }
    } catch (error) {
      console.error("Failed to create team:", error);
    }
  };

  const deleteTeam = async (teamId: string) => {
    if (!confirm("Are you sure you want to delete this team?")) return;
    try {
      const res = await fetch(`/api/teams/${teamId}`, { method: "DELETE" });
      if (res.ok) {
        fetchTeams();
      }
    } catch (error) {
      console.error("Failed to delete team:", error);
    }
  };

  const addMember = async (teamId: string, userId: string) => {
    try {
      const res = await fetch(`/api/teams/${teamId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        setShowAddMemberModal(null);
        fetchTeams();
      }
    } catch (error) {
      console.error("Failed to add member:", error);
    }
  };

  const removeMember = async (teamId: string, userId: string) => {
    try {
      const res = await fetch(`/api/teams/${teamId}/members?userId=${userId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchTeams();
      }
    } catch (error) {
      console.error("Failed to remove member:", error);
    }
  };

  const toggleApprover = async (userId: string, currentValue: boolean) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canApproveCreatives: !currentValue }),
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error("Failed to update approver status:", error);
    }
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
          <Typography variant="h1" className="text-secondary-900 dark:text-neutral-100">
            Teams
          </Typography>
          <p className="text-secondary-500 dark:text-neutral-400 mt-1">
            Manage teams and assign members
          </p>
        </div>
        {isSuperAdmin && (
          <Button onClick={() => setShowCreateModal(true)}>+ New Team</Button>
        )}
      </div>

      {/* Teams Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {teams.map((team) => {
          const config = teamTypeConfig[team.type];
          const teamMemberIds = team.members.map((m) => m.user.id);
          const availableUsers = users.filter((u) => !teamMemberIds.includes(u.id));

          return (
            <Card key={team.id}>
              <CardBody className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center`}>
                      <svg className={`w-5 h-5 ${config.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <Typography variant="h4" className="text-secondary-900 dark:text-neutral-100">
                        {team.name}
                      </Typography>
                      <Badge variant={config.variant} size="sm">{config.label}</Badge>
                    </div>
                  </div>
                  {isSuperAdmin && (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAddMemberModal(team.id)}
                      >
                        + Add
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTeam(team.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </div>

                {/* Members */}
                <div className="space-y-2">
                  <p className="text-sm text-secondary-500 dark:text-neutral-400">
                    {team._count.members} member{team._count.members !== 1 ? "s" : ""}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {team.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-2 bg-secondary-50 dark:bg-neutral-800 rounded-full pl-1 pr-2 py-1"
                      >
                        <Avatar
                          name={member.user.name || member.user.email}
                          src={member.user.image || undefined}
                          size="sm"
                        />
                        <span className="text-sm text-secondary-700 dark:text-neutral-300">
                          {member.user.name || member.user.email}
                        </span>
                        {isSuperAdmin && (
                          <button
                            onClick={() => removeMember(team.id, member.user.id)}
                            className="text-secondary-400 hover:text-red-500 ml-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add Member Dropdown */}
                {showAddMemberModal === team.id && availableUsers.length > 0 && (
                  <div className="mt-4 p-3 bg-secondary-50 dark:bg-neutral-800 rounded-lg">
                    <p className="text-sm font-medium mb-2 text-secondary-700 dark:text-neutral-300">
                      Add member:
                    </p>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {availableUsers.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => addMember(team.id, user.id)}
                          className="flex items-center gap-2 w-full p-2 rounded hover:bg-secondary-100 dark:hover:bg-neutral-700 transition-colors"
                        >
                          <Avatar name={user.name || user.email} size="sm" />
                          <span className="text-sm text-secondary-700 dark:text-neutral-300">
                            {user.name || user.email}
                          </span>
                        </button>
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAddMemberModal(null)}
                      className="mt-2"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </CardBody>
            </Card>
          );
        })}
      </div>

      {teams.length === 0 && (
        <Card>
          <CardBody className="p-8 text-center">
            <p className="text-secondary-500 dark:text-neutral-400">
              No teams created yet.{" "}
              {isSuperAdmin && "Click 'New Team' to create one."}
            </p>
          </CardBody>
        </Card>
      )}

      {/* Approvers Section */}
      {isSuperAdmin && (
        <div className="mt-8">
          <Typography variant="h2" className="text-secondary-900 dark:text-neutral-100 mb-4">
            Creative Approvers
          </Typography>
          <Card>
            <CardBody className="p-4">
              <p className="text-sm text-secondary-500 dark:text-neutral-400 mb-4">
                Users who can approve projects for creative sign-off
              </p>
              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-2 rounded hover:bg-secondary-50 dark:hover:bg-neutral-800"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={user.name || user.email} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-secondary-900 dark:text-neutral-100">
                          {user.name || user.email}
                        </p>
                        <p className="text-xs text-secondary-500 dark:text-neutral-400">
                          {user.role}
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={user.canApproveCreatives}
                        onChange={() => toggleApprover(user.id, user.canApproveCreatives)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary-500"></div>
                    </label>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardBody className="p-6">
              <Typography variant="h3" className="text-secondary-900 dark:text-neutral-100 mb-4">
                Create New Team
              </Typography>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-neutral-300 mb-1">
                    Team Name
                  </label>
                  <input
                    type="text"
                    value={newTeam.name}
                    onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-secondary-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-secondary-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g., Frontend Team"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-neutral-300 mb-1">
                    Team Type
                  </label>
                  <select
                    value={newTeam.type}
                    onChange={(e) => setNewTeam({ ...newTeam, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-secondary-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-secondary-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="DEVELOPMENT">Development</option>
                    <option value="QA">QA</option>
                    <option value="DESIGN">Design</option>
                    <option value="DEVOPS">DevOps</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button onClick={createTeam} disabled={!newTeam.name}>
                  Create Team
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
