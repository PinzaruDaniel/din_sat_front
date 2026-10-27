import { Sprout } from 'lucide-react';
import { Link } from 'react-router-dom';
export function Logo({ light = false }) {
  return (
    <Link
      to="/"
      className={`logo ${light ? 'logo-light' : ''}`}
      aria-label="DinSat — pagina principală"
    >
      <span className="logo-mark">
        <Sprout size={27} strokeWidth={1.7} />
      </span>
      Din<span className="logo-serif">Sat</span>
      <span className="logo-dot">.</span>
    </Link>
  );
}
