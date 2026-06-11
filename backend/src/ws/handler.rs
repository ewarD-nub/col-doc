use axum::{
    extract::{Path, State, WebSocketUpgrade},
    extract::ws::{Message, WebSocket},
    response::IntoResponse,
};
use futures::{SinkExt, StreamExt};
use tokio::sync::mpsc;
use uuid::Uuid;

use crate::state::{AppState, ClientTx, DocMeta, RoomState};
use crate::ws::protocol::{
    MSG_SYNC, MSG_AWARENESS,
    SYNC_STEP1, SYNC_STEP2, SYNC_UPDATE,
    extract_update, is_empty_update,
    make_sync_step1, make_sync_step2_empty, make_update_msg,
};

// ── HTTP upgrade ───────────────────────────────────────────────────────────

pub async fn ws_handler(
    ws:              WebSocketUpgrade,
    Path(room_id):   Path<String>,
    State(state):    State<AppState>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, room_id, state))
}

// ── Per-connection logic ───────────────────────────────────────────────────

pub async fn handle_socket(socket: WebSocket, room_id: String, state: AppState) {
    let (mut ws_tx, mut ws_rx) = socket.split();
    let (client_tx, mut client_rx) = mpsc::unbounded_channel::<Vec<u8>>();
    let client_id = Uuid::new_v4();

    // Register this client in the room, creating the room if needed.
    {
        let mut rooms = state.rooms.write().await;
        let room = rooms.entry(room_id.clone()).or_insert_with(|| {
            // TODO: load existing doc + updates from Postgres before accepting
            //       the first WS connection (cold-start rehydration).
            let meta = DocMeta::new(room_id.clone(), format!("Document {room_id}"));
            RoomState::new(meta)
        });
        room.clients.insert(client_id, client_tx.clone());
    }

    // Tell client to send us their full state (empty state vector = "give me everything").
    let _ = client_tx.send(make_sync_step1());

    // Spawn a task that drains the per-client channel → WebSocket send half.
    // This decouples sending from receiving so neither blocks the other.
    let forward_task = tokio::spawn(async move {
        while let Some(msg) = client_rx.recv().await {
            if ws_tx.send(Message::Binary(msg.into())).await.is_err() {
                break; // client disconnected
            }
        }
    });

    // Main receive loop.
    while let Some(Ok(msg)) = ws_rx.next().await {
        let data: Vec<u8> = match msg {
            Message::Binary(b) => b.to_vec(),
            Message::Close(_)  => break,
            _                  => continue,
        };

        if data.is_empty() { continue; }

        match data[0] {
            // ── Sync messages ──────────────────────────────────────────────
            MSG_SYNC if data.len() > 1 => match data[1] {
                SYNC_STEP1 => {
                    // Client asks what the server has.
                    // Reply: empty sync-step-2 + replay every stored update.
                    // TODO: parse the client's state vector (data[2..]) and
                    //       send only the diff once `yrs` is integrated.
                    let updates = {
                        let rooms = state.rooms.read().await;
                        rooms.get(&room_id)
                            .map(|r| r.updates.clone())
                            .unwrap_or_default()
                    };
                    let _ = client_tx.send(make_sync_step2_empty());
                    for u in updates {
                        let _ = client_tx.send(make_update_msg(&u));
                    }
                }

                SYNC_STEP2 | SYNC_UPDATE => {
                    // A new update arrived — persist it and fan-out to peers.
                    if let Some(update) = extract_update(&data) {
                        if !is_empty_update(&update) {
                            let peers: Vec<ClientTx> = {
                                let mut rooms = state.rooms.write().await;
                                if let Some(room) = rooms.get_mut(&room_id) {
                                    room.updates.push(update.clone());
                                    // TODO: after N updates, compact the log
                                    //       by merging via `yrs::merge_updates_v1`.
                                    // TODO: debounce & flush snapshot to Postgres.
                                    room.clients.iter()
                                        .filter(|(&id, _)| id != client_id)
                                        .map(|(_, tx)| tx.clone())
                                        .collect()
                                } else {
                                    Vec::new()
                                }
                            };
                            let wire = make_update_msg(&update);
                            for tx in peers {
                                let _ = tx.send(wire.clone());
                            }
                        }
                    }
                }

                _ => {
                    // TODO: log unknown sync subtype for debugging
                }
            },

            // ── Awareness (cursor positions, selection, user info) ──────────
            MSG_AWARENESS => {
                // Forward raw awareness frame to all other peers.
                // TODO: parse awareness payload and remove stale entries for
                //       clients that have already disconnected.
                // TODO: store the latest awareness state per client so new
                //       joiners see existing cursors immediately.
                let peers: Vec<ClientTx> = {
                    let rooms = state.rooms.read().await;
                    rooms.get(&room_id)
                        .map(|r| r.clients.iter()
                            .filter(|(&id, _)| id != client_id)
                            .map(|(_, tx)| tx.clone())
                            .collect())
                        .unwrap_or_default()
                };
                for tx in peers {
                    let _ = tx.send(data.clone());
                }
            }

            _ => {
                // TODO: handle MSG_AUTH (type 2) — verify token, deny if invalid
            }
        }
    }

    // ── Cleanup on disconnect ──────────────────────────────────────────────
    {
        let mut rooms = state.rooms.write().await;
        if let Some(room) = rooms.get_mut(&room_id) {
            room.clients.remove(&client_id);
            // TODO: broadcast an awareness update that removes this client's cursor.
            // TODO: if room.clients is empty, schedule a snapshot flush to DB.
        }
    }
    forward_task.abort();
}
