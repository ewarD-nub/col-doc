/// Yjs / y-websocket binary protocol helpers.
///
/// y-websocket uses lib0 varint encoding (identical to protobuf unsigned
/// varint: 7 data bits per byte, MSB = "more bytes follow").
///
/// Message layout
/// ──────────────
/// [msgType: u8, payload...]
///
/// msgType 0 — Sync
///   [0, syncSubtype: u8, varint(len), ...bytes]
///   syncSubtype 0 = SyncStep1  (payload = encoded state vector)
///   syncSubtype 1 = SyncStep2  (payload = full Yjs update)
///   syncSubtype 2 = Update     (payload = incremental Yjs update)
///
/// msgType 1 — Awareness
///   [1, varint(len), ...awarenessBytes]
///
/// msgType 2 — Auth  (TODO: implement)
///   [2, permissionDenied: u8, ...reason?]

pub const MSG_SYNC:      u8 = 0;
pub const MSG_AWARENESS: u8 = 1;
// TODO: pub const MSG_AUTH: u8 = 2;

pub const SYNC_STEP1:  u8 = 0;
pub const SYNC_STEP2:  u8 = 1;
pub const SYNC_UPDATE: u8 = 2;

// ── Varint codec ───────────────────────────────────────────────────────────

pub fn write_varint(buf: &mut Vec<u8>, mut n: usize) {
    loop {
        if n < 128 {
            buf.push(n as u8);
            return;
        }
        buf.push((n as u8 & 0x7f) | 0x80);
        n >>= 7;
    }
}

/// Returns `(value, bytes_consumed)`.
pub fn read_varint(data: &[u8]) -> (usize, usize) {
    let mut n: usize = 0;
    let mut shift   = 0usize;
    for (i, &byte) in data.iter().enumerate() {
        n |= ((byte & 0x7f) as usize) << shift;
        shift += 7;
        if byte < 128 {
            return (n, i + 1);
        }
    }
    (n, data.len())
}

// ── Message constructors ───────────────────────────────────────────────────

/// `[MSG_SYNC, SYNC_STEP1, 0]`
/// Empty state vector = "I have nothing — send me everything."
pub fn make_sync_step1() -> Vec<u8> {
    vec![MSG_SYNC, SYNC_STEP1, 0]
}

/// `[MSG_SYNC, SYNC_STEP2, 2, 0, 0]`
/// Sync step 2 wrapping an empty Yjs update (0 structs, 0 delete sets).
pub fn make_sync_step2_empty() -> Vec<u8> {
    vec![MSG_SYNC, SYNC_STEP2, 2, 0, 0]
}

/// `[MSG_SYNC, SYNC_UPDATE, varint(len), ...update]`
pub fn make_update_msg(update: &[u8]) -> Vec<u8> {
    let mut msg = vec![MSG_SYNC, SYNC_UPDATE];
    write_varint(&mut msg, update.len());
    msg.extend_from_slice(update);
    msg
}

// ── Message parsers ────────────────────────────────────────────────────────

/// Extract the raw Yjs update payload from a SYNC_STEP2 or SYNC_UPDATE frame.
/// `data[0]` = MSG_SYNC, `data[1]` = subtype, `data[2..]` = varint(len) + bytes.
pub fn extract_update(data: &[u8]) -> Option<Vec<u8>> {
    if data.len() < 3 {
        return None;
    }
    let (len, consumed) = read_varint(&data[2..]);
    let start = 2 + consumed;
    if start + len <= data.len() {
        Some(data[start..start + len].to_vec())
    } else {
        None
    }
}

/// An empty Yjs update carries no information; skip storing / broadcasting it.
pub fn is_empty_update(u: &[u8]) -> bool {
    u.is_empty() || u == [0, 0]
}

// ── Tests ──────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn varint_roundtrip() {
        for n in [0usize, 1, 127, 128, 255, 16383, 16384] {
            let mut buf = Vec::new();
            write_varint(&mut buf, n);
            let (decoded, _) = read_varint(&buf);
            assert_eq!(decoded, n, "roundtrip failed for {n}");
        }
    }

    #[test]
    fn extract_update_roundtrip() {
        let payload = vec![1u8, 2, 3, 4];
        let msg = make_update_msg(&payload);
        let extracted = extract_update(&msg).expect("should extract");
        assert_eq!(extracted, payload);
    }

    // TODO: test make_sync_step1 byte layout
    // TODO: test make_sync_step2_empty byte layout
    // TODO: fuzz extract_update with random inputs
}
