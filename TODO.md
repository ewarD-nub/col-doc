
# Collaborative Editor — TODOs

---

## Frontend (React)

### State Management
- [x] Zustand store (`useAppStore`) — sidebar state
- [ ] Add document state to store (title, dirty flag, save status)
- [ ] Add collaborators list to store (sourced from awareness)

### Editor
- [x] Integrate TipTap with `StarterKit`
- [x] Yjs collaboration via `y-prosemirror` (`ySyncPlugin`, `yUndoPlugin`)
- [ ] Add `Placeholder` extension — "Start writing…"
- [ ] Add `CollaborationCursor` extension for live cursor highlights
- [ ] Add `Link` extension
- [ ] Add `Image` extension with upload handler
- [ ] Add `Table` extension
- [ ] Add `TaskList` + `TaskItem` for checklist support
- [ ] Add `Suggestion`/autocomplete extension for word and sentence completion
- [ ] Add vim-mode keymap plugin (enabled via preferences)

### Real-time Sync
- [x] Connect to WebSocket backend via `y-websocket`
- [x] Send and apply incremental Yjs updates (not full document)
- [x] Handle reconnect via `y-websocket` built-in retry
- [ ] Show loading skeleton while initial Yjs sync completes
- [ ] Support IndexedDB persistence (`y-indexeddb`) for offline editing
- [ ] Support WebRTC fallback (`y-webrtc`) when server is unreachable

### Presence & Collaboration UI
- [x] `CollabCursors` component (shell in place)
- [x] `ConnectionBadge` component
- [ ] Wire up `CollaborationCursor` extension to show live coloured cursors
- [ ] Display collaborator name labels alongside cursors
- [ ] Show presence avatars in editor header

### Document Title
- [x] Collaborative title via `Y.Text` in `useDocTitle`
- [x] Browser `<title>` tag updates on title change
- [x] Debounced `PATCH /api/docs/:id` on title change (600 ms)

### Home Page
- [x] List documents from `GET /api/docs`
- [x] Create new document and navigate to editor
- [x] Auto-refresh list every 30 s
- [ ] Search / filter input
- [ ] Sort options (by name, by last modified)
- [ ] Grid / list view toggle
- [ ] Rename and delete context menu per row
- [ ] Pagination or infinite scroll for large lists
- [ ] Show collaborator avatars per row

### Layout & Styling
- [x] App shell with header, main area, React Router routes
- [ ] Sidebar (`<Sidebar>`) — doc tree / recent files
- [ ] Fix any UI issues (headings rendering as links, etc.)
- [ ] Mobile-responsive layout for editor and toolbar
- [ ] Light / dark theme toggle (`ThemeToggle` component)

### Auth UI
- [ ] Sign up page
- [ ] Login page (password + magic link)
- [ ] `UserMenu` component (avatar, logout)
- [ ] Auth-guarded routes (redirect to login if not authenticated)

### Settings
- [ ] `/settings` page with preferences form (theme, font, vim mode, auto-save)

### Error Handling
- [ ] Toast notification system
- [ ] "Reconnecting…" indicator in `ConnectionBadge`
- [ ] Handle server errors from REST calls (show toast on 401 / 5xx)

### Sharing & Export
- [ ] `ShareButton` — invite collaborator by email, generate share link
- [ ] Export to PDF / DOCX via backend endpoint
- [ ] Public read-only embed link

### Version History
- [ ] `VersionHistoryButton` — opens history panel
- [ ] Show list of saved snapshots with timestamps
- [ ] Inline diff view between any two snapshots

### API Client (finish the in-progress refactor)
- [x] Restore the fetch-based `http` client so `docsApi` compiles again
- [ ] Finish migrating `docsApi` from the fetch `http` object to the axios `ApiClient` (`api/client.ts` + `api/http-client.ts`)
- [ ] Wire `field-sessions/Api` into a real feature module, or delete the unused scaffold
- [ ] Implement `injectAuthToken` interceptor — attach `Authorization: Bearer <token>`
- [ ] Add a response interceptor that refreshes the token on 401 and retries
- [ ] Map `ApiError` (status + parsed JSON body) into user-facing messages

### Internationalisation
- [x] `IntlProvider` wired with `translations/en.json`
- [ ] Extract hard-coded UI strings into `en.json` messages
- [ ] Add more locale files + a language switcher in `UserMenu` / settings
- [ ] Add a message-extraction script to keep `en.json` in sync

### Testing
- [ ] Add Vitest + React Testing Library
- [ ] Unit-test hooks: `useDocTitle`, `useYjsDoc`, `useCollabCursors`
- [ ] Component tests for `HomePage` and `ConnectionBadge`
- [ ] Playwright E2E for create-doc → edit → reconnect flow

### Build & Tooling
- [ ] Code-split the editor route via `React.lazy` — main bundle is >950 kB (Yjs + TipTap + MUI)
- [ ] Add `.env.example` documenting `VITE_API_URL`
- [ ] Add a CI workflow: `lint` + `tsc -b` + `build` on every PR
- [ ] Dockerfile + static hosting config (nginx / Caddy)
- [ ] Decide on a single package manager (both `package-lock.json` and `pnpm-lock.yaml` are committed)

---

## Backend (Rust)

