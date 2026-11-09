import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useServices } from '../../shared/hooks/ServicesContext.js';
import { useResource } from '../../shared/hooks/useResource.js';
import { Button } from '../../shared/ui/Button.jsx';
import { EmptyState, ErrorState, Loading } from '../../shared/ui/Feedback.jsx';
import { money } from '../../../shared/lib/format.js';
import { productImageUrl } from '../../../shared/lib/productImageUrl.js';
import { ProducerProductForm } from './ProducerProductForm.jsx';
import './producer-products.css';

export function ProducerProductsSection() {
  const { catalog } = useServices();
  const { data, loading, error, reload } = useResource(catalog.owned);
  const [editing, setEditing] = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [archiving, setArchiving] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [feedback, setFeedback] = useState('');

  function openEditor(product) {
    setArchiveTarget(null);
    setActionError(null);
    setFeedback('');
    setEditing(product);
  }

  async function archive() {
    setArchiving(true);
    setActionError(null);
    try {
      await catalog.archive(archiveTarget);
      setArchiveTarget(null);
      setFeedback('Produsul a fost arhivat.');
      reload();
    } catch (archiveError) {
      setActionError(archiveError);
    } finally {
      setArchiving(false);
    }
  }

  function savedProduct() {
    setFeedback(
      editing.id ? 'Produsul a fost actualizat.' : 'Produsul a fost publicat.',
    );
    setEditing(null);
    reload();
  }

  return (
    <section>
      <div className="section-heading producer-products-heading">
        <h2>
          Produsele tale{' '}
          <span className="muted">({data?.items.length ?? 0})</span>
        </h2>
        {editing === null && (
          <Button onClick={() => openEditor({})} disabled={archiving}>
            <Plus size={17} /> Adaugă un produs
          </Button>
        )}
      </div>
      {feedback && <p role="status">{feedback}</p>}
      {editing !== null && (
        <ProducerProductForm
          key={editing.id ?? 'new'}
          product={editing}
          catalog={catalog}
          onClose={() => setEditing(null)}
          onSaved={savedProduct}
        />
      )}
      {loading ? (
        <Loading text="Încărcăm produsele tale…" />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : !data.items.length ? (
        <EmptyState
          title="Prima bunătate începe cu tine."
          text="Adaugă un produs și fă cunoștință cu primii tăi cumpărători."
        />
      ) : (
        <div className="dashboard-products">
          {data.items.map((product) => (
            <article key={product.id}>
              <img
                src={productImageUrl(product.imageUrl)}
                alt={product.title}
              />
              {product.active ? (
                <Link to={`/products/${encodeURIComponent(product.id)}`}>
                  {product.title}
                </Link>
              ) : (
                <strong>{product.title} · Arhivat</strong>
              )}
              <span>
                {product.availableQuantity} {product.unit} în stoc
              </span>
              <strong>
                {money(product.priceAmount)} lei / {product.unit}
              </strong>
              {product.active && (
                <div className="producer-product-actions">
                  {archiveTarget === product.id ? (
                    <>
                      <p>Scoți produsul din catalog?</p>
                      <Button onClick={archive} loading={archiving}>
                        Confirmă arhivarea
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setArchiveTarget(null);
                          setActionError(null);
                        }}
                        disabled={archiving}
                      >
                        Renunță
                      </Button>
                      {actionError && (
                        <p className="form-error" role="alert">
                          {actionError.message}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <Button
                        variant="secondary"
                        onClick={() => openEditor(product)}
                        disabled={archiving || editing !== null}
                      >
                        Editează
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setArchiveTarget(product.id);
                          setActionError(null);
                          setFeedback('');
                        }}
                        disabled={archiving || editing !== null}
                      >
                        Arhivează
                      </Button>
                    </>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
