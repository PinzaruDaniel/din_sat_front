import { useState } from 'react';
import { ServicesProvider } from '../../presentation/shared/hooks/ServicesContext.jsx';
import { AuthProvider } from '../../presentation/features/auth/AuthProvider.jsx';
import { useAuth } from '../../presentation/features/auth/AuthContext.js';
import { CartProvider } from '../../presentation/features/cart/CartProvider.jsx';
import { services } from '../container/services.js';
function AccountCart({ children }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [ownership, setOwnership] = useState({ userId, revision: 0 });
  if (ownership.userId !== userId) {
    // Keep a guest's basket on first login; clear it on logout or account switch.
    setOwnership({
      userId,
      revision: ownership.revision + (ownership.userId ? 1 : 0),
    });
  }
  return <CartProvider key={ownership.revision}>{children}</CartProvider>;
}
export function AppProviders({ children }) {
  return (
    <ServicesProvider services={services}>
      <AuthProvider>
        <AccountCart>{children}</AccountCart>
      </AuthProvider>
    </ServicesProvider>
  );
}
