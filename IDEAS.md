# Ideas

## Editor features
* Diffing of previous changes — show a side-by-side or inline diff between any two saved snapshots.
* Preferences with vim-like editing support — normal / insert / visual modes via a ProseMirror keymap plugin.
* Auto-completion of words and sentences — suggest completions as the user types (TipTap Suggestion API or a custom plugin).
* Inline comments and suggestions — highlight a range and leave a threaded comment (like Google Docs comments).
* Emoji reactions on text selections — lightweight alternative to full comments.
* Table of contents — auto-generated from headings, shown in a collapsible sidebar panel.
* Word count and reading-time estimate — displayed in the editor footer.
* Syntax-highlighted inline code blocks — via a TipTap / ProseMirror code extension.
* Markdown paste — detect pasted Markdown and convert it to rich text automatically.
* Slash commands — type `/` to open a command palette (insert table, heading, image, etc.).

## Collaboration
* Presence avatars — show who is in the document right now with coloured cursors and name labels.
* @mentions — tag a collaborator in a comment and send them an email notification.
* Document activity feed — a panel showing recent edits, comments, and share events.
* Live multiplayer title editing — already partly done via Yjs `Y.Text`; add conflict resolution UI.

## Sharing and export
* Export to PDF / DOCX — via a backend endpoint that renders the Yjs document server-side.
* Public read-only share link — anyone with the link can view but not edit.
* Document embedding — generate an `<iframe>` snippet to embed a read-only view in other sites.
* Template library — start a new document from a pre-built template (meeting notes, spec, etc.).

## Infrastructure
* Offline editing — persist the Yjs doc to IndexedDB (`y-indexeddb`) and sync when back online.
* WebRTC fallback — use `y-webrtc` for peer-to-peer sync when the server is unreachable.
* AI writing assistant — integrate a Claude API call to suggest continuations, summaries, or rewrites of selected text.
* Full-text search — index document content in Postgres and expose a `GET /api/search?q=` endpoint.
* Mobile-responsive layout — adapt the editor shell and toolbar for small screens.
