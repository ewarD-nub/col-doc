import { create } from "zustand";
import { persist } from "zustand/middleware";

// TODO: replace with the shape returned by GET /api/users/me once auth exists.
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

/**
 * Global UI state managed by Zustand.
 * Keeps server-state (docs list, doc content) in React Query;
 * this store is for UI-only state that doesn't need to be fetched.
 *
 * TODO: add auth slice once login is implemented.
 * TODO: add notification / toast queue.
 * TODO: persist sidebarOpen to localStorage via zustand/middleware persist.
 */

interface AppState {
  // ── Sidebar ──────────────────────────────────────────────────────────────
  sidebarOpen: boolean;
  toggleSidebar: () => void;

  // ── Active document ───────────────────────────────────────────────────────
  activeDocId: string | null;
  setActiveDocId: (id: string | null) => void;

  currentUser: User | null;
  setCurrentUser: (u: User | null) => void;

  theme: "light" | "dark";
  toggleTheme: () => void;

  // TODO: currentUser: User | null   — populated after login
  // TODO: setCurrentUser: (u: User | null) => void

  // TODO: theme: 'light' | 'dark'   — with toggleTheme()
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sidebarOpen: false,
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

      activeDocId: null,
      setActiveDocId: (id) => set({ activeDocId: id }),

      currentUser: null,
      setCurrentUser: (User) => set({ currentUser: User }),

      theme: "dark",
      toggleTheme: () =>
        set((s) => ({ theme: s.theme === "dark" ? "light" : "dark" })),
    }),
    {
      name: "app-store",
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
      }),
    },
  ),
);
