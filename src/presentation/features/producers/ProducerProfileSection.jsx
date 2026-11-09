import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useServices } from '../../shared/hooks/ServicesContext.js';
import { useResource } from '../../shared/hooks/useResource.js';
import { Button } from '../../shared/ui/Button.jsx';
import { Field } from '../../shared/ui/Field.jsx';
import { ErrorState, Loading } from '../../shared/ui/Feedback.jsx';

export function ProducerProfileSection() {
  const { producers } = useServices();
  const { data, error, loading, reload } = useResource(producers.own);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  function savedProfile() {
    setEditing(false);
    setSaved(true);
    reload();
  }

  return (
    <section>
      <div className="section-heading">
        <h2>Profilul gospodăriei</h2>
      </div>
      {saved && <p role="status">Profilul a fost actualizat.</p>}
      {loading ? (
        <Loading text="Încărcăm profilul…" />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : editing ? (
        <ProfileForm
          profile={data}
          save={producers.update}
          onSaved={savedProfile}
          onClose={() => setEditing(false)}
        />
      ) : (
        <div className="dashboard-actions">
          <Button
            variant="secondary"
            onClick={() => {
              setSaved(false);
              setEditing(true);
            }}
          >
            Editează profilul
          </Button>
          <Link
            className="text-link"
            to={`/producers/${encodeURIComponent(data.id)}`}
          >
            Vezi profilul public
          </Link>
        </div>
      )}
    </section>
  );
}

function ProfileForm({ profile, save, onSaved, onClose }) {
  const [values, setValues] = useState({
    name: profile.name,
    locality: profile.locality,
    description: profile.description,
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  function change({ target }) {
    setValues((current) => ({ ...current, [target.name]: target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await save(values);
      onSaved();
    } catch (saveError) {
      setError(saveError);
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="product-form" onSubmit={submit} noValidate>
      <Field
        label="Numele public al gospodăriei"
        name="name"
        value={values.name}
        onChange={change}
        required
        maxLength={100}
        error={error?.fieldErrors?.name}
        disabled={pending}
      />
      <Field
        label="Localitate"
        name="locality"
        value={values.locality}
        onChange={change}
        required
        maxLength={80}
        error={error?.fieldErrors?.locality}
        disabled={pending}
      />
      <label className="field">
        Descrierea gospodăriei
        <textarea
          name="description"
          value={values.description}
          onChange={change}
          required
          maxLength={2000}
          disabled={pending}
          aria-invalid={Boolean(error?.fieldErrors?.description)}
        />
        {error?.fieldErrors?.description && (
          <span className="field-error">{error.fieldErrors.description}</span>
        )}
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error.message}
        </p>
      )}
      <div className="dashboard-actions">
        <Button type="submit" loading={pending}>
          Salvează profilul
        </Button>
        <Button variant="secondary" onClick={onClose} disabled={pending}>
          Renunță
        </Button>
      </div>
    </form>
  );
}
