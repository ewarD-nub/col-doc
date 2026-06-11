use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::{Deserialize, Serialize};

use crate::state::{AppState, DocMeta, RoomState, new_doc_id};

// ── Response shape ─────────────────────────────────────────────────────────

#[derive(Serialize)]
pub struct DocResponse {
    pub id:         String,
    pub title:      String,
    pub updated_at: u64,
}

impl From<&DocMeta> for DocResponse {
    fn from(m: &DocMeta) -> Self {
        Self { id: m.id.clone(), title: m.title.clone(), updated_at: m.updated_at }
    }
}

// ── Request shapes ─────────────────────────────────────────────────────────

#[derive(Deserialize)]
pub struct UpdateTitlePayload {
    pub title: String,
    // TODO: add `content` field for programmatic doc updates
}

// TODO: GET /api/docs/:id/history — return ordered list of stored Yjs update blobs with timestamps
// TODO: GET /api/docs/:id/history/:seq/diff — return a computed diff between two snapshots

// ── Handlers ──────────────────────────────────────────────────────────────

/// GET /api/docs
pub async fn list(State(state): State<AppState>) -> impl IntoResponse {
    // TODO: filter by authenticated user once auth is wired up
    // TODO: support ?limit=&offset= query params for pagination
    // TODO: load from Postgres instead of in-memory rooms
    let rooms = state.rooms.read().await;
    let docs: Vec<DocResponse> = rooms.values().map(|r| (&r.meta).into()).collect();
    Json(docs)
}

/// POST /api/docs
pub async fn create(State(state): State<AppState>) -> impl IntoResponse {
    let id    = new_doc_id();
    let title = "Untitled Document".to_string();
    let meta  = DocMeta::new(id.clone(), title.clone());

    {
        let mut rooms = state.rooms.write().await;
        rooms.insert(id.clone(), RoomState::new(meta.clone()));
        // TODO: persist new doc to Postgres (INSERT INTO docs ...)
        // TODO: associate with authenticated user as owner
    }

    (StatusCode::CREATED, Json(DocResponse::from(&meta)))
}

/// GET /api/docs/:id
pub async fn get(
    Path(id):     Path<String>,
    State(state): State<AppState>,
) -> impl IntoResponse {
    let rooms = state.rooms.read().await;
    match rooms.get(&id) {
        Some(room) => Ok(Json(DocResponse::from(&room.meta))),
        // TODO: return proper JSON error body instead of empty 404
        None => Err(StatusCode::NOT_FOUND),
    }
}

/// PATCH /api/docs/:id
pub async fn update_title(
    Path(id):     Path<String>,
    State(state): State<AppState>,
    Json(body):   Json<UpdateTitlePayload>,
) -> impl IntoResponse {
    let mut rooms = state.rooms.write().await;
    match rooms.get_mut(&id) {
        Some(room) => {
            room.meta.title      = body.title.clone();
            room.meta.updated_at = crate::state::unix_ms();
            // TODO: persist title change to Postgres (UPDATE docs SET title = ...)
            // TODO: broadcast title change to connected WS clients via awareness
            Ok(Json(DocResponse::from(&room.meta)))
        }
        None => Err(StatusCode::NOT_FOUND),
    }
}

/// DELETE /api/docs/:id
pub async fn delete(
    Path(id):     Path<String>,
    State(state): State<AppState>,
) -> impl IntoResponse {
    let mut rooms = state.rooms.write().await;
    // TODO: check that the authenticated user is the owner before deleting
    // TODO: soft-delete (set deleted_at) rather than hard remove
    // TODO: close any active WS connections for this room gracefully
    match rooms.remove(&id) {
        Some(_) => StatusCode::NO_CONTENT,
        None    => StatusCode::NOT_FOUND,
    }
}
