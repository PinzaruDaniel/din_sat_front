import { useCallback, useRef, useState } from 'react';
import {
  Link,
  useLocation,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { ArrowLeft, CheckCircle2, MapPin, Package } from 'lucide-react';
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

function useOrderUpdates(orders, reload) {
  const [feedback, setFeedback] = useState(null);
  const [pending, setPending] = useState(null);
  const inFlight = useRef(false);
  async function update(id, status) {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending({ id, status });
    setFeedback(null);
    try {
      if (status === 'cancelled') await orders.cancel(id);
      else await orders.update(id, status);
      setFeedback({
        text:
          status === 'cancelled'
            ? 'Comanda a fost anulată.'
            : 'Statusul comenzii a fost actualizat.',
      });
      reload();
    } catch (error) {
      setFeedback({ text: error.message, error: true });
      if (error.status === 409) reload();
    } finally {
      inFlight.current = false;
      setPending(null);
    }
  }
  return { feedback, pending, update };
}

function ActionFeedback({ feedback }) {
  if (!feedback) return null;
  return (
    <p
      className={feedback.error ? 'form-error' : 'success-banner'}
      role={feedback.error ? 'alert' : 'status'}
    >
      {feedback.text}
    </p>
  );
}

function ProducerOrdersFilter({ value, change }) {
  const { pickup } = useServices();
  const { data, loading, error, reload } = useResource(pickup.listOwned);
  return (
    <div className="order-filter">
      <label className="field">
        Filtrează după intervalul de ridicare
        <select
          value={value}
          onChange={(event) => change(event.target.value)}
          disabled={loading || !!error}
        >
          <option value="">Toate intervalele</option>
          {data?.items.map((slot) => (
            <option key={slot.id} value={slot.id}>
              {pickupLabel(slot)}
            </option>
          ))}
        </select>
      </label>
      {error && <ErrorState error={error} onRetry={reload} />}
    </div>
  );
}

export function OrdersPage() {
  const { orders } = useServices();
  const { user } = useAuth();
  const { state } = useLocation();
  const [params, setParams] = useSearchParams();
  const page = Math.min(
    1000000,
    Math.max(1, Number.parseInt(params.get('page'), 10) || 1),
  );
  const pickupSlotId =
    user.role === 'producer' ? params.get('pickupSlotId') : null;
  const created = params.get('created');
  const load = useCallback(
    (signal) => orders.list({ page, pickupSlotId }, signal),
    [orders, page, pickupSlotId],
  );
  const { data, loading, error, reload } = useResource(load);
  const confirmedOrder =
    state?.confirmedOrder?.id === created &&
    state.confirmedOrder.buyerId === user.id
      ? state.confirmedOrder
      : data?.items.find((order) => order.id === created);
  const { feedback, pending, update } = useOrderUpdates(orders, reload);
  function applyFilters(nextPage, nextSlot) {
    setParams({
      ...(nextPage > 1 ? { page: nextPage } : {}),
      ...(nextSlot ? { pickupSlotId: nextSlot } : {}),
    });
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
      {(confirmedOrder || created === 'true') && (
        <div className="success-banner" role="status">
          <CheckCircle2 size={21} />
          <span>
            Comanda a fost plasată.{' '}
            {confirmedOrder && (
              <>Total final: {money(confirmedOrder.totalAmount)} lei. </>
            )}
            {created !== 'true' && (
              <Link
                className="text-link"
                to={`/orders/${encodeURIComponent(created)}`}
              >
                Vezi comanda #{created.slice(0, 8)}
              </Link>
            )}
          </span>
        </div>
      )}
      {user.role === 'producer' && (
        <ProducerOrdersFilter
          value={pickupSlotId ?? ''}
          change={(slot) => applyFilters(1, slot)}
        />
      )}
      <ActionFeedback feedback={feedback} />
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : data.items.length ? (
        <div className="orders-list">
          {data.items.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              role={user.role}
              pending={pending}
              update={update}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title={
            pickupSlotId
              ? 'Nu sunt comenzi pentru acest interval.'
              : 'Încă nu ai comenzi.'
          }
          text="Bunătățile de la gospodarii noștri te așteaptă."
        >
          {user.role === 'buyer' && <BackToShop />}
        </EmptyState>
      )}
      {data && (page > 1 || data.hasNext) && (
        <nav className="pagination" aria-label="Paginarea comenzilor">
          <Button
            variant="secondary"
            disabled={page === 1 || !!pending}
            onClick={() => applyFilters(page - 1, pickupSlotId)}
          >
            Înapoi
          </Button>
          <span>Pagina {page}</span>
          <Button
            variant="secondary"
            disabled={!data.hasNext || !!pending}
            onClick={() => applyFilters(page + 1, pickupSlotId)}
          >
            Înainte
          </Button>
        </nav>
      )}
    </section>
  );
}

export function OrderDetailsPage() {
  const { id } = useParams();
  return <OrderDetails key={id} id={id} />;
}

function OrderDetails({ id }) {
  const { orders } = useServices();
  const { user } = useAuth();
  const load = useCallback(
    (signal) => orders.details(id, signal),
    [orders, id],
  );
  const { data, loading, error, reload } = useResource(load);
  const { feedback, pending, update } = useOrderUpdates(orders, reload);
  return (
    <section className="container page-section">
      <Link to="/orders" className="back-link">
        <ArrowLeft size={15} /> Înapoi la comenzi
      </Link>
      <h1>Detaliile comenzii</h1>
      <ActionFeedback feedback={feedback} />
      {loading ? (
        <Loading />
      ) : error?.status === 404 || error?.status === 403 ? (
        <EmptyState title="Comanda nu este disponibilă" text={error.message} />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : (
        <OrderCard
          order={data}
          role={user.role}
          pending={pending}
          update={update}
          detail
        />
      )}
    </section>
  );
}

function OrderCard({ order, role, pending, update, detail = false }) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const next = role === 'producer' ? nextStatus[order.status] : null;
  const canCancel = ['new', 'confirmed'].includes(order.status);
  return (
    <article className="order-card">
      <div className="order-heading">
        {detail ? (
          <span>
            <Package size={18} /> Comanda #{order.id}
          </span>
        ) : (
          <Link
            className="text-link"
            to={`/orders/${encodeURIComponent(order.id)}`}
          >
            <Package size={18} /> Comanda #{order.id.slice(0, 8)}
          </Link>
        )}
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
                {detail
                  ? ` · ${money(item.priceAmount)} lei / ${item.unit}`
                  : ''}
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
          {next && (
            <Button
              disabled={!!pending || confirmCancel}
              loading={pending?.id === order.id && pending.status === next}
              onClick={() => update(order.id, next)}
            >
              {orderStatuses[next]}
            </Button>
          )}
          {canCancel && !confirmCancel && (
            <Button
              variant="secondary"
              disabled={!!pending}
              onClick={() => setConfirmCancel(true)}
            >
              Anulează comanda
            </Button>
          )}
        </div>
      </div>
      {canCancel && confirmCancel && (
        <div
          className="order-cancel-confirmation"
          role="group"
          aria-label="Confirmarea anulării"
        >
          <p>Vrei să anulezi comanda și să eliberezi rezervarea?</p>
          <Button
            variant="secondary"
            disabled={!!pending}
            onClick={() => setConfirmCancel(false)}
          >
            Păstrează comanda
          </Button>
          <Button
            disabled={!!pending}
            loading={pending?.id === order.id && pending.status === 'cancelled'}
            onClick={() => update(order.id, 'cancelled')}
          >
            Confirmă anularea
          </Button>
        </div>
      )}
      {detail && !canCancel && order.status !== 'cancelled' && (
        <p className="page-intro">
          Anularea este disponibilă până la începerea pregătirii.
        </p>
      )}
    </article>
  );
}
