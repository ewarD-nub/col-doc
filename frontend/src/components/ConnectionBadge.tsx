import { useEffect, useState } from 'react';
import { WebsocketProvider } from 'y-websocket';

interface ConnectionBadgeProps {
  provider: WebsocketProvider;
}

type Status = 'connecting' | 'connected' | 'disconnected';

const LABEL: Record<Status, string> = {
  connecting:   'Connecting…',
  connected:    'Live',
  disconnected: 'Offline',
};

/**
 * Shows a small pill indicating the WebSocket connection state.
 *
 * TODO: show a "Reconnecting in Xs…" countdown when disconnected.
 * TODO: add a manual "Reconnect" button for the disconnected state.
 * TODO: show a "Saving…" indicator when there are un-acked local updates.
 * TODO: animate the connected → disconnected transition.
 */
export function ConnectionBadge({ provider }: ConnectionBadgeProps) {
  const [status, setStatus] = useState<Status>(() =>
    provider.wsconnected ? 'connected' : 'connecting',
  );

  useEffect(() => {
    const onStatus = ({ status: s }: { status: string }) => {
      if (s === 'connected')    setStatus('connected');
      if (s === 'disconnected') setStatus('disconnected');
    };
    provider.on('status', onStatus);
    return () => provider.off('status', onStatus);
  }, [provider]);

  return (
    <span className={`connection-badge connection-badge--${status}`}>
      {LABEL[status]}
    </span>
  );
}
