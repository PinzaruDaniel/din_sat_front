import { useCallback, useState } from 'react';
import { MapPin, Plus, X } from 'lucide-react';
import { useServices } from '../../shared/hooks/ServicesContext.js';
import { useResource } from '../../shared/hooks/useResource.js';
import { Button } from '../../shared/ui/Button.jsx';
import { Field } from '../../shared/ui/Field.jsx';
import { ErrorState, Loading } from '../../shared/ui/Feedback.jsx';
import { chisinauInstant } from '../../../domain/features/pickup/chisinauTime.js';
import { pickupLabel } from '../../../shared/lib/format.js';
export function ProducerPickupSection({ producerId }) {
  const { pickup } = useServices();
  const load = useCallback(
    (signal) => pickup.list(producerId, signal),
    [pickup, producerId],
  );
  const { data, loading, error, reload } = useResource(load);
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState({
    date: '',
    hour: '10',
    location: '',
    capacity: '10',
  });
  const [saveError, setSaveError] = useState('');
  const [pending, setPending] = useState(false);
  function change(event) {
    setValues({ ...values, [event.target.name]: event.target.value });
  }
  async function save(event) {
    event.preventDefault();
    setPending(true);
    setSaveError('');
    try {
      await pickup.create({
        startsAt: chisinauInstant(values.date, Number(values.hour)),
        endsAt: chisinauInstant(values.date, Number(values.hour) + 2),
        location: values.location,
        capacity: Number(values.capacity),
      });
      setOpen(false);
      reload();
    } catch (error) {
      setSaveError(error.fieldErrors?.startsAt || error.message);
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="pickup-section">
      <div className="section-heading">
        <h2>Ridicări din apropiere</h2>
        <Button variant="secondary" onClick={() => setOpen(!open)}>
          {open ? <X size={16} /> : <Plus size={16} />}Interval de ridicare
        </Button>
      </div>
      {open && (
        <form className="product-form" onSubmit={save}>
          <h2>Un loc bun de întâlnire.</h2>
          <Field
            label="Locul de ridicare"
            name="location"
            value={values.location}
            onChange={change}
            minLength={5}
            maxLength={200}
            placeholder="Adresa sau punctul de întâlnire"
            required
          />
          <div className="form-row">
            <Field
              label="Data ridicării"
              type="date"
              name="date"
              value={values.date}
              onChange={change}
              required
            />
            <label className="field">
              Ora (Moldova)
              <select name="hour" value={values.hour} onChange={change}>
                <option value="8">08:00–10:00</option>
                <option value="10">10:00–12:00</option>
                <option value="12">12:00–14:00</option>
                <option value="14">14:00–16:00</option>
                <option value="16">16:00–18:00</option>
              </select>
            </label>
          </div>
          <Field
            label="Număr de comenzi acceptate"
            name="capacity"
            type="number"
            value={values.capacity}
            onChange={change}
            min="1"
            max="1000"
            required
          />
          {saveError && (
            <p className="form-error" role="alert">
              {saveError}
            </p>
          )}
          <Button type="submit" loading={pending}>
            Adaugă intervalul
          </Button>
        </form>
      )}
      {loading ? (
        <Loading text="Încărcăm ridicările…" />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : data?.items.length ? (
        <div className="pickup-list">
          {data.items.map((slot) => (
            <div key={slot.id}>
              <MapPin size={17} />
              <span>{pickupLabel(slot)}</span>
              <small>{slot.capacity} locuri</small>
            </div>
          ))}
        </div>
      ) : (
        <p className="page-intro">
          Adaugă un interval pentru ca oamenii să poată comanda produsele tale.
        </p>
      )}
    </section>
  );
}
