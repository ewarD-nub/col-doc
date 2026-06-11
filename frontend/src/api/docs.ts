import { http } from './client';

// ── Types ──────────────────────────────────────────────────────────────────

export interface Doc {
  id:         string;
  title:      string;
  updated_at: number; // unix ms
  // TODO: owner_id: string
  // TODO: collaborators: CollaboratorSummary[]
  // TODO: visibility: 'private' | 'public' | 'shared_link'
}

// ── API calls ──────────────────────────────────────────────────────────────

export const docsApi = {
  /** Fetch all documents for the current user. */
  list: () =>
    http.get<Doc[]>('/api/docs'),
    // TODO: accept { page, limit } params for pagination

  /** Fetch a single document by ID. */
  get: (id: string) =>
    http.get<Doc>(`/api/docs/${id}`),

  /** Create a new blank document. */
  create: () =>
    http.post<Doc>('/api/docs'),
    // TODO: accept optional { title, templateId } body

  /** Rename a document. */
  updateTitle: (id: string, title: string) =>
    http.patch<Doc>(`/api/docs/${id}`, { title }),

  /** Permanently delete a document. */
  delete: (id: string) =>
    http.delete<void>(`/api/docs/${id}`),
    // TODO: show confirmation dialog before calling this

  // TODO: share(id, email, role) — invite a collaborator
  // TODO: getShareLink(id)       — generate a shareable URL
};
