import { useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Leaf,
  MapPin,
  HandHeart,
  ShoppingBasket,
  Carrot,
  Apple,
  Milk,
  Egg,
  Flower2,
  Package,
  SlidersHorizontal,
  Sprout,
  Check,
} from 'lucide-react';
import { useServices } from '../../shared/hooks/ServicesContext.js';
import { useResource } from '../../shared/hooks/useResource.js';
import { ErrorState, EmptyState } from '../../shared/ui/Feedback.jsx';
import { useCart } from '../cart/CartContext.js';
import { ProductCard } from './ProductCard.jsx';
const categories = [
  { id: '', name: 'Toate bunătățile', icon: ShoppingBasket },
  { id: 'legume', name: 'Legume', icon: Carrot },
  { id: 'fructe', name: 'Fructe', icon: Apple },
  { id: 'lactate', name: 'Lactate', icon: Milk },
  { id: 'oua', name: 'Ouă de țară', icon: Egg },
  { id: 'miere', name: 'Miere', icon: Flower2 },
  { id: 'camara', name: 'Din cămară', icon: Package },
];
export function MarketplacePage() {
  const [params, setParams] = useSearchParams();
  const { catalog } = useServices();
  const { add } = useCart();
  const query = params.toString();
  const load = useCallback(
    (signal) =>
      catalog.list(Object.fromEntries(new URLSearchParams(query)), signal),
    [catalog, query],
  );
  const { data, loading, error, reload } = useResource(load);
  const filtered =
    params.has('q') ||
    params.has('category') ||
    params.has('locality') ||
    params.has('producerId');
  function filter(key, value) {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    next.delete('page');
    setParams(next);
  }
  return (
    <>
      {!filtered && (
        <section className="hero container">
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="tiny-dot" /> DE AICI. DE LA NOI.
            </span>
            <h1>
              Gustul de acasă,
              <br />
              <em>mai aproape.</em>
            </h1>
            <p>
              Produse proaspete, oameni gospodari și povești locale.
              <br className="desktop-break" /> Descoperă bunătățile Moldovei,
              direct de la producători.
            </p>
            <a href="#produse" className="button button-primary">
              Descoperă produsele <ArrowRight size={17} />
            </a>
            <div className="hero-social">
              <div className="avatar-stack">
                <span>AR</span>
                <span>VM</span>
                <span>EP</span>
              </div>
              <div>
                <strong>Oameni buni. Produse pe măsură.</strong>
                <span>O comunitate cu rădăcini locale.</span>
              </div>
            </div>
          </div>
          <div className="hero-art">
            <img
              className="hero-photo"
              src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1300&q=90"
              alt="Dealuri verzi și câmpuri luminate de soare"
            />
            <div className="hero-photo-shade" />
            <div className="hero-photo-caption">
              <span>DIN PĂMÂNT BUN, CU DRAG</span>
              <h2>
                Lucrurile bune
                <br />
                cresc aproape.
              </h2>
              <Leaf size={32} strokeWidth={1.2} />
            </div>
            <div className="hero-stamp">
              <Sprout size={24} />
              <span>
                100%<small>de la noi</small>
              </span>
            </div>
            <div className="harvest-card">
              <div className="harvest-icon">
                <ShoppingBasket size={23} />
              </div>
              <div>
                <strong>Cules cu grijă.</strong>
                <span>Ales cu încredere.</span>
              </div>
              <span className="harvest-check">
                <Check size={15} />
              </span>
            </div>
          </div>
        </section>
      )}
      <section className="trust-bar container" aria-label="Promisiunea DinSat">
        <div>
          <Leaf size={22} />
          <span>
            <strong>Direct de la sursă</strong>
            <small>Fără drumuri în plus</small>
          </span>
        </div>
        <div>
          <HandHeart size={23} />
          <span>
            <strong>Susții oameni locali</strong>
            <small>Fiecare alegere contează</small>
          </span>
        </div>
        <div>
          <MapPin size={22} />
          <span>
            <strong>Ridici din apropiere</strong>
            <small>La locul și timpul potrivit</small>
          </span>
        </div>
        <span className="trust-note">Simplu. Local. Cu rost.</span>
      </section>
      <section className="catalog-section container" id="produse">
        <div className="section-heading">
          <div>
            <span className="eyebrow">PIAȚA TA LOCALĂ, ÎNTR-UN SINGUR LOC</span>
            <h2>
              {params.get('q')
                ? `Rezultate pentru „${params.get('q')}”`
                : 'Bunătăți de la gospodari'}
            </h2>
            <p>Gust autentic, de la oameni pe care merită să-i cunoști.</p>
          </div>
          <Link to="/producers" className="text-link">
            Cunoaște producătorii <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="category-list" aria-label="Categorii">
          {categories.map(({ id, name, icon: Icon }) => (
            <button
              key={id}
              className={`category ${(!params.get('category') && !id) || params.get('category') === id ? 'selected' : ''}`}
              onClick={() => filter('category', id)}
              aria-pressed={(params.get('category') || '') === id}
            >
              <Icon size={18} strokeWidth={1.6} />
              {name}
            </button>
          ))}
        </div>
        <div className="catalog-toolbar">
          <span>
            {loading
              ? 'Căutăm produse…'
              : `${data?.total ?? 0} produse cu gust de acasă`}
            {params.get('locality') && (
              <>
                {' '}
                · <strong>{params.get('locality')}</strong>
              </>
            )}
          </span>
          <div className="catalog-selects">
            <label>
              <SlidersHorizontal size={14} />
              <span className="sr-only">Localitate</span>
              <select
                aria-label="Filtrează după localitate"
                value={params.get('locality') || ''}
                onChange={(event) => filter('locality', event.target.value)}
              >
                <option value="">Toată Moldova</option>
                <option>Ialoveni</option>
                <option>Orhei</option>
                <option>Strășeni</option>
              </select>
            </label>
            <label>
              <span className="sr-only">Sortează produsele</span>
              <select
                aria-label="Sortează produsele"
                value={params.get('sort') || 'recommended'}
                onChange={(event) => filter('sort', event.target.value)}
              >
                <option value="recommended">Recomandate</option>
                <option value="price-asc">Preț crescător</option>
                <option value="price-desc">Preț descrescător</option>
              </select>
            </label>
          </div>
        </div>
        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : loading ? (
          <div
            className="product-grid"
            aria-label="Se încarcă produsele"
            aria-busy="true"
          >
            {[1, 2, 3, 4].map((key) => (
              <div className="product-skeleton" key={key}>
                <div />
                <span />
                <span />
              </div>
            ))}
          </div>
        ) : data?.items.length ? (
          <>
            <div className="product-grid">
              {data.items.map((product) => (
                <ProductCard key={product.id} product={product} onAdd={add} />
              ))}
            </div>
            {data.total > data.pageSize && (
              <div className="pagination">
                <button
                  className="button button-secondary"
                  disabled={data.page === 1}
                  onClick={() => {
                    const next = new URLSearchParams(params);
                    next.set('page', data.page - 1);
                    setParams(next);
                  }}
                >
                  Înapoi
                </button>
                <span>
                  Pagina {data.page} din {Math.ceil(data.total / data.pageSize)}
                </span>
                <button
                  className="button button-secondary"
                  disabled={data.page * data.pageSize >= data.total}
                  onClick={() => {
                    const next = new URLSearchParams(params);
                    next.set('page', data.page + 1);
                    setParams(next);
                  }}
                >
                  Înainte
                </button>
              </div>
            )}
          </>
        ) : (
          <EmptyState>
            <button
              className="button button-secondary"
              onClick={() => setParams({})}
            >
              Resetează filtrele
            </button>
          </EmptyState>
        )}
      </section>
      <section className="story-banner container">
        <div className="story-art">
          <Sprout size={67} strokeWidth={1} />
          <span>
            Din grija lor.
            <br />
            Pentru masa ta.
          </span>
        </div>
        <div className="story-copy">
          <span className="eyebrow">ÎN SPATELE FIECĂRUI PRODUS E UN OM</span>
          <h2>
            Cunoaște mâinile care
            <br />
            <em>cresc lucrurile bune.</em>
          </h2>
          <p>
            Familii, grădini și mici gospodării. Descoperă oamenii
            <br className="desktop-break" /> care pun suflet în fiecare produs.
          </p>
          <Link className="text-link" to="/producers">
            Poveștile producătorilor <ArrowRight size={17} />
          </Link>
        </div>
        <span className="story-number">01 / COMUNITATE</span>
      </section>
      <section className="how-section container" id="cum-functioneaza">
        <div className="section-heading">
          <div>
            <span className="eyebrow">DE LA GOSPODAR, LA TINE</span>
            <h2>Trei pași. O masă mai bună.</h2>
          </div>
          <span className="handwritten">Atât de simplu.</span>
        </div>
        <div className="steps">
          <div>
            <span className="step-number">01</span>
            <SearchIcon />
            <h3>Alegi ce îți place</h3>
            <p>
              Cauți în piața locală și descoperi
              <br />
              produsele și producătorii preferați.
            </p>
          </div>
          <div>
            <span className="step-number">02</span>
            <ShoppingBasket />
            <h3>Comanzi de la gospodar</h3>
            <p>
              Adaugi bunătăți de la un producător
              <br />
              și alegi un interval de ridicare.
            </p>
          </div>
          <div>
            <span className="step-number">03</span>
            <HandHeart />
            <h3>Ridici și te bucuri</h3>
            <p>
              Îți întâlnești producătorul și aduci
              <br />
              acasă gustul bun, de la noi.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
function SearchIcon() {
  return <Sprout size={27} strokeWidth={1.4} />;
}
