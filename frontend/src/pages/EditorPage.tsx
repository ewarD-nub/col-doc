import { useParams } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import { Extension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { ySyncPlugin, yUndoPlugin } from 'y-prosemirror';

import { useYjsDoc } from '../hooks/useYjsDoc';
import { useDocTitle } from '../hooks/useDocTitle';
import { Toolbar } from '../components/Toolbar';
import { ConnectionBadge } from '../components/ConnectionBadge';
import { CollabCursors } from '../components/CollabCursors';

// Thin TipTap extension that mounts the two y-prosemirror plugins.
// Defined outside the component so the class identity is stable across renders.
const YjsCollab = Extension.create({
  name: 'yjsCollab',
  addOptions() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { fragment: null as any };
  },
  addProseMirrorPlugins() {
    return [
      ySyncPlugin(this.options.fragment), // keeps ProseMirror ↔ Y.XmlFragment in sync
      yUndoPlugin(),                      // Yjs-aware undo/redo (replaces TipTap history)
    ];
  },
});

/**
 * Full collaborative editor page.
 *
 * TODO: add a document title bar with inline editing (useDocTitle hook).
 * TODO: add @tiptap/extension-collaboration-cursor for live cursor highlights.
 * TODO: show a loading skeleton while the initial Yjs sync completes.
 * TODO: add keyboard shortcut hints in the toolbar tooltips.
 * TODO: add a comment / suggestion sidebar.
 * TODO: add document version history (list stored Yjs updates from the server).
 * TODO: add export to PDF / DOCX via a backend endpoint.
 */
export function EditorPage() {
  const { id } = useParams<{ id: string }>();

  const { ydoc, provider, fragment } = useYjsDoc(id!);
  const [title, setTitle] = useDocTitle(ydoc, id);

  const editor = useEditor({
    extensions: [
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      StarterKit.configure({ history: false } as any), // yUndoPlugin takes over history
      YjsCollab.configure({ fragment }),
      // TODO: add Placeholder.configure({ placeholder: 'Start writing…' })
      // TODO: add CollaborationCursor.configure({ provider.awareness, user: {…} })
      // TODO: add Link extension
      // TODO: add Image extension (with upload handler)
      // TODO: add Table extension
      // TODO: add TaskList + TaskItem for checklist support
      // TODO: add Suggestion/Autocomplete extension for word and sentence completion (see preferences)
      // TODO: add vim-mode keymap plugin when preferences.vimMode is enabled (see preferences)
    ],
    editorProps: {
      attributes: { class: 'editor-content', spellcheck: 'true' },
    },
  });

  return (
    <div className="editor-page">
      {/* Header bar */}
      <header className="editor-header">
        <input
          className="editor-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled Document"
          // TODO: debounce + call PATCH /api/docs/:id on blur
        />
        <div className="editor-header__right">
          <CollabCursors provider={provider} />
          <ConnectionBadge provider={provider} />
          {/* TODO: <ShareButton docId={id} /> */}
          {/* TODO: <VersionHistoryButton docId={id} /> — opens a diff/history panel */}
          {/* TODO: <UserMenu /> */}
        </div>
      </header>

      {/* Toolbar */}
      {editor && <Toolbar editor={editor} />}

      {/* Editor canvas */}
      <main className="editor-canvas">
        <EditorContent editor={editor} />
      </main>
    </div>
  );
}
