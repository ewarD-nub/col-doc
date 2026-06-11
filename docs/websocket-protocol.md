# WebSocket Protocol

col-doc uses the **y-websocket** protocol to synchronise Yjs documents between the browser and the Rust server. All messages are binary (not JSON).

---

## Encoding

All multi-byte lengths are encoded as **lib0 varints** — the same unsigned varint format used by protobuf:

- Each byte contributes 7 data bits (bits 0–6).
- Bit 7 set (`0x80`) means "more bytes follow".
- Bit 7 clear means "this is the last byte".

Examples:

| Value | Encoded bytes |
|---|---|
| 0 | `00` |
| 127 | `7F` |
| 128 | `80 01` |
| 300 | `AC 02` |

The Rust implementation lives in `backend/src/ws/protocol.rs` (`write_varint` / `read_varint`).

---

## Message types

Every frame starts with a **1-byte message type**.

| Byte | Name | Description |
|---|---|---|
| `0x00` | `MSG_SYNC` | Yjs document synchronisation |
| `0x01` | `MSG_AWARENESS` | Cursor positions, selections, user info |
| `0x02` | `MSG_AUTH` | Authentication (planned, not yet implemented) |

---

## MSG_SYNC (`0x00`)

Layout: `[0x00, syncSubtype, varint(payloadLen), ...payload]`

| Subtype byte | Name | Payload | Direction |
|---|---|---|---|
| `0x00` | `SYNC_STEP1` | Encoded Yjs **state vector** of the sender | client → server, server → client |
| `0x01` | `SYNC_STEP2` | Full Yjs **update** covering everything the receiver is missing | reply to Step1 |
| `0x02` | `SYNC_UPDATE` | Incremental Yjs **update** (a single edit or batch of edits) | either direction |

### Sync handshake sequence

```
Client                          Server
  │                               │
  │  ← SyncStep1 (empty SV)       │  server sends first, on connect
  │                               │
  │  SyncStep2 (full client doc) →│  client replies with its full state
  │                               │
  │  ← SyncStep2 (empty)          │  server acknowledges
  │  ← Update (stored update 1)   │
  │  ← Update (stored update 2)   │  server replays all stored updates
  │  ← Update (stored update N)   │
  │                               │
  │       [fully synced]          │
  │                               │
  │  Update (new keystroke) →     │  incremental edits from here on
  │                               │
  │  ← Update (broadcast)         │  server fans out to other peers
```

**Current server behaviour**: the server sends an empty state vector in SyncStep1 (meaning "I have nothing, send everything") and replays the full stored update log. This is a simplification — once the `yrs` Rust crate is integrated, the server will parse the client's actual state vector and send only the diff.

### Yjs update format (brief)

A Yjs update blob is produced by `Y.encodeStateAsUpdate(doc)` or captured via `Y.Doc.on('update', ...)`. Its internal structure is managed entirely by the Yjs library. The server treats updates as **opaque bytes** — it stores and forwards them without interpreting the content.

---

## MSG_AWARENESS (`0x01`)

Layout: `[0x01, varint(payloadLen), ...awarenessBytes]`

Awareness frames carry ephemeral peer state: cursor position, text selection, user display name, and colour. The payload is encoded by the `y-protocols/awareness` module (also lib0 encoded).

**Current server behaviour**: the server forwards the raw frame to all other peers in the room without parsing it. The client-side `y-websocket` provider handles merging and expiry.

**Planned improvement**: the server should parse the awareness payload on disconnect and broadcast a "client left" frame to remove stale cursor overlays for peers that are still connected.

---

## MSG_AUTH (`0x02`) — planned

Layout: `[0x02, permissionDenied: u8, varint(reasonLen), ...reason?]`

When implemented:
- `permissionDenied = 0` → access granted (sent by server after JWT check on upgrade)
- `permissionDenied = 1` → access denied; `reason` is a UTF-8 string

The client should close the connection and show an error if it receives a denied frame.

---

## Example: a single keystroke end-to-end

User types `"a"` in the editor on Client A:

```
[Client A — y-prosemirror]
  TipTap keystroke → ProseMirror transaction
  y-prosemirror converts transaction → Y.XmlFragment update
  Y.Doc emits 'update' event with raw bytes (e.g. [0x01, 0x00, ...])

[Client A — y-websocket]
  wraps update → [0x00, 0x02, varint(len), ...updateBytes]
  sends over WebSocket

[Server — ws::handler]
  receives binary frame
  data[0] == MSG_SYNC (0x00), data[1] == SYNC_UPDATE (0x02)
  extracts update bytes via protocol::extract_update()
  appends to room.updates
  sends [0x00, 0x02, varint(len), ...updateBytes] to every other client

[Client B — y-websocket]
  receives binary frame
  passes to Y.Doc.applyUpdate()

[Client B — y-prosemirror]
  Yjs applies the CRDT update to Y.XmlFragment
  ProseMirror receives the change
  TipTap re-renders — "a" appears in Client B's editor
```

---

## References

- [y-websocket protocol source](https://github.com/yjs/y-websocket/blob/master/src/y-websocket.js)
- [Yjs CRDT internals](https://github.com/yjs/yjs)
- [lib0 encoding](https://github.com/dmonad/lib0)
- Server implementation: `backend/src/ws/`
