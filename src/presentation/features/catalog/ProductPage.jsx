import { useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MapPin, ArrowLeft, ShoppingBag, Leaf, Check } from 'lucide-react';
import { useServices } from '../../shared/hooks/ServicesContext.js';
import { useResource } from '../../shared/hooks/useResource.js';
import { ErrorState, Loading } from '../../shared/ui/Feedback.jsx';
import { Button } from '../../shared/ui/Button.jsx';
import { useCart } from '../cart/CartContext.js';
import { money } from '../../../shared/lib/format.js';
export function ProductPage() {
  const { id } = useParams();
  const { catalog } = useServices();
  const { add } = useCart();
  const load = useCallback(
    (signal) => catalog.details(id, signal),
    [catalog, id],
  );
  const { data: product, loading, error, reload } = useResource(load);
  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  return (
    <section className="container page-section">
      <Link to="/" className="back-link">
        <ArrowLeft size={15} /> Înapoi la bunătăți
      </Link>
      <div className="product-detail">
        <img src={product.imageUrl} alt={product.title} />
        <div>
          <span className="eyebrow">CRESCUT CU GRIJĂ, APROAPE DE TINE</span>
          <h1>{product.title}</h1>
          <Link className="text-link" to={`/producers/${product.producerId}`}>
            {product.producer.name}
          </Link>
          <p className="product-location">
            <MapPin size={15} />
            {product.producer.locality}, Moldova
          </p>
          <p className="detail-description">{product.description}</p>
          <p className="detail-price">
            {money(product.priceAmount)} <span>lei / {product.unit}</span>
          </p>
          <p className="stock">
            <Check size={15} />
            {product.availableQuantity > 0
              ? `${product.availableQuantity} ${product.unit} disponibile`
              : 'Momentan indisponibil'}
          </p>
          <Button
            disabled={!product.availableQuantity}
            onClick={() => add(product)}
          >
            <ShoppingBag size={18} />
            Adaugă în coș
          </Button>
          <div className="detail-note">
            <Leaf size={19} />
            <span>
              Direct de la producător. Alegi locul și intervalul de ridicare la
              finalizarea comenzii.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
