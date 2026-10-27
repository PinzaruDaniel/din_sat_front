import { Sprout, AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './Button.jsx';
export function ErrorState({ error, onRetry }) {
  return (
    <div className="feedback error" role="alert">
      <AlertCircle size={24} />
      <h3>Ceva nu a mers cum trebuie</h3>
      <p>{error.message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Încearcă din nou
        </Button>
      )}
    </div>
  );
}
export function EmptyState({
  title = 'Nu am găsit produse',
  text = 'Încearcă o altă căutare sau schimbă filtrele.',
  children,
}) {
  return (
    <div className="feedback">
      <Sprout size={38} strokeWidth={1.3} />
      <h2>{title}</h2>
      <p>{text}</p>
      {children}
    </div>
  );
}
export function Loading({ text = 'Încărcăm bunătățile…' }) {
  return (
    <div className="feedback" role="status">
      <span className="spinner large" />
      <p>{text}</p>
    </div>
  );
}
export function BackToShop() {
  return (
    <Link className="button button-primary" to="/">
      Descoperă produsele <ArrowRight size={17} />
    </Link>
  );
}
