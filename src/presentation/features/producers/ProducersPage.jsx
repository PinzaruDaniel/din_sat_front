import { useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Sprout, MapPin, ArrowUpRight } from 'lucide-react';
import { useServices } from '../../shared/hooks/ServicesContext.js';
import { useResource } from '../../shared/hooks/useResource.js';
import { ErrorState, Loading, EmptyState } from '../../shared/ui/Feedback.jsx';
export function ProducersPage() {
  const { id } = useParams();
  const { producers } = useServices();
  const load = useCallback(
    (signal) => (id ? producers.details(id, signal) : producers.list(signal)),
    [id, producers],
  );
  const { data, loading, error, reload } = useResource(load);
  if (loading) return <Loading />;
  if (error?.status === 404 && id)
    return (
      <section className="container page-section">
        <EmptyState
          title="Producătorul nu a fost găsit"
          text="Descoperă celelalte gospodării din comunitate."
        >
          <Link className="button button-secondary" to="/producers">
            Vezi producătorii
          </Link>
        </EmptyState>
      </section>
    );
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const profiles = id ? [data] : data.items;
  return (
    <section className="container page-section">
      <span className="eyebrow">OAMENI CU RĂDĂCINI LOCALE</span>
      <h1>{id ? data.name : 'Oamenii din spatele bunătăților.'}</h1>
      <p className="page-intro">
        Fiecare gospodărie are o poveste. Fiecare produs, un om care pune
        suflet.
      </p>
      {!profiles.length ? (
        <EmptyState
          title="Nu sunt încă producători"
          text="Revino pentru a descoperi gospodăriile locale."
        />
      ) : (
        <div className="producer-grid">
          {profiles.map((producer) => (
            <article className="producer-card" key={producer.id}>
              <div className="producer-avatar">
                <Sprout size={37} strokeWidth={1.2} />
              </div>
              <span className="product-location">
                <MapPin size={13} />
                {producer.locality}
              </span>
              {!id && (
                <h2>
                  <Link to={`/producers/${encodeURIComponent(producer.id)}`}>
                    {producer.name}
                  </Link>
                </h2>
              )}
              <p>{producer.description}</p>
              <Link
                className="text-link"
                to={`/?producerId=${encodeURIComponent(producer.id)}#produse`}
              >
                Vezi bunătățile <ArrowUpRight size={17} />
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
