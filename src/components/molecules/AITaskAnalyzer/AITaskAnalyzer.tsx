"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/atoms/Modal";
import { Button } from "@/atoms/Button";
import { Badge } from "@/atoms/Badge";
import { Checkbox } from "@/atoms/Checkbox";
import type {
  AITaskAnalyzerProps,
  TaskSuggestion,
  AnalysisResult,
  AnalysisAvailability,
} from "./AITaskAnalyzer.types";

const statusColors: Record<string, string> = {
  BACKLOG: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  REVIEW: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  DONE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

function getConfidenceColor(confidence: number): string {
  if (confidence >= 80) return "text-green-600 dark:text-green-400";
  if (confidence >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

export function AITaskAnalyzer({ projectId, onTasksUpdated }: AITaskAnalyzerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [availability, setAvailability] = useState<AnalysisAvailability | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkAvailability();
    } else {
      // Reset state when modal closes
      setResult(null);
      setError(null);
      setSelectedSuggestions(new Set());
    }
  }, [isOpen, projectId]);

  const checkAvailability = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/analyze-tasks`);
      if (res.ok) {
        const data: AnalysisAvailability = await res.json();
        setAvailability(data);
      } else {
        const errData = await res.json();
        setError(errData.error || "Failed to check availability");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check availability");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/analyze-tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoApply: false }),
      });

      if (res.ok) {
        const data: AnalysisResult = await res.json();
        setResult(data);
        // Pre-select high-confidence suggestions
        const highConfidence = data.suggestions
          .filter((s) => s.confidence >= 70 && !s.applied)
          .map((s) => s.taskId);
        setSelectedSuggestions(new Set(highConfidence));
      } else {
        const errData = await res.json();
        setError(errData.error || errData.message || "Analysis failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleToggleSuggestion = (taskId: string) => {
    setSelectedSuggestions((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (!result) return;
    const unapplied = result.suggestions.filter((s) => !s.applied);
    if (selectedSuggestions.size === unapplied.length) {
      setSelectedSuggestions(new Set());
    } else {
      setSelectedSuggestions(new Set(unapplied.map((s) => s.taskId)));
    }
  };

  const handleApplySelected = async () => {
    if (selectedSuggestions.size === 0 || !result) return;

    setIsApplying(true);
    setError(null);

    try {
      // Apply each selected suggestion
      const toApply = result.suggestions.filter(
        (s) => selectedSuggestions.has(s.taskId) && !s.applied
      );

      for (const suggestion of toApply) {
        const res = await fetch(`/api/tasks/${suggestion.taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: suggestion.suggestedStatus }),
        });

        if (res.ok) {
          // Mark as applied in the result
          suggestion.applied = true;
        }
      }

      // Update result to reflect applied changes
      setResult({ ...result });
      setSelectedSuggestions(new Set());
      onTasksUpdated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply changes");
    } finally {
      setIsApplying(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    if (result && result.suggestions.some((s) => s.applied)) {
      onTasksUpdated?.();
    }
  };

  // Not indexed screen
  if (isOpen && availability && !availability.isIndexed) {
    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(true)}
          title="AI Task Analysis"
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          AI Analyze
        </Button>
        <Modal isOpen={isOpen} onClose={handleClose} title="Codebase Not Indexed" size="md">
          <div className="space-y-4 py-4">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-neutral-100 mb-2">
                Index Required
              </h3>
              <p className="text-sm text-secondary-500 dark:text-neutral-400">
                The AI needs an indexed codebase to analyze task completion.
                Please index the repository first via the Knowledge Base tab.
              </p>
            </div>
            <div className="flex justify-center pt-2">
              <Button variant="ghost" onClick={handleClose}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      </>
    );
  }

  // Results screen
  if (result) {
    const unappliedSuggestions = result.suggestions.filter((s) => !s.applied);
    const appliedSuggestions = result.suggestions.filter((s) => s.applied);

    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(true)}
          title="AI Task Analysis"
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          AI Analyze
        </Button>
        <Modal isOpen={isOpen} onClose={handleClose} title="AI Analysis Results" size="lg">
          <div className="space-y-4">
            {/* Summary */}
            <div className="flex items-center gap-4 text-sm text-secondary-600 dark:text-neutral-400">
              <span>{result.analyzed} tasks analyzed</span>
              <span>{result.suggestions.length} suggestions</span>
              {appliedSuggestions.length > 0 && (
                <Badge variant="success" size="sm">
                  {appliedSuggestions.length} applied
                </Badge>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            {result.suggestions.length === 0 ? (
              <div className="text-center py-8 text-secondary-500 dark:text-neutral-400">
                <svg className="w-12 h-12 mx-auto mb-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>All tasks appear to have the correct status!</p>
              </div>
            ) : (
              <>
                {/* Select all for unapplied */}
                {unappliedSuggestions.length > 0 && (
                  <div className="flex items-center justify-between pb-2 border-b border-secondary-200 dark:border-neutral-700">
                    <Checkbox
                      checked={selectedSuggestions.size === unappliedSuggestions.length}
                      onChange={handleSelectAll}
                      label={`Select all (${unappliedSuggestions.length})`}
                    />
                    <span className="text-sm text-secondary-500 dark:text-neutral-400">
                      {selectedSuggestions.size} selected
                    </span>
                  </div>
                )}

                {/* Suggestions list */}
                <div className="max-h-96 overflow-y-auto space-y-3">
                  {result.suggestions.map((suggestion) => (
                    <SuggestionCard
                      key={suggestion.taskId}
                      suggestion={suggestion}
                      isSelected={selectedSuggestions.has(suggestion.taskId)}
                      onToggle={() => handleToggleSuggestion(suggestion.taskId)}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-secondary-200 dark:border-neutral-700">
              <Button variant="ghost" size="sm" onClick={handleAnalyze} disabled={isAnalyzing}>
                Re-analyze
              </Button>
              <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={handleClose}>
                  Close
                </Button>
                {unappliedSuggestions.length > 0 && (
                  <Button
                    onClick={handleApplySelected}
                    disabled={selectedSuggestions.size === 0 || isApplying}
                    isLoading={isApplying}
                  >
                    Apply Selected ({selectedSuggestions.size})
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      </>
    );
  }

  // Main button and initial modal
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        title="AI Task Analysis"
      >
        <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        AI Analyze
      </Button>
      <Modal isOpen={isOpen} onClose={handleClose} title="AI Task Analysis" size="md">
        <div className="space-y-4 py-2">
          <p className="text-sm text-secondary-500 dark:text-neutral-400">
            The AI will analyze your tasks against the indexed codebase and PR status
            to suggest status updates for tasks that appear complete or in progress.
          </p>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
            </div>
          ) : availability ? (
            <div className="bg-secondary-50 dark:bg-neutral-800 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-secondary-600 dark:text-neutral-400">Tasks to analyze:</span>
                <span className="font-medium text-secondary-900 dark:text-neutral-100">
                  {availability.tasksToAnalyze}
                </span>
              </div>
              {availability.indexInfo && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-secondary-600 dark:text-neutral-400">Indexed files:</span>
                    <span className="font-medium text-secondary-900 dark:text-neutral-100">
                      {availability.indexInfo.totalFiles}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-secondary-600 dark:text-neutral-400">Code chunks:</span>
                    <span className="font-medium text-secondary-900 dark:text-neutral-100">
                      {availability.indexInfo.totalChunks}
                    </span>
                  </div>
                </>
              )}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleAnalyze}
              disabled={!availability?.available || isAnalyzing}
              isLoading={isAnalyzing}
            >
              {isAnalyzing ? "Analyzing..." : "Start Analysis"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// Sub-component for individual suggestion
function SuggestionCard({
  suggestion,
  isSelected,
  onToggle,
}: {
  suggestion: TaskSuggestion;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`p-3 rounded-lg border transition-colors ${
        suggestion.applied
          ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
          : "border-secondary-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-700"
      }`}
    >
      <div className="flex items-start gap-3">
        {!suggestion.applied && (
          <Checkbox checked={isSelected} onChange={onToggle} className="mt-1" />
        )}
        {suggestion.applied && (
          <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-secondary-900 dark:text-neutral-100 truncate">
              {suggestion.taskTitle}
            </span>
            <span className={`text-sm font-medium ${getConfidenceColor(suggestion.confidence)}`}>
              {suggestion.confidence}%
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm mb-2">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[suggestion.currentStatus]}`}>
              {suggestion.currentStatus}
            </span>
            <svg className="w-4 h-4 text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[suggestion.suggestedStatus]}`}>
              {suggestion.suggestedStatus}
            </span>
            {suggestion.evidence.prStatus && (
              <Badge variant={suggestion.evidence.prStatus === "MERGED" ? "success" : "info"} size="sm">
                PR {suggestion.evidence.prStatus}
              </Badge>
            )}
          </div>

          <p className="text-sm text-secondary-600 dark:text-neutral-400">
            {suggestion.reason}
          </p>

          {suggestion.evidence.codeFiles.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {suggestion.evidence.codeFiles.slice(0, 3).map((file) => (
                <span
                  key={file}
                  className="text-xs px-1.5 py-0.5 bg-secondary-100 dark:bg-neutral-700 rounded text-secondary-600 dark:text-neutral-300 font-mono"
                >
                  {file.split("/").pop()}
                </span>
              ))}
              {suggestion.evidence.codeFiles.length > 3 && (
                <span className="text-xs text-secondary-500">
                  +{suggestion.evidence.codeFiles.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
