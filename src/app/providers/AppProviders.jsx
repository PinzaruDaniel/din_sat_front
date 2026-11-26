import { useState } from 'react';
import { ServicesProvider } from '../../presentation/shared/hooks/ServicesContext.jsx';
import { AuthProvider } from '../../presentation/features/auth/AuthProvider.jsx';
import { useAuth } from '../../presentation/features/auth/AuthContext.js';
import { CartProvider } from '../../presentation/features/cart/CartProvider.jsx';
import { readStoredCartOwner } from '../../infrastructure/features/cart/cartStorage.js';
import { services } from '../container/services.js';

function AccountCart({ children }) {
  const { user, loading } = useAuth();
  const userId = user?.id ?? null;
  const [ownership, setOwnership] = useState(() => ({
    hydrated: !loading,
    userId,
    revision: 0,
    clear: false,
  }));

  if (!loading && !ownership.hydrated) {
    const storedOwner = readStoredCartOwner();
    const expiredUserCart = Boolean(storedOwner && storedOwner !== userId);
    setOwnership({
      hydrated: true,
      userId,
      revision: expiredUserCart ? ownership.revision + 1 : ownership.revision,
      clear: expiredUserCart,
    });
  } else if (!loading && ownership.userId !== userId) {
    // Keep a guest's basket on first login; clear it on logout or account switch.
    const shouldClear = Boolean(ownership.userId);
    setOwnership({
      hydrated: true,
      userId,
      revision: shouldClear ? ownership.revision + 1 : ownership.revision,
      clear: shouldClear,
    });
  }

  return (
    <CartProvider
      key={ownership.revision}
      ownerId={userId}
      authLoading={loading}
      clearOnMount={ownership.clear}
    >
      {children}
    </CartProvider>
  );
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
