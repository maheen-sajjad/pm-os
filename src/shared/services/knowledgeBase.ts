import { api } from "./api";

export type KBEntryCategory =
  | "DOCUMENTATION"
  | "GUIDE"
  | "REFERENCE"
  | "MEETING_NOTES"
  | "DECISION"
  | "OTHER";

export interface KBEntryCreator {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

export interface KBAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  createdAt: string;
}

export interface KBEntry {
  id: string;
  title: string;
  content: string;
  category: KBEntryCategory;
  createdAt: string;
  updatedAt: string;
  creator: KBEntryCreator;
  _count: {
    attachments: number;
  };
}

export interface KBEntryWithAttachments extends Omit<KBEntry, "_count"> {
  attachments: KBAttachment[];
}

export interface CreateKBEntryData {
  title: string;
  content: string;
  category?: KBEntryCategory;
}

export interface UpdateKBEntryData {
  title?: string;
  content?: string;
  category?: KBEntryCategory;
}

export interface KBFilters {
  search?: string;
  category?: KBEntryCategory;
}

export const knowledgeBaseService = {
  getAll: (projectId: string, filters?: KBFilters) => {
    const params = new URLSearchParams();
    if (filters?.search) params.set("search", filters.search);
    if (filters?.category) params.set("category", filters.category);
    const query = params.toString();
    return api.get<KBEntry[]>(
      `/projects/${projectId}/knowledge-base${query ? `?${query}` : ""}`
    );
  },

  getById: (projectId: string, entryId: string) => {
    return api.get<KBEntryWithAttachments>(
      `/projects/${projectId}/knowledge-base/${entryId}`
    );
  },

  create: (projectId: string, data: CreateKBEntryData) => {
    return api.post<KBEntry>(`/projects/${projectId}/knowledge-base`, data);
  },

  update: (projectId: string, entryId: string, data: UpdateKBEntryData) => {
    return api.patch<KBEntryWithAttachments>(
      `/projects/${projectId}/knowledge-base/${entryId}`,
      data
    );
  },

  delete: (projectId: string, entryId: string) => {
    return api.delete<{ success: boolean }>(
      `/projects/${projectId}/knowledge-base/${entryId}`
    );
  },

  // Attachments
  getAttachments: (projectId: string, entryId: string) => {
    return api.get<KBAttachment[]>(
      `/projects/${projectId}/knowledge-base/${entryId}/attachments`
    );
  },

  uploadAttachment: async (projectId: string, entryId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
      `/api/projects/${projectId}/knowledge-base/${entryId}/attachments`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to upload attachment");
    }

    return response.json() as Promise<KBAttachment>;
  },

  deleteAttachment: (projectId: string, entryId: string, attachmentId: string) => {
    return api.delete<{ success: boolean }>(
      `/projects/${projectId}/knowledge-base/${entryId}/attachments/${attachmentId}`
    );
  },
};
