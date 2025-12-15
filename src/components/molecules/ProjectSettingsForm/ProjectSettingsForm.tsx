"use client";

import { Select } from "@/atoms/Select";
import { Button } from "@/atoms/Button";
import { Card, CardBody, CardFooter } from "@/atoms/Card";
import { Avatar } from "@/atoms/Avatar";
import type { ProjectSettingsFormProps } from "./ProjectSettingsForm.types";

export function ProjectSettingsForm({
  teamMembers,
  repos,
  selectedLead,
  selectedRepo,
  onLeadChange,
  onRepoChange,
  onSubmit,
  isLoading = false,
}: ProjectSettingsFormProps) {
  const selectedMember = teamMembers.find((m) => m.id === selectedLead);

  return (
    <Card variant="default" padding="lg">
      <CardBody className="space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-secondary-700">
            Project Lead
          </label>
          <Select
            options={teamMembers.map((member) => ({
              value: member.id,
              label: member.name,
            }))}
            placeholder="Select team member"
            value={selectedLead || ""}
            onChange={(e) => onLeadChange(e.target.value)}
          />
          {selectedMember && (
            <div className="flex items-center gap-2 mt-2 p-2 bg-secondary-50 rounded-md">
              <Avatar name={selectedMember.name} size="sm" />
              <div>
                <p className="text-sm font-medium text-secondary-800">
                  {selectedMember.name}
                </p>
                <p className="text-xs text-secondary-500">
                  {selectedMember.email}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-secondary-700">
            GitHub Repository
          </label>
          <Select
            options={repos.map((repo) => ({
              value: repo.id,
              label: repo.fullName,
            }))}
            placeholder="Search repos..."
            value={selectedRepo || ""}
            onChange={(e) => onRepoChange(e.target.value)}
          />
          {selectedRepo && (
            <div className="flex items-center gap-2 mt-2 p-2 bg-secondary-50 rounded-md">
              <svg
                className="w-5 h-5 text-secondary-600"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              <span className="text-sm text-secondary-700">
                {repos.find((r) => r.id === selectedRepo)?.fullName}
              </span>
            </div>
          )}
        </div>
      </CardBody>

      <CardFooter>
        <Button
          onClick={onSubmit}
          disabled={!selectedLead || !selectedRepo || isLoading}
          isLoading={isLoading}
        >
          Save & Notify Lead
        </Button>
      </CardFooter>
    </Card>
  );
}
