import { useEffect, useState } from 'react';
import { WebsocketProvider } from 'y-websocket';

export interface CollabUser {
  clientId: number;
  name:  string;
  color: string;
  // TODO: avatar?: string  — user profile picture URL
}

/**
 * Reads the awareness state from the Yjs provider and returns a list of
 * currently connected users (excluding the local client).
 *
 * TODO: this hook is a stub — y-websocket's awareness API needs to be wired
 *       up with @tiptap/extension-collaboration-cursor for actual cursor
 *       rendering inside the editor.
 *
 * Usage today:
 *   const peers = useCollabCursors(provider)
 *   // render <AvatarStack users={peers} /> in the header
 *
 * Full cursor TODO list:
 *   1. Install @tiptap/extension-collaboration-cursor
 *   2. Pass provider.awareness to CollaborationCursor.configure({ ... })
 *   3. Set local user info: provider.awareness.setLocalStateField('user', { name, color })
 *   4. Style cursor labels via CSS (.collaboration-cursor__label)
 */
export function useCollabCursors(provider: WebsocketProvider): CollabUser[] {
  const [peers, setPeers] = useState<CollabUser[]>([]);

  useEffect(() => {
    const { awareness } = provider;

    const update = () => {
      const states: CollabUser[] = [];
      awareness.getStates().forEach((state, clientId) => {
        if (clientId === awareness.clientID) return; // skip self
        if (state.user) {
          states.push({
            clientId,
            name:  state.user.name  ?? 'Anonymous',
            color: state.user.color ?? '#888',
          });
        }
      });
      setPeers(states);
    };

    awareness.on('change', update);
    update(); // populate immediately

    // TODO: set local user info here once auth provides a name/color
    // awareness.setLocalStateField('user', { name: currentUser.name, color: randomColor() })

    return () => awareness.off('change', update);
  }, [provider]);

  return peers;
}
