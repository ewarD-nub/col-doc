import { createBrowserRouter, Link, Outlet, type RouteObject } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { EditorPage } from './pages/EditorPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { useAppStore } from './store/useAppStore';
import { ROUTE_PATHS } from './routes/app-routes';
import { NonProtectedRoutesLayout } from './routes/route-navigators';
import { AppContextProvider } from './components/AppContextProvider';

// TODO: add a lazy-loaded route for a Settings page
// TODO: add auth-guarded routes once login is implemented
// TODO: add a route for /doc/:id/history (version history view)
// TODO: add a route for /shared/:token (public share link)

export default function App() {
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);

  return (
    <AppContextProvider>
      <div className="app-shell">
        <header className="header">
          <button className="header__menu-btn" onClick={toggleSidebar} title="Toggle sidebar">
            ☰
          </button>
          <Link to="/" className="header__brand">col-doc</Link>
          {/* TODO: <UserMenu /> — avatar + logout once auth exists */}
          {/* TODO: <ThemeToggle /> */}
        </header>

        {/* TODO: <Sidebar open={sidebarOpen} /> — doc tree / recent files */}

        <main className="container">
          <Outlet />
        </main>
      </div>
    </AppContextProvider>
  );
}

const nonProtectedRoutes: RouteObject[] = [
  // TODO: add login / signup routes here once auth UI exists
];

const routes: RouteObject[] = [
  {
    /* TODO: Refactor ProtectedRoutes && NonProtectedRoutesLayout */
    /* TODO: Add more routes with directories separated */
    path: ROUTE_PATHS.ROOT,
    element: <App />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: ROUTE_PATHS.DOC_ID,
        element: <EditorPage />,
      },
      {
        element: <NonProtectedRoutesLayout />,
        caseSensitive: true,
        children: nonProtectedRoutes,
      },
      { path: ROUTE_PATHS.MATCH_ALL, element: <NotFoundPage /> }
    ],
  },
];

// eslint-disable-next-line react-refresh/only-export-components
export const router = createBrowserRouter(routes);
