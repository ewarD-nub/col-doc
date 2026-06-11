import { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { docsApi } from '../api/docs';

/**
 * Syncs the document title to/from a `Y.Text` entry in the shared Yjs doc.
 * Using Yjs for the title means renaming is also collaborative — two users
 * editing the title at the same time will merge automatically.
 *
 * @param ydoc  - The shared Yjs document.
 * @param docId - REST document ID used to persist the title to the backend.
 * @returns [title, setTitle] — read the current title, or update it.
 *
 * TODO: show a "saving…" indicator while the PATCH is in-flight.
 * TODO: handle PATCH errors with a toast notification.
 */
export function useDocTitle(ydoc: Y.Doc, docId?: string): [string, (t: string) => void] {
  const yTitle = ydoc.getText('title');

  const [title, setLocalTitle] = useState<string>(yTitle.toString() || 'Untitled Document');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = () => {
      const t = yTitle.toString() || 'Untitled Document';
      setLocalTitle(t);
      document.title = t;
    };
    yTitle.observe(handler);
    return () => yTitle.unobserve(handler);
  }, [yTitle]);

  const setTitle = (newTitle: string) => {
    ydoc.transact(() => {
      yTitle.delete(0, yTitle.length);
      yTitle.insert(0, newTitle);
    });
    document.title = newTitle || 'Untitled Document';

    // Debounce the REST call so rapid keystrokes don't spam the backend.
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (docId) docsApi.updateTitle(docId, newTitle).catch(() => {});
    }, 600);
  };

  return [title, setTitle];
}
