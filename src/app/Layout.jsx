import { useState } from 'react';
import {
  Link,
  NavLink,
  Outlet,
  useNavigate,
  useSearchParams,
  useLocation,
} from 'react-router-dom';
import {
  Search,
  MapPin,
  ShoppingBag,
  UserRound,
  ArrowUpRight,
  Menu,
  X,
  Leaf,
  LogOut,
  ArrowRight,
} from 'lucide-react';
import { Logo } from '../presentation/shared/ui/Logo.jsx';
import { useAuth } from '../presentation/features/auth/AuthContext.js';
import { useCart } from '../presentation/features/cart/CartContext.js';
export function Layout() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { pathname } = useLocation();
  const [menu, setMenu] = useState(false);
  const [error, setError] = useState('');
  async function signOut() {
    try {
      await logout();
      navigate('/');
      setMenu(false);
    } catch (error) {
      setError(error.message);
    }
  }
  return (
    <>
      <a className="skip-link" href="#main">
        Sari la conținut
      </a>
      <div className="announcement">
        <Leaf size={13} />
        <span>Din mâinile lor, pe masa ta. Susținem producătorii locali.</span>
        <span className="announcement-right">
          Cu drag, din Moldova <span aria-hidden="true">♡</span>
        </span>
      </div>
      <header className="header">
        <div className="container header-main">
          <Logo />
          <form
            className="search"
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              const q = new FormData(event.currentTarget).get('q');
              navigate(`/?${new URLSearchParams(q ? { q } : {})}`);
            }}
          >
            <Search size={18} />
            <input
              key={params.get('q')}
              name="q"
              defaultValue={params.get('q') || ''}
              placeholder="Ce bunătăți cauți astăzi?"
              aria-label="Caută produse"
            />
            <kbd>↵</kbd>
          </form>
          <div className="header-actions">
            <Link className="location-link" to="/?locality=Ialoveni">
              <MapPin size={18} />
              <span>
                Din apropierea ta<small>Moldova</small>
              </span>
            </Link>
            {user ? (
              <div className="account-links">
                <Link
                  className="account-link"
                  to={user.role === 'producer' ? '/producer' : '/orders'}
                >
                  <UserRound size={20} />
                  <span>{user.name.split(' ')[0]}</span>
                </Link>
                <button
                  className="icon-button logout"
                  onClick={signOut}
                  aria-label="Deconectare"
                >
                  <LogOut size={17} />
                </button>
              </div>
            ) : (
              <Link className="account-link" to="/login">
                <UserRound size={20} />
                <span>Contul meu</span>
              </Link>
            )}
            <Link
              className="cart-link"
              to="/cart"
              aria-label={`Coșul meu, ${count} produse`}
            >
              <ShoppingBag size={20} />
              <span className="cart-count">{count}</span>
            </Link>
            <button
              className="icon-button mobile-menu"
              aria-expanded={menu}
              aria-label="Meniu"
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        <div className={`nav-wrap ${menu ? 'is-open' : ''}`}>
          <nav
            className="container nav"
            aria-label="Navigare principală"
            onClick={() => setMenu(false)}
          >
            <div className="nav-links">
              <Link
                to="/"
                className={pathname === '/' && !params.size ? 'active' : ''}
              >
                Descoperă
              </Link>
              <Link
                to="/?category=legume"
                className={pathname === '/' && params.size ? 'active' : ''}
              >
                Produse locale
              </Link>
              <NavLink to="/producers">Producătorii noștri</NavLink>
              <Link to="/#cum-functioneaza">Cum funcționează</Link>
            </div>
            <Link
              className="producer-link"
              to={
                user?.role === 'producer'
                  ? '/producer'
                  : '/register?role=producer'
              }
            >
              Ești producător? <ArrowUpRight size={16} />
            </Link>
          </nav>
        </div>
      </header>
      {error && (
        <div className="container inline-error" role="alert">
          {error}
          <button onClick={() => setError('')} aria-label="Închide">
            ×
          </button>
        </div>
      )}
      <main id="main">
        <Outlet />
      </main>
      <footer className="footer">
        <div className="container footer-main">
          <div>
            <Logo light />
            <p>
              Mai aproape de oameni.
              <br />
              Mai aproape de gustul de acasă.
            </p>
          </div>
          <div className="footer-links">
            <Link to="/">
              Produse locale <ArrowRight size={15} />
            </Link>
            <Link to="/producers">
              Oamenii din spatele lor <ArrowRight size={15} />
            </Link>
            <Link to="/register?role=producer">
              Alătură-te ca producător <ArrowRight size={15} />
            </Link>
          </div>
          <div className="footer-note">
            <span className="eyebrow">CRESCUT CU GRIJĂ</span>
            <p>
              O comunitate mică.
              <br />
              <span>Un impact frumos.</span>
            </p>
            <Leaf size={25} />
          </div>
        </div>
        <div className="container footer-bottom">
          <span>
            © {new Date().getFullYear()} DinSat. Cu rădăcini în Moldova.
          </span>
          <span className="demo-label">
            Versiune demo · datele se resetează la repornire
          </span>
          <span>Bun de la noi. ♡</span>
        </div>
      </footer>
    </>
  );
}
