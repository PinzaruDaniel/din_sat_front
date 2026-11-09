import { useCallback, useState } from 'react';
import { useResource } from '../../shared/hooks/useResource.js';
import { useServices } from '../../shared/hooks/ServicesContext.js';
import { Button } from '../../shared/ui/Button.jsx';
import { Field } from '../../shared/ui/Field.jsx';
import { ErrorState, Loading } from '../../shared/ui/Feedback.jsx';
import './producer-dashboard-stats.css';

const reportDate = new Intl.DateTimeFormat('ro-MD', {
  dateStyle: 'medium',
  timeZone: 'UTC',
});

export function ProducerDashboardStats() {
  const { dashboard } = useServices();
  const [draft, setDraft] = useState(null);
  const [selected, setSelected] = useState(null);
  const [periodError, setPeriodError] = useState('');
  const load = useCallback(
    (signal) => dashboard.read(selected, signal),
    [dashboard, selected],
  );
  const { data, loading, error, reload } = useResource(load);
  const from = draft?.from ?? data?.period.from ?? '';
  const to = draft?.to ?? data?.period.to ?? '';

  function change(event) {
    const { name, value } = event.target;
    setDraft({ from, to, [name]: value });
    setPeriodError('');
  }

  function apply(event) {
    event.preventDefault();
    if (!from || !to || from > to) {
      setPeriodError('Alege o dată finală cel puțin egală cu data de început.');
      return;
    }
    setPeriodError('');
    setSelected({ from, to });
  }

  return (
    <section
      className="producer-stats"
      aria-labelledby="producer-stats-heading"
    >
      <h2 id="producer-stats-heading">Statistici despre comenzi</h2>
      <form className="producer-stats-filter" onSubmit={apply}>
        <Field
          label="De la"
          type="date"
          name="from"
          value={from}
          onChange={change}
          required
        />
        <Field
          label="Până la"
          type="date"
          name="to"
          value={to}
          onChange={change}
          error={periodError}
          required
        />
        <Button type="submit" variant="secondary">
          Aplică perioada
        </Button>
      </form>
      {loading && <Loading text="Încărcăm statisticile…" />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && <Report data={data} />}
    </section>
  );
}

function Report({ data }) {
  const { period } = data;
  const dateLabel = (value) =>
    reportDate.format(new Date(`${value}T00:00:00Z`));
  return (
    <>
      <p className="producer-stats-period">
        Perioada raportată {dateLabel(period.from)} – {dateLabel(period.to)} (
        {period.timeZone})
      </p>
      <dl className="producer-stats-cards">
        <div>
          <dt>Total comenzi</dt>
          <dd>{data.orderCount}</dd>
        </div>
        <div>
          <dt>Active</dt>
          <dd>{data.activeCount}</dd>
        </div>
        <div>
          <dt>Finalizate</dt>
          <dd>{data.completedCount}</dd>
        </div>
        <div>
          <dt>Anulate</dt>
          <dd>{data.cancelledCount}</dd>
        </div>
        <div>
          <dt>Valoarea comenzilor finalizate</dt>
          {data.completedAmounts.map(({ currency, amount }) => (
            <dd key={currency}>
              {new Intl.NumberFormat('ro-MD', {
                style: 'currency',
                currency,
                currencyDisplay: 'code',
              }).format(amount)}
            </dd>
          ))}
        </div>
      </dl>
      {data.orderCount === 0 && <p>Nu ai comenzi în această perioadă.</p>}
      <h3>Produse populare</h3>
      {data.popularProducts.length ? (
        <ol className="producer-stats-products">
          {data.popularProducts.map(({ productId, title, orderCount }) => (
            <li key={productId}>
              {title} · {orderCount}{' '}
              {orderCount === 1 ? 'comandă finalizată' : 'comenzi finalizate'}
            </li>
          ))}
        </ol>
      ) : (
        <p>Produsele apar aici după finalizarea comenzilor.</p>
      )}
    </>
  );
}
