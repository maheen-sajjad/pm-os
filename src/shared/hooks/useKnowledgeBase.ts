"use client";

import { useState, useEffect, useCallback } from "react";
import {
  knowledgeBaseService,
  KBEntry,
  KBEntryWithAttachments,
  CreateKBEntryData,
  UpdateKBEntryData,
  KBFilters,
} from "@/shared/services/knowledgeBase";

export function useKnowledgeBase(projectId: string | null, filters?: KBFilters) {
  const [entries, setEntries] = useState<KBEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    if (!projectId) {
      setEntries([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await knowledgeBaseService.getAll(projectId, filters);
      setEntries(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch knowledge base"
      );
    } finally {
      setIsLoading(false);
    }
  }, [projectId, filters?.search, filters?.category]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const createEntry = async (data: CreateKBEntryData) => {
    if (!projectId) throw new Error("Project ID is required");
    const entry = await knowledgeBaseService.create(projectId, data);
    setEntries((prev) => [entry, ...prev]);
    return entry;
  };

  const deleteEntry = async (entryId: string) => {
    if (!projectId) throw new Error("Project ID is required");
    await knowledgeBaseService.delete(projectId, entryId);
    setEntries((prev) => prev.filter((e) => e.id !== entryId));
  };

  return {
    entries,
    isLoading,
    error,
    refresh: fetchEntries,
    createEntry,
    deleteEntry,
  };
}

export function useKBEntry(projectId: string | null, entryId: string | null) {
  const [entry, setEntry] = useState<KBEntryWithAttachments | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntry = useCallback(async () => {
    if (!projectId || !entryId) {
      setEntry(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await knowledgeBaseService.getById(projectId, entryId);
      setEntry(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch entry");
    } finally {
      setIsLoading(false);
    }
  }, [projectId, entryId]);

  useEffect(() => {
    fetchEntry();
  }, [fetchEntry]);

  const updateEntry = async (data: UpdateKBEntryData) => {
    if (!projectId || !entryId) return null;
    const updated = await knowledgeBaseService.update(projectId, entryId, data);
    setEntry(updated);
    return updated;
  };

  const uploadAttachment = async (file: File) => {
    if (!projectId || !entryId) throw new Error("Project and entry IDs required");
    const attachment = await knowledgeBaseService.uploadAttachment(
      projectId,
      entryId,
      file
    );
    setEntry((prev) =>
      prev
        ? { ...prev, attachments: [attachment, ...prev.attachments] }
        : null
    );
    return attachment;
  };

  const deleteAttachment = async (attachmentId: string) => {
    if (!projectId || !entryId) throw new Error("Project and entry IDs required");
    await knowledgeBaseService.deleteAttachment(projectId, entryId, attachmentId);
    setEntry((prev) =>
      prev
        ? {
            ...prev,
            attachments: prev.attachments.filter((a) => a.id !== attachmentId),
          }
        : null
    );
  };

  return {
    entry,
    isLoading,
    error,
    refresh: fetchEntry,
    updateEntry,
    uploadAttachment,
    deleteAttachment,
  };
}
