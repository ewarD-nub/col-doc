# Preferences

User preferences are stored per-account and applied whenever the user opens the editor, on any device.

## Functional Requirements

1. Users can switch between a **light** and **dark** theme; the choice persists across sessions.
2. Users can set their preferred **font family** and **font size** for the editor canvas.
3. Users can enable **vim-mode keybindings** (insert / normal / visual modes) in the editor.
4. Users can configure the **auto-save interval** (options: off, 5 s, 30 s, on every change).
5. Users can toggle **word and sentence auto-complete** suggestions while typing.
6. Preferences are synced to the server so the same settings apply on every device the user logs in from.
7. Preferences are returned as part of the login response so the UI applies them before the first render.

## Non-Functional Requirements

1. Each preference must have a well-defined default so the app works correctly when a preference is not yet set.
2. Preference changes must be applied without a full page reload.
3. Preferences must be validated server-side (valid enum values, numeric ranges) before persistence.

## TODOs

- [ ] Add a `preferences` JSONB column to the `users` table with a sensible default (`{}`)
- [ ] Implement `GET /api/users/me/preferences` and `PATCH /api/users/me/preferences`
- [ ] Return preferences in the `LoginResponse` payload so the frontend applies them on login
- [ ] Add `preferences` to the Zustand store and initialise from the login response
- [ ] Build a Settings page (`/settings`) with a form section for each preference category
- [ ] Implement theme toggle — `ThemeToggle` component + CSS custom properties for light/dark
- [ ] Implement vim-mode via a ProseMirror keymap plugin or the CodeMirror vim extension
- [ ] Implement auto-complete extension for words and sentences (TipTap `Suggestion` API or a custom ProseMirror plugin)
- [ ] Implement auto-save using the configured interval (debounced Yjs snapshot flush to the backend)
