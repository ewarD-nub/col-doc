import { WebsocketProvider } from 'y-websocket';
import { useCollabCursors } from '../hooks/useCollabCursors';

interface CollabCursorsProps {
  provider: WebsocketProvider;
}

/**
 * Renders an avatar stack for all currently connected collaborators.
 *
 * This component only shows WHO is in the document (avatar row in the header).
 * Actual in-editor cursor / selection highlights require
 * @tiptap/extension-collaboration-cursor — see useCollabCursors.ts for TODOs.
 *
 * TODO: fetch real user avatars from the users API once auth exists.
 * TODO: show a tooltip with the user's name on hover.
 * TODO: collapse avatars after N users into a "+X more" chip.
 * TODO: animate users joining / leaving with a fade.
 */
export function CollabCursors({ provider }: CollabCursorsProps) {
  const peers = useCollabCursors(provider);

  if (peers.length === 0) return null;

  return (
    <div className="collab-avatars">
      {peers.map((peer) => (
        <span
          key={peer.clientId}
          className="collab-avatar"
          style={{ backgroundColor: peer.color }}
          title={peer.name}
        >
          {peer.name.charAt(0).toUpperCase()}
        </span>
      ))}
    </div>
  );
}
