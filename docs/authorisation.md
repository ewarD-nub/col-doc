# Authorisation

Authorisation determines what an authenticated user is permitted to do with a given document or resource.

## Functional Requirements

1. Every document has an owner — the user who created it.
2. The owner can invite other users to collaborate with one of two roles:
   - **Editor** — can read and write the document.
   - **Viewer** — can read the document but cannot make changes.
3. Documents are **private** by default; only the owner and explicitly invited collaborators can open them.
4. The owner can optionally set a document to **public** (read-only for anyone with the URL) or generate a **share link** that grants a specific role to anyone who has the link.
5. Only the owner may delete a document or change its visibility setting.
6. All REST API endpoints and WebSocket upgrade requests must verify the authenticated user's role before proceeding.

## Non-Functional Requirements

1. Permission checks must be enforced server-side; the frontend may hide UI affordances but must not be the sole access gate.
2. Role changes (e.g. revoking a collaborator) must take effect immediately for active WebSocket connections.
3. Share links must be revocable by the owner at any time.

## TODOs

- [ ] Add `owner_id` (FK → users) and `visibility` enum columns to the `docs` table
- [ ] Add a `doc_collaborators` join table (`doc_id`, `user_id`, `role`)
- [ ] Implement role-check middleware/extractor used by `GET /api/docs/:id`, `PATCH`, and `DELETE`
- [ ] Enforce role check on WebSocket upgrade (`/ws/:room_id`) — reject or downgrade to read-only for Viewers
- [ ] Implement `POST /api/docs/:id/collaborators` — invite a user by email with a given role
- [ ] Implement `DELETE /api/docs/:id/collaborators/:user_id` — remove a collaborator
- [ ] Implement `POST /api/docs/:id/share-link` and `DELETE /api/docs/:id/share-link` — generate / revoke a link
- [ ] Expose `visibility` and `role` (caller's effective role) in `DocResponse` and the frontend `Doc` type
