import { Editor } from '@tiptap/react';

interface ToolbarProps {
  editor: Editor;
  // TODO: onTitleChange?: (title: string) => void  — inline title editing
}

/**
 * Rich-text toolbar bound to a TipTap editor instance.
 *
 * TODO: replace plain <button> elements with a proper icon-button component
 *       (e.g. from @mui/icons-material).
 * TODO: add heading level selector (H1 / H2 / H3 dropdown).
 * TODO: add text colour picker.
 * TODO: add font family / size selectors.
 * TODO: add insert-link dialog.
 * TODO: add image upload button (POST /api/upload, then editor.commands.setImage).
 * TODO: add comment / annotation button.
 * TODO: show active state (bold/italic/etc.) with CSS `.is-active` class.
 */
export function Toolbar({ editor }: ToolbarProps) {
  return (
    <div className="toolbar">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? 'is-active' : ''}
        title="Bold (Ctrl+B)"
      >
        B
      </button>

      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive('italic') ? 'is-active' : ''}
        title="Italic (Ctrl+I)"
      >
        <em>I</em>
      </button>

      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={editor.isActive('strike') ? 'is-active' : ''}
        title="Strikethrough"
      >
        <s>S</s>
      </button>

      <span className="toolbar-separator" />

      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
        title="Heading 1"
      >
        H1
      </button>

      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
        title="Heading 2"
      >
        H2
      </button>

      <span className="toolbar-separator" />

      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive('bulletList') ? 'is-active' : ''}
        title="Bullet list"
      >
        • List
      </button>

      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive('orderedList') ? 'is-active' : ''}
        title="Ordered list"
      >
        1. List
      </button>

      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={editor.isActive('blockquote') ? 'is-active' : ''}
        title="Blockquote"
      >
        " "
      </button>

      <span className="toolbar-separator" />

      <button
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo (Ctrl+Z)"
      >
        ↩
      </button>

      <button
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo (Ctrl+Y)"
      >
        ↪
      </button>
    </div>
  );
}
