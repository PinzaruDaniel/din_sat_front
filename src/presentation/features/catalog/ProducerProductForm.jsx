import { useId, useState } from 'react';
import { Sprout } from 'lucide-react';
import { Button } from '../../shared/ui/Button.jsx';
import { Field } from '../../shared/ui/Field.jsx';
import { productImageUrl } from '../../../shared/lib/productImageUrl.js';

const supportedImages = ['image/png', 'image/jpeg', 'image/webp'];
const maxImageBytes = 2 * 1024 * 1024;
const initial = {
  title: '',
  description: '',
  category: 'legume',
  unit: 'kg',
  priceAmount: '',
  availableQuantity: '',
  imageUrl: '',
};

function priceAmount(value) {
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(value)) return value;
  const [whole, decimal = ''] = value.split('.');
  return `${whole}.${decimal.padEnd(2, '0')}`;
}

function isPreviewable(value) {
  return (
    value.startsWith('https://') || value.startsWith('/api/v1/product-images/')
  );
}

export function ProducerProductForm({ product, catalog, onClose, onSaved }) {
  const descriptionId = useId();
  const [values, setValues] = useState(() =>
    Object.fromEntries(
      Object.entries(initial).map(([name, value]) => [
        name,
        product[name] ?? value,
      ]),
    ),
  );
  const [saveError, setSaveError] = useState(null);
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploaded, setUploaded] = useState(false);
  const fields = saveError?.fieldErrors;
  const busy = pending || uploading;

  function change({ target }) {
    setValues((current) => ({ ...current, [target.name]: target.value }));
    if (target.name === 'imageUrl') {
      setUploadError('');
      setUploaded(false);
    }
  }

  async function upload({ target }) {
    const [file] = target.files;
    if (!file) return;
    target.value = '';
    setUploaded(false);
    if (!supportedImages.includes(file.type)) {
      setUploadError('Alege o imagine PNG, JPEG sau WebP.');
      return;
    }
    if (file.size > maxImageBytes) {
      setUploadError('Imaginea poate avea cel mult 2 MB.');
      return;
    }

    setUploading(true);
    setUploadError('');
    try {
      const image = await catalog.upload(file);
      setValues((current) => ({ ...current, imageUrl: image.imageUrl }));
      setUploaded(true);
    } catch (error) {
      setUploadError(error.message);
    } finally {
      setUploading(false);
    }
  }

  async function save(event) {
    event.preventDefault();
    if (busy || uploadError) return;
    setPending(true);
    setSaveError(null);
    try {
      const payload = {
        ...values,
        priceAmount: priceAmount(values.priceAmount),
        availableQuantity:
          values.availableQuantity === ''
            ? null
            : Number(values.availableQuantity),
      };
      if (product.id) {
        const changes = Object.fromEntries(
          Object.entries(payload).filter(
            ([name, value]) => product[name] !== value,
          ),
        );
        await catalog.update(product.id, changes);
      } else await catalog.create(payload);
      onSaved();
    } catch (error) {
      setSaveError(error);
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="product-form" onSubmit={save} noValidate>
      <h2>{product.id ? 'Editează produsul' : 'O nouă bunătate în piață.'}</h2>
      <Field
        label="Numele produsului"
        name="title"
        value={values.title}
        onChange={change}
        error={fields?.title}
        maxLength={100}
        required
        disabled={pending}
      />
      <label className="field">
        Descriere
        <textarea
          name="description"
          value={values.description}
          onChange={change}
          maxLength={2000}
          required
          disabled={pending}
          aria-invalid={Boolean(fields?.description)}
          aria-describedby={fields?.description ? descriptionId : undefined}
        />
        {fields?.description && (
          <span id={descriptionId} className="field-error">
            {fields.description}
          </span>
        )}
      </label>
      <div className="form-row">
        <label className="field">
          Categorie
          <select
            name="category"
            value={values.category}
            onChange={change}
            disabled={pending}
          >
            <option value="legume">Legume</option>
            <option value="fructe">Fructe</option>
            <option value="lactate">Lactate</option>
            <option value="oua">Ouă</option>
            <option value="miere">Miere</option>
            <option value="camara">Din cămară</option>
          </select>
          {fields?.category && (
            <span className="field-error">{fields.category}</span>
          )}
        </label>
        <label className="field">
          Unitate
          <select
            name="unit"
            value={values.unit}
            onChange={change}
            disabled={pending}
          >
            <option>kg</option>
            <option>buc</option>
            <option>l</option>
          </select>
          {fields?.unit && <span className="field-error">{fields.unit}</span>}
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
          error={fields?.priceAmount}
          required
          disabled={pending}
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
          error={fields?.availableQuantity}
          required
          disabled={pending}
        />
      </div>
      <Field
        label="Imaginea produsului"
        type="file"
        accept={supportedImages.join(',')}
        onChange={upload}
        error={uploadError}
        hint="PNG, JPEG sau WebP, maximum 2 MB."
        disabled={busy}
      />
      {uploading && <p role="status">Încărcăm imaginea…</p>}
      {uploaded && <p role="status">Imaginea a fost încărcată.</p>}
      <Field
        label="Adresa imaginii (HTTPS)"
        type="text"
        name="imageUrl"
        value={values.imageUrl}
        onChange={change}
        placeholder="https://…"
        error={fields?.imageUrl}
        required
        disabled={busy}
      />
      {isPreviewable(values.imageUrl) && (
        <img
          className="producer-product-preview"
          src={productImageUrl(values.imageUrl)}
          alt="Previzualizare produs"
        />
      )}
      {saveError && (
        <p className="form-error" role="alert">
          {saveError.message}
        </p>
      )}
      <div className="dashboard-actions">
        <Button
          type="submit"
          loading={pending}
          disabled={uploading || Boolean(uploadError)}
        >
          <Sprout size={17} />
          {product.id ? 'Salvează produsul' : 'Publică produsul'}
        </Button>
        <Button variant="secondary" onClick={onClose} disabled={busy}>
          Renunță
        </Button>
      </div>
    </form>
  );
}
