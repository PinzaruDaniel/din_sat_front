import { useCallback, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Minus,
  Plus,
  Trash2,
  ShieldCheck,
  MapPin,
} from 'lucide-react';
import { useCart } from './CartContext.js';
import { useAuth } from '../auth/AuthContext.js';
import { useServices } from '../../shared/hooks/ServicesContext.js';
import { useResource } from '../../shared/hooks/useResource.js';
import {
  EmptyState,
  BackToShop,
  ErrorState,
} from '../../shared/ui/Feedback.jsx';
import { Button } from '../../shared/ui/Button.jsx';
import { money, pickupLabel } from '../../../shared/lib/format.js';
export function CartPage() {
  const cart = useCart();
  if (!cart.items.length)
    return (
      <div className="container page-section">
        <EmptyState
          title="Coșul tău așteaptă bunătăți."
          text="O masă bună începe cu produse de la oameni buni."
        >
          <BackToShop />
        </EmptyState>
      </div>
    );
  return <Checkout />;
}
function Checkout() {
  const { items, total, dispatch } = useCart();
  const { user } = useAuth();
  const { pickup, orders } = useServices();
  const navigate = useNavigate();
  const producerId = items[0].product.producerId;
  const load = useCallback(
    (signal) => pickup.list(producerId, signal),
    [pickup, producerId],
  );
  const { data, loading, error, reload } = useResource(load);
  const [slotId, setSlotId] = useState('');
  const [pending, setPending] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const intent = useRef({ payload: '', key: '' });
  async function checkout(event) {
    event.preventDefault();
    if (!user) return navigate('/login?redirect=/cart');
    if (!slotId) return setSubmitError('Alege un interval de ridicare.');
    const input = {
      items: items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      })),
      pickupSlotId: slotId,
    };
    const payload = JSON.stringify(input);
    // Reuse the key after a timeout. A changed cart or slot creates a new intent.
    if (intent.current.payload !== payload)
      intent.current = { payload, key: crypto.randomUUID() };
    setPending(true);
    setSubmitError('');
    try {
      await orders.create(input, intent.current.key);
      dispatch({ type: 'clear' });
      navigate('/orders?created=true');
    } catch (error) {
      setSubmitError(error.message);
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="container page-section">
      <Link to="/" className="back-link">
        <ArrowLeft size={15} /> Mai adaugă bunătăți
      </Link>
      <span className="eyebrow">DE LA GOSPODAR, LA TINE</span>
      <h1>Coșul tău cu bunătăți.</h1>
      <p className="page-intro">
        O singură gospodărie. O ridicare simplă. Mult gust bun.
      </p>
      <div className="checkout-layout">
        <div>
          <div className="cart-producer">
            De la <strong>{items[0].product.producer.name}</strong>
            <button
              disabled={pending}
              onClick={() => dispatch({ type: 'clear' })}
            >
              Golește coșul
            </button>
          </div>
          {items.map(({ product, quantity }) => (
            <article className="cart-item" key={product.id}>
              <img src={product.imageUrl} alt={product.title} />
              <div>
                <Link to={`/products/${product.id}`}>{product.title}</Link>
                <span>
                  {money(product.priceAmount)} lei / {product.unit}
                </span>
                <div className="quantity-control">
                  <button
                    disabled={pending || quantity <= 1}
                    aria-label={`Scade cantitatea ${product.title}`}
                    onClick={() =>
                      dispatch({
                        type: 'quantity',
                        id: product.id,
                        quantity: quantity - 1,
                      })
                    }
                  >
                    <Minus size={13} />
                  </button>
                  <span>{quantity}</span>
                  <button
                    disabled={pending || quantity >= product.availableQuantity}
                    aria-label={`Crește cantitatea ${product.title}`}
                    onClick={() =>
                      dispatch({
                        type: 'quantity',
                        id: product.id,
                        quantity: quantity + 1,
                      })
                    }
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>
              <strong>
                {money(Number(product.priceAmount) * quantity)} lei
              </strong>
              <button
                disabled={pending}
                className="icon-button"
                aria-label={`Elimină ${product.title}`}
                onClick={() => dispatch({ type: 'remove', id: product.id })}
              >
                <Trash2 size={17} />
              </button>
            </article>
          ))}
        </div>
        <form className="checkout-summary" onSubmit={checkout}>
          <h2>Mai aproape de masa ta.</h2>
          <label className="slot-label" htmlFor="pickup">
            <MapPin size={16} /> Alege ridicarea
          </label>
          {error ? (
            <ErrorState error={error} onRetry={reload} />
          ) : (
            <select
              id="pickup"
              value={slotId}
              onChange={(event) => setSlotId(event.target.value)}
              disabled={loading || pending}
            >
              <option value="">
                {loading ? 'Încărcăm intervalele…' : 'Alege un interval'}
              </option>
              {data?.items.map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {pickupLabel(slot)}
                </option>
              ))}
            </select>
          )}
          {data?.items.length === 0 && (
            <p className="field-error">
              Producătorul nu are încă intervale de ridicare disponibile.
            </p>
          )}
          <div className="summary-total">
            <span>Total estimat</span>
            <strong>{money(total)} lei</strong>
          </div>
          <p>
            Prețurile și disponibilitatea sunt confirmate de server. Plata se
            face la ridicare.
          </p>
          {submitError && (
            <p className="form-error" role="alert">
              {submitError}
            </p>
          )}
          {user?.role === 'producer' ? (
            <p className="form-error">
              Pentru a comanda, folosește un cont de cumpărător.
            </p>
          ) : (
            <Button
              type="submit"
              className="full-width"
              loading={pending}
              disabled={!!user && (!slotId || loading || !!error)}
            >
              {user ? 'Confirmă comanda' : 'Autentifică-te pentru a comanda'}
              <ArrowRight size={17} />
            </Button>
          )}
          <span className="auth-safe">
            <ShieldCheck size={14} /> O alegere bună, în siguranță.
          </span>
        </form>
      </div>
    </section>
  );
}
