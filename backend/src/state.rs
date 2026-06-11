use std::collections::HashMap;
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};
use tokio::sync::{RwLock, mpsc};
use uuid::Uuid;

// ── Primitive aliases ──────────────────────────────────────────────────────

pub type ClientId = Uuid;
pub type RoomId   = String;
pub type ClientTx = mpsc::UnboundedSender<Vec<u8>>;

// ── Document metadata ──────────────────────────────────────────────────────

#[derive(Clone)]
pub struct DocMeta {
    pub id:         String,
    pub title:      String,
    pub created_at: u64,
    pub updated_at: u64,
    // TODO: owner_id: Uuid  (foreign key to users table)
    // TODO: visibility: Visibility  (enum Public | Private | SharedLink)
}

impl DocMeta {
    pub fn new(id: impl Into<String>, title: impl Into<String>) -> Self {
        let now = unix_ms();
        Self {
            id: id.into(),
            title: title.into(),
            created_at: now,
            updated_at: now,
        }
    }
}

// ── Live room (in-memory, per WebSocket session) ───────────────────────────

pub struct RoomState {
    pub meta:    DocMeta,
    /// Append-only log of raw Yjs update blobs.
    /// TODO: replace with a single merged snapshot using `yrs` (Rust Yjs).
    /// TODO: flush to Postgres every N updates or on idle timeout.
    pub updates: Vec<Vec<u8>>,
    /// Live connected clients: client_id → their outbound channel.
    pub clients: HashMap<ClientId, ClientTx>,
}

impl RoomState {
    pub fn new(meta: DocMeta) -> Self {
        Self { meta, updates: Vec::new(), clients: HashMap::new() }
    }
}

// ── Shared application state ───────────────────────────────────────────────

#[derive(Clone)]
pub struct AppState {
    /// All rooms keyed by document ID.
    pub rooms: Arc<RwLock<HashMap<RoomId, RoomState>>>,
    // TODO: pub db: sqlx::PgPool  — inject on startup
    // TODO: pub jwt_secret: Arc<String>  — for auth middleware
}

impl AppState {
    pub fn new() -> Self {
        Self {
            rooms: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Seed the store with an initial document so the home page isn't empty.
    pub async fn seed(&self) {
        let mut rooms = self.rooms.write().await;
        let meta = DocMeta::new("welcome", "Welcome Document");
        rooms.insert("welcome".into(), RoomState::new(meta));
        // TODO: load persisted docs from Postgres instead of hard-coding
    }

}

// ── Helpers ────────────────────────────────────────────────────────────────

pub fn unix_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

pub fn new_doc_id() -> String {
    // Using UUID v4 for doc IDs; switch to nanoid for shorter URLs if desired.
    // TODO: consider a slug-based ID for sharable links
    Uuid::new_v4().to_string()
}