### WebSocket Server
- [x] Axum WebSocket upgrade handler (`/ws/:room_id`)
- [x] Per-connection send/receive loop with `mpsc` channel
- [x] Yjs sync protocol: `SyncStep1`, `SyncStep2`, `Update`
- [x] Awareness fan-out to peers
- [x] Clean up client on disconnect
- [ ] Parse client state vector in `SyncStep1` and send only the diff (requires `yrs`)
- [ ] Compact update log by merging via `yrs::merge_updates_v1`
- [ ] Parse awareness payload on disconnect and broadcast "client left" frame
- [ ] Store latest awareness state per client so new joiners see existing cursors
- [ ] Enforce role check on WebSocket upgrade (viewer = read-only)

### Document REST API
- [x] `GET /api/docs` — list all docs
- [x] `POST /api/docs` — create new doc
- [x] `GET /api/docs/:id` — get doc metadata
- [x] `PATCH /api/docs/:id` — rename doc
- [x] `DELETE /api/docs/:id` — delete doc
- [ ] Return proper JSON error body on 404 / 4xx / 5xx
- [ ] Filter `GET /api/docs` by authenticated user
- [ ] `?limit=` / `?offset=` pagination on list
- [ ] Soft-delete (`deleted_at`) instead of hard remove
- [ ] `GET /api/docs/:id/history` — list stored Yjs snapshots with timestamps
- [ ] `GET /api/docs/:id/history/:seq/diff` — compute diff between two snapshots
- [ ] `POST /api/docs/:id/collaborators` — invite collaborator by email + role
- [ ] `DELETE /api/docs/:id/collaborators/:user_id` — remove collaborator
- [ ] `POST /api/docs/:id/share-link` / `DELETE` — generate / revoke share link

### Authentication (`api/auth`)
- [x] `POST /api/auth/signup` stub in place
- [ ] Implement signup — hash password with Argon2id, persist user, send email OTP
- [ ] Implement `POST /api/auth/login` — verify credentials, issue JWT + HTTP-only refresh token
- [ ] Implement `POST /api/auth/refresh` — rotate refresh token, reissue access token
- [ ] Implement `POST /api/auth/logout` — invalidate refresh token
- [ ] Implement email magic-link / OTP login
- [ ] Rate-limit auth endpoints

### Auth Middleware
- [ ] JWT extraction middleware / extractor
- [ ] Role guard for protected REST routes
- [ ] Pass auth token to WebSocket via `?token=` query param

### Users (`api/users`)
- [ ] `GET /api/users/me` — current user profile
- [ ] `PATCH /api/users/me/preferences` — save preferences
- [ ] Avatar upload endpoint

### Infrastructure Modules
- [ ] `config` module — load `.env` into a typed `Config` struct
- [ ] `db` module — `sqlx` PgPool, connection from env, run migrations on startup
- [ ] `errors` module — unified error types (`thiserror`) implementing `IntoResponse`
- [ ] `auth` middleware module — JWT extraction + role guards

### Persistence (PostgreSQL)
- [ ] Schema: `users`, `docs`, `doc_collaborators`, `refresh_tokens`, `doc_snapshots`
- [ ] Load documents from Postgres on startup (replace hard-coded seed)
- [ ] Persist new docs on `POST /api/docs`
- [ ] Persist title changes on `PATCH /api/docs/:id`
- [ ] Flush Yjs snapshot to Postgres on room idle / periodic interval

### Redis Integration
- [ ] Store active sessions in Redis
- [ ] Use Redis pub/sub for WebSocket fan-out (enables horizontal scaling)
- [ ] Store ephemeral presence (cursor positions) in Redis

### Email
- [ ] Add `lettre` crate
- [ ] Send email verification code on signup
- [ ] Send doc-share invitation emails

### Observability
- [ ] Structured logging with `tracing` + `tracing-subscriber`
- [ ] Propagate a request / trace ID into each WebSocket session
- [ ] `/healthz` and `/readyz` endpoints
- [ ] Prometheus metrics — active rooms, connected clients, update throughput

### Testing
- [ ] Unit tests for the Yjs sync protocol encode/decode helpers
- [ ] Integration test for the WebSocket sync handshake
- [ ] REST handler tests against the in-memory store
- [ ] Load test concurrent editors on a single room

### Deployment & Config
- [ ] Multi-stage `Dockerfile` for the server
- [ ] `docker-compose` with Postgres + Redis for local dev
- [ ] CORS configuration sourced from env
- [ ] Graceful shutdown — drain WebSocket connections and flush snapshots
- [ ] CI workflow: `cargo fmt --check`, `cargo clippy`, `cargo test`

---

## Documentation
- [x] `docs/authentication.md` — auth requirements and TODOs
- [x] `docs/authorisation.md` — access control requirements and TODOs
- [x] `docs/preferences.md` — user preferences requirements and TODOs
- [x] `docs/architecture.md` — system overview, component diagram, data-flow diagrams
- [x] `docs/websocket-protocol.md` — Yjs binary wire format, sync handshake, awareness
- [x] `docs/api.md` — REST API reference with request/response shapes
- [ ] Document CRDT / Yjs design decisions (why Yjs over OT)
- [ ] Document database schema (ER diagram or table definitions)
- [ ] Document deployment / environment variables

---

## Operation Format (wire spec)

Yjs handles the CRDT encoding. The server stores raw Yjs update blobs. The higher-level logical operation shape (for potential OT fallback or audit log) would be:

```json
{
  "type": "insert",
  "position": 10,
  "text": "hello",
  "user_id": "u1",
  "timestamp": 1715000000000
}
```

- [ ] Decide whether to store decoded operations alongside raw Yjs blobs
- [ ] Define operation schema if an audit log is needed


---
