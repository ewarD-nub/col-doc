import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { docsApi } from '../api/docs';
import type { Doc } from '../api/docs';

/**
 * Home page — lists all documents and lets the user create new ones.
 *
 * TODO: add a search / filter input.
 * TODO: add grid / list view toggle.
 * TODO: add sort options (by name, by last modified).
 * TODO: add a rename context menu per doc row.
 * TODO: add a delete context menu with confirmation.
 * TODO: add pagination or infinite scroll for large doc lists.
 * TODO: show doc preview thumbnail (screenshot or first N chars).
 * TODO: show collaborator avatars per doc row.
 */
export function HomePage() {
  const queryClient = useQueryClient();
  const navigate    = useNavigate();

  const { data: docs, isLoading, error } = useQuery({
    queryKey: ['docs'],
    queryFn:  docsApi.list,
    refetchInterval: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: docsApi.create,
    onSuccess: (doc) => {
      queryClient.invalidateQueries({ queryKey: ['docs'] });
      navigate(`/doc/${doc.id}`);
    },
    // TODO: onError: show a toast notification
  });

  if (isLoading) return <p className="status-text">Loading…</p>;
  if (error)     return <p className="status-text status-text--error">Could not load documents.</p>;

  return (
    <section className="home-page">
      <div className="home-page__header">
        <h2>Your Documents</h2>
        <button
          className="btn btn--primary"
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? 'Creating…' : '+ New Document'}
        </button>
      </div>

      {docs?.length === 0 && (
        <p className="status-text">No documents yet — create one above.</p>
      )}

      <ul className="doc-list">
        {docs?.map((doc: Doc) => (
          <li key={doc.id} className="doc-list__item">
            <Link to={`/doc/${doc.id}`} className="doc-list__title">
              {doc.title}
            </Link>
            <span className="doc-list__meta">
              {new Date(doc.updated_at).toLocaleString()}
            </span>
            {/* TODO: <DocContextMenu docId={doc.id} /> — rename / delete */}
          </li>
        ))}
      </ul>
    </section>
  );
}
