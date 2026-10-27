import { Link } from 'react-router-dom';
import { MapPin, Plus, ArrowUpRight } from 'lucide-react';
import { money } from '../../../shared/lib/format.js';
export function ProductCard({ product, onAdd }) {
  return (
    <article className="product-card">
      <Link to={`/products/${product.id}`} className="product-image-link">
        <img
          className="product-image"
          src={product.imageUrl}
          alt={product.title}
          loading="lazy"
        />
        <span className="product-badge">{product.badge || 'Local'}</span>
        <span className="product-hover">
          <ArrowUpRight size={18} />
        </span>
      </Link>
      <div className="product-info">
        <Link
          className="product-producer"
          to={`/producers/${product.producerId}`}
        >
          {product.producer.name}
        </Link>
        <Link className="product-title" to={`/products/${product.id}`}>
          {product.title}
        </Link>
        <div className="product-location">
          <MapPin size={12} />
          {product.producer.locality}
        </div>
        <div className="product-bottom">
          <span>
            <strong>
              {money(product.priceAmount)} <small>lei</small>
            </strong>
            <span className="unit"> / {product.unit}</span>
          </span>
          <button
            className="add-button"
            aria-label={`Adaugă ${product.title} în coș`}
            disabled={product.availableQuantity < 1}
            onClick={() => onAdd(product)}
          >
            <Plus size={19} />
          </button>
        </div>
      </div>
    </article>
  );
}
