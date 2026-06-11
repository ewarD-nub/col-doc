# System Architecture

col-doc is a real-time collaborative document editor (Google Docs-style) built on a React frontend and a Rust backend. Documents are kept in sync across clients using the Yjs CRDT library.

---

## Components

```
┌─────────────────────────────────────┐
│              Browser                │
│                                     │
│  React + TipTap editor              │
│  Yjs document (in-memory CRDT)      │
│  y-websocket provider               │
│                                     │
│  ┌──────────┐   ┌────────────────┐  │
│  │ REST API │   │  WebSocket     │  │
│  │ (fetch)  │   │  /ws/:room_id  │  │
│  └────┬─────┘   └───────┬────────┘  │
└───────┼─────────────────┼───────────┘
        │                 │
        ▼                 ▼
┌───────────────────────────────────┐
│          Rust / Axum server       │
│                                   │
│  REST handlers (api::docs,        │
│                 api::auth)        │
│                                   │
│  WebSocket handler (ws::handler)  │
│  · per-room in-memory state       │
│  · Yjs update log (Vec<Vec<u8>>)  │
│  · awareness fan-out              │
│                                   │
│  AppState (Arc<RwLock<Rooms>>)    │
└──────────┬────────────────────────┘
           │  (planned)
           ▼
┌───────────────────────────────────┐
│  PostgreSQL                       │
│  · users, docs, collaborators     │
│  · Yjs update log / snapshots     │
└───────────────────────────────────┘
           │  (planned)
           ▼
┌───────────────────────────────────┐
│  Redis                            │
│  · active sessions                │
│  · pub/sub for horizontal scale   │
│  · ephemeral presence (cursors)   │
└───────────────────────────────────┘
```

---

## Frontend (`frontend/`)

| Layer | Technology |
|---|---|
| UI framework | React 18 |
| Routing | React Router v6 |
| State management | Zustand |
| Editor | TipTap (ProseMirror) |
| CRDT | Yjs (`y-prosemirror`, `y-websocket`) |
| Server state / cache | TanStack Query |
| Build tool | Vite |
| Language | TypeScript |

Key source paths:
- `src/hooks/useYjsDoc.ts` — creates the `Y.Doc` and `WebsocketProvider` for a room
- `src/hooks/useDocTitle.ts` — syncs the document title via Yjs + REST
- `src/pages/EditorPage.tsx` — full editor view (TipTap + Yjs extensions)
- `src/pages/HomePage.tsx` — document list
- `src/api/` — typed REST helpers (`docs.ts`, `client.ts`)

---

## Backend (`backend/`)

| Layer | Technology |
|---|---|
| Web framework | Axum 0.7 |
| Async runtime | Tokio |
| WebSocket | Axum built-in (`axum::extract::ws`) |
| Serialisation | Serde / serde_json |
| Auth tokens | `jsonwebtoken` (wiring in progress) |
| Password hashing | `sha2` → planned migration to Argon2id |
| Language | Rust (edition 2024) |

Key source paths:
- `src/main.rs` — router setup, CORS, server startup
- `src/state.rs` — in-memory `AppState`: rooms, doc metadata, connected clients
- `src/ws/handler.rs` — per-connection WebSocket logic (sync + awareness)
- `src/ws/protocol.rs` — Yjs binary protocol helpers (varint, message constructors)
- `src/api/docs.rs` — CRUD handlers for documents
- `src/api/auth.rs` — auth handlers (signup stub, login WIP)

---

## Data flow: editing a document

```
User types in TipTap
    │
    ▼
y-prosemirror converts keystroke → Yjs update
    │
    ▼
y-websocket serialises update → binary frame
    │   [MSG_SYNC=0, SYNC_UPDATE=2, varint(len), ...bytes]
    ▼
WebSocket → server ws::handler
    │
    ├── appends update to room.updates (in-memory log)
    │
    └── fans out update frame to all other connected clients
            │
            ▼
        y-websocket on peer client deserialises frame
            │
            ▼
        Yjs merges update into local Y.Doc (CRDT, conflict-free)
            │
            ▼
        y-prosemirror applies change to ProseMirror → TipTap re-renders
```

---

## Sync handshake (initial load)

```
Client connects to /ws/:room_id
    │
    ▼
Server sends SyncStep1 (empty state vector)
    │
    ▼
Client receives Step1, replies with its own state + full update
    │
    ▼
Server stores update, fans out to any other peers already in room
    │
    ▼
Server replays all stored updates back to the new client
    │
    ▼
Client applies all updates → document is fully up-to-date
```

See `docs/websocket-protocol.md` for the binary wire format.

---

## Planned infrastructure additions

| Feature | Work needed |
|---|---|
| Persistent storage | Add `sqlx` PgPool to `AppState`; run migrations on startup |
| Auth | Wire JWT middleware; implement login/refresh handlers |
| Redis presence | Replace in-memory awareness with Redis pub/sub |
| Horizontal scale | Multiple server instances sharing state via Redis |
| Yjs snapshots | Merge update log with `yrs` on flush; store in Postgres |
| Email | Add `lettre` crate for verification codes and doc-share invites |
