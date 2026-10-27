import { useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Sprout, MapPin, ArrowUpRight } from 'lucide-react';
import { useServices } from '../../shared/hooks/ServicesContext.js';
import { useResource } from '../../shared/hooks/useResource.js';
import { ErrorState, Loading, EmptyState } from '../../shared/ui/Feedback.jsx';
export function ProducersPage() {
  const { id } = useParams();
  const { catalog } = useServices();
  const load = useCallback((signal) => catalog.producers(signal), [catalog]);
  const { data, loading, error, reload } = useResource(load);
  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const producers = id
    ? data.items.filter((producer) => producer.id === id)
    : data.items;
  return (
    <section className="container page-section">
      <span className="eyebrow">OAMENI CU RĂDĂCINI LOCALE</span>
      <h1>
        {id ? 'Povestea gospodarului' : 'Oamenii din spatele bunătăților.'}
      </h1>
      <p className="page-intro">
        Fiecare gospodărie are o poveste. Fiecare produs, un om care pune
        suflet.
      </p>
      {!producers.length ? (
        <EmptyState
          title="Producătorul nu a fost găsit"
          text="Descoperă celelalte gospodării din comunitate."
        />
      ) : (
        <div className="producer-grid">
          {producers.map((producer) => (
            <article className="producer-card" key={producer.id}>
              <div className="producer-avatar">
                <Sprout size={37} strokeWidth={1.2} />
              </div>
              <span className="product-location">
                <MapPin size={13} />
                {producer.locality}
              </span>
              <h2>{producer.name}</h2>
              <p>{producer.description}</p>
              <Link className="text-link" to={`/?producerId=${producer.id}`}>
                Vezi bunătățile <ArrowUpRight size={17} />
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
