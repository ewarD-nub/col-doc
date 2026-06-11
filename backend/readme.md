Path A (recommended for your stack): Rust backend + Yjs frontend
Why this wins:
TipTap + Yjs is production-proven
Google Docs-like behavior already solved
Rust just acts as sync + persistence layer
Architecture:
React + TipTap + Yjs
        ↕ WebSocket
Rust (Axum) WebSocket server
        ↕
PostgreSQL (snapshots)

Rust does NOT need to understand CRDT internals deeply.

It just:

forwards updates
stores updates / snapshots
manages rooms



Done. Here's the summary of what was laid out:

  ---
  What was built

  Backend (backend/src/main.rs)

  - Axum WebSocket server at ws://localhost:8080/ws/:room_id
  - In-memory room store (RwLock<HashMap<RoomId, RoomState>>) —
  one per doc
  - Yjs relay protocol (no Yjs parsing needed):
    - Sends sync-step-1 (empty state vector) on connect → client
  responds with full state
    - Responds to client's sync-step-1 with empty sync-step-2 +
  replays all stored updates
    - On sync-step-2 / update → stores raw update blob,
  broadcasts to all other peers
    - awareness messages forwarded as-is (for cursors)
  - REST: GET /api/docs, POST /api/docs
  - CORS enabled for the Vite dev server

  Frontend

  - EditorPage — TipTap + y-prosemirror (ySyncPlugin +
  yUndoPlugin) + WebsocketProvider. No new packages needed —
  everything was already in package.json
  - HomePage — lists docs, "New Document" button calls POST
  /api/docs and navigates to the editor

  TODOs scattered in code

  ┌────────────┬─────────────────────────────────────────────┐
  │  Location  │                    TODO                     │
  ├────────────┼─────────────────────────────────────────────┤
  │ main.rs    │ Compact updates via yrs (Rust Yjs) instead  │
  │ rooms      │ of replaying all                            │
  ├────────────┼─────────────────────────────────────────────┤
  │ main.rs    │ Replace in-memory store with Postgres       │
  │            │ snapshots (sqlx dep already there)          │
  ├────────────┼─────────────────────────────────────────────┤
  │ main.rs    │ Wire up JWT auth (dep already there)        │
  ├────────────┼─────────────────────────────────────────────┤
  │ EditorPage │ Add collaboration cursors                   │
  │            │ (@tiptap/extension-collaboration-cursor)    │
  ├────────────┼─────────────────────────────────────────────┤
  │ EditorPage │ Toolbar (bold, italic, headings)            │
  ├────────────┼─────────────────────────────────────────────┤
  │ HomePage   │ Rename / delete docs, search, pagination    │
  └────────────┴─────────────────────────────────────────────┘

  To run

  # Terminal 1
  cd backend && cargo run

  # Terminal 2
  cd frontend && pnpm dev

✻ Churned for 8m 19s

❯ can you provide the file structure with todos in it            
                                                                
⏺ Searched for 1 pattern (ctrl+o to expand)                      
                                                                
⏺ col-doc/                                                       
  ├── backend/                                                  
  │   ├── Cargo.toml                          ✅ done            
  │   └── src/                                              
  │       └── main.rs                         ✅ done (scaffold) 
  │           ├── TODO: persist updates → Postgres (sqlx)   
  │           ├── TODO: compact Yjs update log (merge via `yrs`) 
  │           ├── TODO: JWT auth middleware                 
  │           ├── TODO: document rename / delete endpoints       
  │           └── TODO: read bind address from env / .env
  │                                                              
  └── frontend/                                                  
      ├── vite.config.ts                      ✅ done            
      ├── src/                                                   
      │   ├── main.tsx                        ✅ done            
      │   ├── App.tsx                         ✅ done (routing
  only)
      │   │
      │   ├── pages/
      │   │   ├── HomePage.tsx                ✅ done (scaffold)
      │   │   │   ├── TODO: move API base URL to VITE_API_URL env
   var
      │   │   │   ├── TODO: rename / delete document actions
      │   │   │   ├── TODO: search / filter input
      │   │   │   └── TODO: pagination
      │   │   │
      │   │   └── EditorPage.tsx              ✅ done (scaffold)
      │   │       ├── TODO: toolbar (bold, italic, headings,
  lists)
      │   │       ├── TODO: live cursors
  (@tiptap/extension-collaboration-cursor)
      │   │       ├── TODO: connection status indicator
  (provider.wsconnected)
      │   │       ├── TODO: Placeholder extension
      │   │       └── TODO: Image upload extension
      │   │
      │   ├── components/                     ❌ missing — needs
  creating
      │   │   ├── TODO: Toolbar.tsx
      │   │   ├── TODO: CollabCursors.tsx
      │   │   └── TODO: ConnectionBadge.tsx
      │   │
      │   ├── hooks/                          ❌ missing — needs
  creating
      │   │   ├── TODO: useYjsDoc.ts          (extract Yjs setup
  out of EditorPage)
      │   │   └── TODO: useDocTitle.ts        (sync doc title to
  Y.Text)
      │   │
      │   ├── store/                          ❌ missing — needs
  creating
      │   │   └── TODO: useAppStore.ts        (zustand — UI
  state, active doc, user)
      │   │
      │   └── styles.css                      ✅ exists (needs
  editor styles)
      │       └── TODO: style .editor-content (min-height, focus
  ring, prose)
      │
      └── package.json                        ✅ done
          └── TODO: pnpm add
  @tiptap/extension-collaboration-cursor

  Priority order to fill in TODOs:

  1. styles.css — editor looks broken without prose styles
  2. Toolbar.tsx → wire into EditorPage
  3. useYjsDoc.ts — clean up EditorPage
  4. VITE_API_URL env var
  5. Postgres persistence in main.rs
  6. Live cursors
