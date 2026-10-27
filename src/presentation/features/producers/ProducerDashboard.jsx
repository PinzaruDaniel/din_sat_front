import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Plus, Package, Sprout, X } from 'lucide-react';
import { useAuth } from '../auth/AuthContext.js';
import { useServices } from '../../shared/hooks/ServicesContext.js';
import { useResource } from '../../shared/hooks/useResource.js';
import { Button } from '../../shared/ui/Button.jsx';
import { Field } from '../../shared/ui/Field.jsx';
import { EmptyState, ErrorState, Loading } from '../../shared/ui/Feedback.jsx';
import { money } from '../../../shared/lib/format.js';
const initial = {
  title: '',
  description: '',
  category: 'legume',
  unit: 'kg',
  priceAmount: '',
  availableQuantity: '',
  imageUrl: '',
};
export function ProducerDashboard({ children }) {
  const { user } = useAuth();
  const { catalog } = useServices();
  const load = useCallback(
    (signal) => catalog.list({ producerId: user.id }, signal),
    [catalog, user.id],
  );
  const { data, loading, error, reload } = useResource(load);
  const [showForm, setShowForm] = useState(false);
  const [values, setValues] = useState(initial);
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
      await catalog.create({
        ...values,
        priceAmount: Number(values.priceAmount).toFixed(2),
        availableQuantity: Number(values.availableQuantity),
      });
      setShowForm(false);
      setValues(initial);
      reload();
    } catch (error) {
      setSaveError(
        error.message +
          (error.fieldErrors
            ? ' ' + Object.values(error.fieldErrors).join(' ')
            : ''),
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="container page-section">
      <span className="eyebrow">GOSPODĂRIA TA, MAI APROAPE DE OAMENI</span>
      <h1>Bună, {user.name}.</h1>
      <p className="page-intro">
        Tot ce crești cu grijă își găsește locul aici.
      </p>
      <div className="dashboard-actions">
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? <X size={17} /> : <Plus size={17} />}
          {showForm ? 'Închide formularul' : 'Adaugă un produs'}
        </Button>
        <Link className="button button-secondary" to="/orders">
          <Package size={17} /> Vezi comenzile <ArrowRight size={16} />
        </Link>
      </div>
      {showForm && (
        <form className="product-form" onSubmit={save}>
          <h2>O nouă bunătate în piață.</h2>
          <Field
            label="Numele produsului"
            name="title"
            value={values.title}
            onChange={change}
            minLength={3}
            maxLength={100}
            required
          />
          <label className="field">
            Descriere
            <textarea
              name="description"
              value={values.description}
              onChange={change}
              minLength={10}
              maxLength={2000}
              required
            />
          </label>
          <div className="form-row">
            <label className="field">
              Categorie
              <select name="category" value={values.category} onChange={change}>
                <option value="legume">Legume</option>
                <option value="fructe">Fructe</option>
                <option value="lactate">Lactate</option>
                <option value="oua">Ouă</option>
                <option value="miere">Miere</option>
                <option value="camara">Din cămară</option>
              </select>
            </label>
            <label className="field">
              Unitate
              <select name="unit" value={values.unit} onChange={change}>
                <option>kg</option>
                <option>buc</option>
                <option>l</option>
              </select>
            </label>
          </div>
          <div className="form-row">
            <Field
              label="Preț (lei)"
              type="number"
              name="priceAmount"
              value={values.priceAmount}
              onChange={change}
              min="0.01"
              max="999999.99"
              step="0.01"
              required
            />
            <Field
              label="Cantitate disponibilă"
              type="number"
              name="availableQuantity"
              value={values.availableQuantity}
              onChange={change}
              min="0"
              max="100000"
              step="1"
              required
            />
          </div>
          <Field
            label="Adresa imaginii (HTTPS)"
            type="url"
            name="imageUrl"
            value={values.imageUrl}
            onChange={change}
            placeholder="https://…"
            required
          />
          {saveError && (
            <p className="form-error" role="alert">
              {saveError}
            </p>
          )}
          <Button type="submit" loading={pending}>
            <Sprout size={17} />
            Publică produsul
          </Button>
        </form>
      )}
      <div className="section-heading">
        <h2>
          Produsele tale <span className="muted">({data?.total ?? 0})</span>
        </h2>
      </div>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : !data.items.length ? (
        <EmptyState
          title="Prima bunătate începe cu tine."
          text="Adaugă un produs și fă cunoștință cu primii tăi cumpărători."
        />
      ) : (
        <div className="dashboard-products">
          {data.items.map((product) => (
            <article key={product.id}>
              <img src={product.imageUrl} alt={product.title} />
              <Link to={`/products/${product.id}`}>{product.title}</Link>
              <span>
                {product.availableQuantity} {product.unit} în stoc
              </span>
              <strong>
                {money(product.priceAmount)} lei / {product.unit}
              </strong>
            </article>
          ))}
        </div>
      )}
      {children}
    </section>
  );
}
