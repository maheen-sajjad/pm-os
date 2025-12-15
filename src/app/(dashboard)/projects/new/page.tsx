"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Typography } from "@/atoms/Typography";
import { FeatureDocInput } from "@/molecules/FeatureDocInput";
import { TaskExtractor } from "@/organisms/TaskExtractor";
import { useFeatureExtractor, useKanbanBoard } from "@/features/projects";

type Step = "input" | "review" | "settings";

export default function NewProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("input");
  const [isCreating, setIsCreating] = useState(false);

  const {
    featureName,
    setFeatureName,
    featureDoc,
    setFeatureDoc,
    taskGroups,
    isExtracting,
    extractTasks,
    toggleTask,
    editTask,
    addTask,
    selectAll,
    deselectAll,
  } = useFeatureExtractor();

  const { initializeFromExtracted } = useKanbanBoard();

  const handleExtract = async () => {
    await extractTasks();
    setStep("review");
  };

  const handleCreateBoard = async () => {
    if (!featureName.trim()) {
      alert("Please enter a project name");
      return;
    }

    setIsCreating(true);
    try {
      // Create the project
      const projectRes = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: featureName,
          description: featureDoc.substring(0, 500), // Use first 500 chars as description
        }),
      });

      if (!projectRes.ok) {
        const error = await projectRes.json();
        throw new Error(error.error || "Failed to create project");
      }

      const project = await projectRes.json();

      // Create the feature with extracted tasks
      const selectedTasks = taskGroups.flatMap((group) =>
        group.tasks
          .filter((t) => t.selected)
          .map((t) => ({
            title: t.title,
            description: "",
            category: group.category.toUpperCase(),
            priority: "MEDIUM",
            status: "BACKLOG",
          }))
      );

      if (selectedTasks.length > 0) {
        await fetch(`/api/projects/${project.id}/features`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: featureName,
            description: featureDoc,
            tasks: selectedTasks,
          }),
        });
      }

      initializeFromExtracted(taskGroups);
      router.push(`/projects/${project.id}`);
    } catch (error) {
      console.error("Failed to create project:", error);
      alert(error instanceof Error ? error.message : "Failed to create project");
    } finally {
      setIsCreating(false);
    }
  };

  const handleBack = () => {
    setStep("input");
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center gap-4">
          <StepIndicator
            number={1}
            label="Feature Doc"
            active={step === "input"}
            completed={step === "review" || step === "settings"}
          />
          <div className="w-16 h-0.5 bg-secondary-200" />
          <StepIndicator
            number={2}
            label="Review Tasks"
            active={step === "review"}
            completed={step === "settings"}
          />
          <div className="w-16 h-0.5 bg-secondary-200" />
          <StepIndicator
            number={3}
            label="Create Board"
            active={step === "settings"}
            completed={false}
          />
        </div>
      </div>

      {/* Step Content */}
      {step === "input" && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <Typography variant="h1">Create New Project</Typography>
            <p className="text-secondary-500 mt-2">
              Paste your feature doc and let AI extract the tasks automatically
            </p>
          </div>

          <FeatureDocInput
            featureName={featureName}
            onFeatureNameChange={setFeatureName}
            value={featureDoc}
            onChange={setFeatureDoc}
            onSubmit={handleExtract}
            isLoading={isExtracting}
          />
        </div>
      )}

      {step === "review" && (
        <TaskExtractor
          featureName={featureName}
          taskGroups={taskGroups}
          onTaskToggle={toggleTask}
          onTaskEdit={editTask}
          onAddTask={addTask}
          onSelectAll={selectAll}
          onDeselectAll={deselectAll}
          onCreateBoard={handleCreateBoard}
          onBack={handleBack}
        />
      )}
    </div>
  );
}

function StepIndicator({
  number,
  label,
  active,
  completed,
}: {
  number: number;
  label: string;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors ${
          completed
            ? "bg-green-500 text-white"
            : active
            ? "bg-primary-500 text-white"
            : "bg-secondary-100 text-secondary-500"
        }`}
      >
        {completed ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          number
        )}
      </div>
      <span
        className={`text-sm ${
          active ? "text-primary-600 font-medium" : "text-secondary-500"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
