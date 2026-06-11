import { useEffect, useMemo } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { WS_BASE } from '../api/client';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

export interface YjsDoc {
  ydoc:     Y.Doc;
  provider: WebsocketProvider;
  fragment: Y.XmlFragment;
  // TODO: awareness: awarenessProtocol.Awareness  — expose for cursors
}

/**
 * Creates and manages a Yjs document + WebSocket provider for a given doc ID.
 * Tears down automatically when the component unmounts or `docId` changes.
 *
 * TODO: accept an optional `onSync` callback fired when the initial sync completes.
 * TODO: expose `provider.wsconnected` as a reactive status value.
 * TODO: support IndexedDB persistence (y-indexeddb) for offline editing.
 * TODO: support WebRTC fallback (y-webrtc) when the server is unreachable.
 */
export function useYjsDoc(docId: string): YjsDoc {
  const doc = useMemo(() => {
    const ydoc     = new Y.Doc();
    const provider = new WebsocketProvider(`${WS_BASE}/ws`, docId, ydoc, {
      connect: true,
      // TODO: pass auth token via `params: { token: getToken() }`
    });
    const fragment = ydoc.getXmlFragment('default');
    return { ydoc, provider, fragment };
  }, [docId]);

  useEffect(() => {
    return () => {
      doc.provider.destroy();
      doc.ydoc.destroy();
    };
  }, [doc]);

  return doc;
}
