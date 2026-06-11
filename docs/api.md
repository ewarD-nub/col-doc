# REST API Reference

Base URL: `http://localhost:8080` (configured via `VITE_API_URL` / `BIND_ADDR`)

All request and response bodies are JSON. Endpoints that return a body set `Content-Type: application/json`.

> **Auth note**: JWT authentication is not yet wired up. All endpoints currently accept any request. Once auth is implemented, protected endpoints will require an `Authorization: Bearer <token>` header.

---

## Documents

### `GET /api/docs`

Returns all documents visible to the current user.

**Response `200 OK`**
```json
[
  {
    "id": "welcome",
    "title": "Welcome Document",
    "updated_at": 1715000000000
  }
]
```

| Field | Type | Description |
|---|---|---|
| `id` | string | Document identifier (UUID or slug) |
| `title` | string | Display name of the document |
| `updated_at` | number | Last-modified timestamp (Unix ms) |

**Planned additions**: filter by owner, `?limit=` / `?offset=` pagination.

---

### `POST /api/docs`

Creates a new blank document titled "Untitled Document".

**Response `201 Created`**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Untitled Document",
  "updated_at": 1715000000000
}
```

---

### `GET /api/docs/:id`

Fetches metadata for a single document.

**Response `200 OK`** — same shape as an item in `GET /api/docs`.

**Response `404 Not Found`** — document does not exist.

---

### `PATCH /api/docs/:id`

Renames a document.

**Request body**
```json
{ "title": "My new title" }
```

**Response `200 OK`** — updated document object.

**Response `404 Not Found`** — document does not exist.

**Note**: the frontend also syncs the title collaboratively via Yjs (`Y.Text` keyed `"title"`). The PATCH call persists the settled title to the server metadata so the document list stays up-to-date.

---

### `DELETE /api/docs/:id`

Permanently deletes a document and removes it from the in-memory room.

**Response `204 No Content`** — deleted successfully.

**Response `404 Not Found`** — document does not exist.

**Planned**: soft-delete (`deleted_at` timestamp), owner-only guard, graceful WS close for active connections.

---

## Authentication

> All auth endpoints are planned / partially stubbed. The routes below are not yet active.

### `POST /api/auth/signup`

Creates a new user account. Sends a verification email.

**Request body** *(planned)*
```json
{
  "username": "alice",
  "email": "alice@example.com",
  "password": "hunter2"
}
```

**Response `201 Created`** — user object (no tokens yet; user must verify email first).

---

### `POST /api/auth/login` *(planned)*

Authenticates with username/email + password.

**Request body**
```json
{
  "username_or_email": "alice",
  "password": "hunter2"
}
```

**Response `200 OK`**
```json
{
  "access_token": "<JWT>",
  "username": "alice",
  "email": "alice@example.com",
  "preferences": {}
}
```

Refresh token is set as an HTTP-only cookie.

---

### `POST /api/auth/refresh` *(planned)*

Issues a new access token using the refresh token cookie. Rotates the refresh token.

**Response `200 OK`** — `{ "access_token": "<JWT>" }`

---

### `POST /api/auth/logout` *(planned)*

Invalidates the current refresh token server-side.

**Response `204 No Content`**

---

## WebSocket

### `GET /ws/:room_id` → WebSocket upgrade

Opens a real-time collaboration session for the document identified by `room_id`.

- `room_id` matches a document `id` from the REST API.
- The server creates the room on first connection if it does not exist.
- Binary frames only; uses the y-websocket protocol (see `docs/websocket-protocol.md`).

**Planned**: JWT verification on upgrade; reject or downgrade to read-only based on the caller's role.

---

## Error format *(planned)*

Once the `errors` module is implemented, all error responses will use a consistent JSON body:

```json
{
  "error": "not_found",
  "message": "Document 'abc' does not exist"
}
```

Currently, non-2xx responses may return an empty body.
