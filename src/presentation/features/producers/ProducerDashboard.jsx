import { Link } from 'react-router-dom';
import { ArrowRight, Package } from 'lucide-react';
import { useAuth } from '../auth/AuthContext.js';
import { ProducerProfileSection } from './ProducerProfileSection.jsx';
import { ProducerProductsSection } from '../catalog/ProducerProductsSection.jsx';

export function ProducerDashboard({ children }) {
  const { user } = useAuth();
  return (
    <section className="container page-section">
      <span className="eyebrow">GOSPODĂRIA TA, MAI APROAPE DE OAMENI</span>
      <h1>Bună, {user.name}.</h1>
      <p className="page-intro">
        Tot ce crești cu grijă își găsește locul aici.
      </p>
      <div className="dashboard-actions">
        <Link className="button button-secondary" to="/orders">
          <Package size={17} /> Vezi comenzile <ArrowRight size={16} />
        </Link>
      </div>
      <ProducerProfileSection key={`profile-${user.id}`} />
      <ProducerProductsSection key={`products-${user.id}`} />
      {children}
    </section>
  );
}
