import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, MapPin, Package } from 'lucide-react';
import { useServices } from '../../shared/hooks/ServicesContext.js';
import { useResource } from '../../shared/hooks/useResource.js';
import { useAuth } from '../auth/AuthContext.js';
import {
  ErrorState,
  EmptyState,
  Loading,
  BackToShop,
} from '../../shared/ui/Feedback.jsx';
import { Button } from '../../shared/ui/Button.jsx';
import {
  money,
  pickupLabel,
  orderStatuses,
} from '../../../shared/lib/format.js';
const nextStatus = {
  new: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'completed',
};
export function OrdersPage() {
  const { orders } = useServices();
  const { user } = useAuth();
  const [params] = useSearchParams();
  const load = useCallback((signal) => orders.list(signal), [orders]);
  const { data, loading, error, reload } = useResource(load);
  const [actionError, setActionError] = useState('');
  const [pending, setPending] = useState(null);
  async function update(id, status) {
    setPending(id);
    setActionError('');
    try {
      await orders.update(id, status);
      reload();
    } catch (error) {
      setActionError(error.message);
    } finally {
      setPending(null);
    }
  }
  return (
    <section className="container page-section">
      <span className="eyebrow">BUNĂTĂȚILE SUNT PE DRUMUL CEL BUN</span>
      <h1>
        {user.role === 'producer'
          ? 'Comenzile gospodăriei.'
          : 'Comenzile tale.'}
      </h1>
      <p className="page-intro">
        De la primul click, până la întâlnirea cu gospodarul.
      </p>
      {params.has('created') && (
        <div className="success-banner" role="status">
          <CheckCircle2 size={21} />
          <span>Comanda a fost plasată. Mulțumim că alegi local!</span>
        </div>
      )}
      {actionError && (
        <p className="form-error" role="alert">
          {actionError}
        </p>
      )}
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : !data?.items.length ? (
        <EmptyState
          title="Încă nu ai comenzi."
          text="Bunătățile de la gospodarii noștri te așteaptă."
        >
          <BackToShop />
        </EmptyState>
      ) : (
        <div className="orders-list">
          {data.items.map((order) => (
            <article className="order-card" key={order.id}>
              <div className="order-heading">
                <span>
                  <Package size={18} /> Comanda #{order.id.slice(0, 8)}
                </span>
                <span className={`status status-${order.status}`}>
                  {orderStatuses[order.status]}
                </span>
              </div>
              <ul>
                {order.items.map((item) => (
                  <li key={item.productId}>
                    <span>
                      {item.title}{' '}
                      <small>
                        × {item.quantity} {item.unit}
                      </small>
                    </span>
                    <strong>
                      {money(Number(item.priceAmount) * item.quantity)} lei
                    </strong>
                  </li>
                ))}
              </ul>
              <p className="order-pickup">
                <MapPin size={15} />
                {pickupLabel(order.pickup)}
              </p>
              <div className="order-bottom">
                <strong>Total: {money(order.totalAmount)} lei</strong>
                <div>
                  {user.role === 'producer' && nextStatus[order.status] && (
                    <Button
                      loading={pending === order.id}
                      onClick={() => update(order.id, nextStatus[order.status])}
                    >
                      {orderStatuses[nextStatus[order.status]]}
                    </Button>
                  )}
                  {['new', 'confirmed'].includes(order.status) && (
                    <Button
                      variant="secondary"
                      disabled={!!pending}
                      onClick={() => update(order.id, 'cancelled')}
                    >
                      Anulează comanda
                    </Button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
