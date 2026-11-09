import { useCallback, useEffect, useRef, useState } from 'react';
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
import { productImageUrl } from '../../../shared/lib/productImageUrl.js';
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
  return <Checkout key={cart.items[0].product.producerId} />;
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
  const [point, setPoint] = useState('');
  const [slotId, setSlotId] = useState('');
  const [pending, setPending] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const intent = useRef({ payload: '', key: '' });
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  const slots = data?.items ?? [];
  const points = [...new Set(slots.map((slot) => slot.location))];
  const selectedPoint = points.length === 1 ? points[0] : point;
  const pointSlots = slots.filter((slot) => slot.location === selectedPoint);
  const selectedSlot = pointSlots.find(
    (slot) => slot.id === slotId && slot.capacity > 0,
  );
  async function checkout(event) {
    event.preventDefault();
    if (pending) return;
    if (!user) return navigate('/login?redirect=/cart');
    if (!selectedSlot) return setSubmitError('Alege un interval de ridicare.');
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
      const order = await orders.create(input, intent.current.key);
      if (!active.current) return;
      dispatch({ type: 'clear' });
      navigate(`/orders?${new URLSearchParams({ created: order.id })}`, {
        state: {
          confirmedOrder: {
            id: order.id,
            buyerId: user.id,
            totalAmount: order.totalAmount,
          },
        },
      });
    } catch (error) {
      if (!active.current) return;
      setSubmitError(error.message);
      if (error.code === 'SLOT_UNAVAILABLE') {
        setSlotId('');
        intent.current = { payload: '', key: '' };
        reload();
      }
    } finally {
      if (active.current) setPending(false);
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
              <img
                src={productImageUrl(product.imageUrl)}
                alt={product.title}
              />
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
                    disabled={
                      pending ||
                      quantity >= Math.min(product.availableQuantity, 1000)
                    }
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
          {points.length > 1 && (
            <>
              <label className="slot-label" htmlFor="pickup-point">
                Punct de ridicare
              </label>
              <select
                id="pickup-point"
                value={point}
                disabled={pending}
                onChange={(event) => {
                  setPoint(event.target.value);
                  setSlotId('');
                }}
              >
                <option value="">Alege punctul</option>
                {points.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </>
          )}
          <label className="slot-label" htmlFor="pickup">
            <MapPin size={16} /> Alege ridicarea
          </label>
          {error ? (
            <ErrorState error={error} onRetry={reload} />
          ) : (
            <select
              id="pickup"
              value={selectedSlot?.id ?? ''}
              onChange={(event) => setSlotId(event.target.value)}
              disabled={loading || pending || !selectedPoint}
            >
              <option value="">
                {loading ? 'Încărcăm intervalele…' : 'Alege un interval'}
              </option>
              {pointSlots.map((slot) => (
                <option
                  key={slot.id}
                  value={slot.id}
                  disabled={slot.capacity < 1}
                >
                  {pickupLabel(slot)}
                  {slot.capacity < 1 ? ' · Ocupat' : ''}
                </option>
              ))}
            </select>
          )}
          {data && !slots.some((slot) => slot.capacity > 0) && (
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
              disabled={!!user && (!selectedSlot || loading || !!error)}
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
