import { useCallback, useState } from 'react';
import { MapPin, Plus } from 'lucide-react';
import { useServices } from '../../shared/hooks/ServicesContext.js';
import { useResource } from '../../shared/hooks/useResource.js';
import { Button } from '../../shared/ui/Button.jsx';
import { Field } from '../../shared/ui/Field.jsx';
import { ErrorState, Loading } from '../../shared/ui/Feedback.jsx';
import { chisinauInstant } from '../../../domain/features/pickup/chisinauTime.js';
import { pickupLabel } from '../../../shared/lib/format.js';

export function ProducerPickupSection() {
  const { pickup } = useServices();
  const load = useCallback(
    async (signal) => {
      const [slots, points] = await Promise.all([
        pickup.listOwned(signal),
        pickup.listPoints(signal),
      ]);
      const now = Date.now();
      return {
        slots: slots.items.map((slot) => ({
          ...slot,
          editable: Date.parse(slot.startsAt) > now,
        })),
        points: points.items,
      };
    },
    [pickup],
  );
  const { data, loading, error, reload } = useResource(load);
  const [editing, setEditing] = useState(null);
  function saved() {
    setEditing(null);
    reload();
  }
  return (
    <section className="pickup-section">
      <div className="section-heading">
        <h2>Ridicări din apropiere</h2>
        <div className="pickup-management-actions">
          <Button
            variant="secondary"
            disabled={loading || !!editing || !!error}
            onClick={() => setEditing({ kind: 'point' })}
          >
            <Plus size={16} /> Punct de ridicare
          </Button>
          <Button
            variant="secondary"
            disabled={loading || !!editing || !!error}
            onClick={() => setEditing({ kind: 'slot' })}
          >
            <Plus size={16} /> Interval de ridicare
          </Button>
        </div>
      </div>
      {loading ? (
        <Loading text="Încărcăm ridicările…" />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : (
        <>
          {editing && (
            <PickupForm
              key={editing.kind + (editing.resource?.id ?? '')}
              editing={editing}
              points={data.points}
              pickup={pickup}
              onSaved={saved}
              onClose={() => setEditing(null)}
            />
          )}
          {data.points.length > 0 && (
            <>
              <h3>Punctele tale</h3>
              <div className="pickup-list">
                {data.points.map((point) => (
                  <div key={point.id}>
                    <MapPin size={17} />
                    <span>{point.location}</span>
                    <small>{point.timeZone}</small>
                    <Button
                      variant="secondary"
                      disabled={!!editing}
                      onClick={() =>
                        setEditing({ kind: 'point', resource: point })
                      }
                    >
                      Editează adresa
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
          <h3>Intervale de ridicare</h3>
          {data.slots.length > 0 ? (
            <div className="pickup-list pickup-slot-list">
              {data.slots.map((slot) => (
                <div key={slot.id}>
                  <MapPin size={17} />
                  <span>{pickupLabel(slot)}</span>
                  <small>
                    {slot.capacity} / {slot.maxCapacity} locuri libere
                  </small>
                  {slot.editable && (
                    <Button
                      variant="secondary"
                      disabled={!!editing}
                      onClick={() =>
                        setEditing({ kind: 'capacity', resource: slot })
                      }
                    >
                      Editează capacitatea
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="page-intro">
              Adaugă un interval pentru ca oamenii să poată comanda produsele
              tale.
            </p>
          )}
        </>
      )}
    </section>
  );
}

function PickupForm({
  editing: { kind, resource },
  points,
  pickup,
  onSaved,
  onClose,
}) {
  const [values, setValues] = useState({
    date: '',
    hour: '10',
    pickupPointId: points[0]?.id ?? '',
    location: kind === 'point' ? (resource?.location ?? '') : '',
    capacity: String(resource?.maxCapacity ?? 10),
  });
  const [saveError, setSaveError] = useState('');
  const [pending, setPending] = useState(false);
  function change({ target }) {
    setValues((current) => ({ ...current, [target.name]: target.value }));
  }
  async function save(event) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setSaveError('');
    try {
      if (kind === 'point') {
        const input = { location: values.location };
        if (resource) await pickup.updatePoint(resource.id, input);
        else await pickup.createPoint(input);
      } else if (kind === 'capacity') {
        await pickup.updateCapacity(resource.id, Number(values.capacity));
      } else {
        await pickup.create({
          startsAt: chisinauInstant(values.date, Number(values.hour)),
          endsAt: chisinauInstant(values.date, Number(values.hour) + 2),
          ...(values.pickupPointId
            ? { pickupPointId: values.pickupPointId }
            : { location: values.location }),
          capacity: Number(values.capacity),
        });
      }
      onSaved();
    } catch (error) {
      setSaveError(error.fieldErrors?.startsAt || error.message);
    } finally {
      setPending(false);
    }
  }
  return (
    <form className="product-form" onSubmit={save}>
      <h3>
        {kind === 'point'
          ? 'Punct de ridicare'
          : kind === 'slot'
            ? 'Interval de ridicare'
            : 'Capacitatea intervalului'}
      </h3>
      {kind === 'slot' && points.length > 0 && (
        <label className="field">
          Alege punctul de ridicare
          <select
            name="pickupPointId"
            value={values.pickupPointId}
            onChange={change}
            disabled={pending}
          >
            {points.map((point) => (
              <option key={point.id} value={point.id}>
                {point.location}
              </option>
            ))}
            <option value="">Punct nou</option>
          </select>
        </label>
      )}
      {(kind === 'point' || (kind === 'slot' && !values.pickupPointId)) && (
        <Field
          label="Locul de ridicare"
          name="location"
          value={values.location}
          onChange={change}
          minLength={5}
          maxLength={200}
          placeholder="Adresa sau punctul de întâlnire"
          hint={
            kind === 'point' && resource
              ? 'Noua adresă se aplică intervalelor adăugate ulterior.'
              : undefined
          }
          disabled={pending}
          required
        />
      )}
      {kind === 'slot' && (
        <div className="form-row">
          <Field
            label="Data ridicării"
            type="date"
            name="date"
            value={values.date}
            onChange={change}
            disabled={pending}
            required
          />
          <label className="field">
            Ora (Europe/Chisinau)
            <select
              name="hour"
              value={values.hour}
              onChange={change}
              disabled={pending}
            >
              <option value="8">08:00–10:00</option>
              <option value="10">10:00–12:00</option>
              <option value="12">12:00–14:00</option>
              <option value="14">14:00–16:00</option>
              <option value="16">16:00–18:00</option>
            </select>
          </label>
        </div>
      )}
      {kind === 'capacity' && <p>{pickupLabel(resource)}</p>}
      {kind !== 'point' && (
        <Field
          label="Număr de comenzi acceptate"
          name="capacity"
          type="number"
          value={values.capacity}
          onChange={change}
          min={
            kind === 'capacity'
              ? Math.max(1, resource.maxCapacity - resource.capacity)
              : 1
          }
          max="1000"
          disabled={pending}
          required
        />
      )}
      {saveError && (
        <p className="form-error" role="alert">
          {saveError}
        </p>
      )}
      <div className="pickup-management-actions">
        <Button type="submit" loading={pending}>
          {kind === 'slot' ? 'Adaugă intervalul' : 'Salvează'}
        </Button>
        <Button variant="secondary" disabled={pending} onClick={onClose}>
          Închide formularul
        </Button>
      </div>
    </form>
  );
}
