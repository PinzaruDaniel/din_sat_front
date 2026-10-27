import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  ArrowRight,
  Check,
  ArrowLeft,
  Sprout,
  ShoppingBasket,
  Tractor,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from './AuthContext.js';
import { validateCredentials } from '../../../domain/features/auth/validateCredentials.js';
import { Button } from '../../shared/ui/Button.jsx';
import { Field } from '../../shared/ui/Field.jsx';
export function AuthPage({ registering = false }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [values, setValues] = useState({
    name: '',
    email: '',
    password: '',
    role: params.get('role') === 'producer' ? 'producer' : 'buyer',
  });
  const [visible, setVisible] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const from = params.get('redirect');
  const destination =
    from &&
    from.startsWith('/') &&
    !from.startsWith('//') &&
    !['/login', '/register'].includes(from.split('?')[0])
      ? from
      : null;
  if (auth.user)
    return (
      <Navigate
        to={destination || (auth.user.role === 'producer' ? '/producer' : '/')}
        replace
      />
    );
  function change(event) {
    setValues({ ...values, [event.target.name]: event.target.value });
    setErrors({ ...errors, [event.target.name]: undefined });
  }
  async function submit(event) {
    event.preventDefault();
    const fieldErrors = validateCredentials(values, registering);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length) return;
    setError('');
    setPending(true);
    try {
      const user = await auth[registering ? 'register' : 'login'](
        registering
          ? values
          : { email: values.email, password: values.password },
      );
      navigate(destination || (user.role === 'producer' ? '/producer' : '/'), {
        replace: true,
      });
    } catch (error) {
      setError(error.message);
      setErrors(error.fieldErrors || {});
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="auth-section container">
      <div className="auth-story">
        <img
          src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1000&q=90"
          alt="Peisaj rural cu dealuri și gospodării"
        />
        <div className="auth-story-overlay" />
        <span className="eyebrow auth-story-top">
          <Sprout size={17} /> CU RĂDĂCINI ÎN MOLDOVA
        </span>
        <div className="auth-story-text">
          <span className="auth-mini-line" />
          <h2>
            Un loc pentru
            <br />
            oameni buni.
            <br />
            <em>Și gusturi de acasă.</em>
          </h2>
          <p>
            Mai aproape de gospodari, de poveștile lor
            <br />
            și de lucrurile crescute cu grijă.
          </p>
          <div className="auth-benefits">
            <span>
              <Check size={14} /> Direct de la producător
            </span>
            <span>
              <Check size={14} /> Ridicare din apropiere
            </span>
          </div>
        </div>
        <span className="auth-story-bottom">
          BUN DE LA NOI. DIN SUFLET, PENTRU TINE.
        </span>
      </div>
      <div className="auth-form-side">
        <Link to="/" className="back-link">
          <ArrowLeft size={15} /> Înapoi în piață
        </Link>
        <div className="auth-form-inner">
          <span className="eyebrow">BINE AI VENIT ÎN COMUNITATE</span>
          <h1>{registering ? 'Hai să ne cunoaștem.' : 'Bine ai revenit.'}</h1>
          <p>
            {registering
              ? 'Un cont nou. Mai aproape de lucrurile bune.'
              : 'Bunătățile de acasă te așteaptă.'}
          </p>
          <div className="auth-tabs">
            <Link
              className={!registering ? 'active' : ''}
              to={`/login${destination ? `?redirect=${encodeURIComponent(destination)}` : ''}`}
            >
              Autentificare
            </Link>
            <Link
              className={registering ? 'active' : ''}
              to={`/register${destination ? `?redirect=${encodeURIComponent(destination)}` : ''}`}
            >
              Creează un cont
            </Link>
          </div>
          <form onSubmit={submit} noValidate>
            {registering && (
              <>
                <div
                  className="role-selector"
                  role="group"
                  aria-label="Tipul contului"
                >
                  <button
                    type="button"
                    className={values.role === 'buyer' ? 'selected' : ''}
                    onClick={() => setValues({ ...values, role: 'buyer' })}
                    aria-pressed={values.role === 'buyer'}
                  >
                    <ShoppingBasket size={19} />
                    <span>
                      Vreau să cumpăr<small>Descopăr bunătăți locale</small>
                    </span>
                  </button>
                  <button
                    type="button"
                    className={values.role === 'producer' ? 'selected' : ''}
                    onClick={() => setValues({ ...values, role: 'producer' })}
                    aria-pressed={values.role === 'producer'}
                  >
                    <Tractor size={20} />
                    <span>
                      Sunt producător<small>Împart ce cresc cu grijă</small>
                    </span>
                  </button>
                </div>
                <Field
                  label={
                    values.role === 'producer'
                      ? 'Numele gospodăriei'
                      : 'Numele tău'
                  }
                  name="name"
                  autoComplete="name"
                  placeholder="Cum te numești?"
                  value={values.name}
                  onChange={change}
                  error={errors.name}
                  required
                  maxLength={80}
                />
              </>
            )}
            <Field
              label="Adresa de email"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="nume@exemplu.md"
              value={values.email}
              onChange={change}
              error={errors.email}
              required
              maxLength={254}
            />
            <Field
              label="Parola"
              type={visible ? 'text' : 'password'}
              name="password"
              autoComplete={registering ? 'new-password' : 'current-password'}
              placeholder={
                registering ? 'Cel puțin 12 caractere' : 'Introdu parola ta'
              }
              value={values.password}
              onChange={change}
              error={errors.password}
              hint={
                registering
                  ? 'Alege o parolă unică, de cel puțin 12 caractere.'
                  : undefined
              }
              required
              maxLength={128}
            >
              <button
                type="button"
                className="password-toggle"
                aria-label={visible ? 'Ascunde parola' : 'Arată parola'}
                onClick={() => setVisible(!visible)}
              >
                {visible ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </Field>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" className="full-width" loading={pending}>
              {registering ? 'Creează contul' : 'Intră în cont'}
              <ArrowRight size={17} />
            </Button>
          </form>
          {!registering && (
            <div className="demo-credentials">
              <span className="demo-pill">DEMO</span>
              <div>
                <strong>Încearcă piața noastră</strong>
                <p>buyer@dinsat.demo · DinSatDemo2026!</p>
                <button
                  onClick={() => {
                    setValues({
                      ...values,
                      email: 'buyer@dinsat.demo',
                      password: 'DinSatDemo2026!',
                    });
                    setErrors({});
                  }}
                >
                  Completează datele demo <ArrowUpRightIcon />
                </button>
              </div>
            </div>
          )}
          <div className="auth-safe">
            <ShieldCheck size={15} />
            <span>Conexiune sigură. Datele tale rămân ale tale.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
function ArrowUpRightIcon() {
  return <ArrowRight size={12} />;
}
