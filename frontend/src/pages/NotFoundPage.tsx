import { Link } from 'react-router-dom';

/**
 * 404 page shown when the user navigates to an unknown route.
 *
 * TODO: add a friendly illustration.
 * TODO: log the unknown path to an analytics / error-tracking service.
 */
export function NotFoundPage() {
  return (
    <div className="not-found">
      <h2>404 — Page not found</h2>
      <p>The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn btn--secondary">Go home</Link>
    </div>
  );
}
