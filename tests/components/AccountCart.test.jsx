import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import { ServicesProvider } from '../../src/presentation/shared/hooks/ServicesContext.jsx';
import { AuthProvider } from '../../src/presentation/features/auth/AuthProvider.jsx';
import { useAuth } from '../../src/presentation/features/auth/AuthContext.js';
import { CartProvider } from '../../src/presentation/features/cart/CartProvider.jsx';
import { useCart } from '../../src/presentation/features/cart/CartContext.js';
import {
  clearStoredCart,
  readStoredCartOwner,
} from '../../src/infrastructure/features/cart/cartStorage.js';
import { useState } from 'react';

const sampleProduct = {
  id: 'prod-1',
  title: 'Roșii de grădină',
  producerId: 'farmer-1',
  priceAmount: '35.00',
  unit: 'kg',
  availableQuantity: 5,
};

function AccountCartHarness({ children }) {
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

function Probe() {
  const { items, count, add } = useCart();
  const { user, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="count">{count}</span>
      <span data-testid="user">{user?.id ?? 'guest'}</span>
      <span data-testid="titles">
        {items.map((entry) => entry.product.title).join(',')}
      </span>
      <button type="button" onClick={() => add(sampleProduct)}>
        Add
      </button>
      <button
        type="button"
        onClick={() => login({ email: 'a@b.md', password: 'x' })}
      >
        Login
      </button>
      <button type="button" onClick={() => logout()}>
        Logout
      </button>
    </div>
  );
}

beforeEach(() => {
  clearStoredCart();
});

it('preserves a logged-in buyer cart across a page refresh while session hydration is pending', async () => {
  const buyer = { id: 'buyer-1', role: 'buyer', name: 'Ana' };
  const auth = {
    session: vi.fn().mockResolvedValue({ user: buyer }),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn().mockResolvedValue(undefined),
  };
  const user = userEvent.setup();
  render(
    <ServicesProvider services={{ auth }}>
      <AuthProvider>
        <AccountCartHarness>
          <Probe />
        </AccountCartHarness>
      </AuthProvider>
    </ServicesProvider>,
  );
  await expect
    .poll(() => screen.getByTestId('user').textContent)
    .toBe('buyer-1');
  await user.click(screen.getByRole('button', { name: 'Add' }));
  expect(screen.getByTestId('count')).toHaveTextContent('1');
  expect(readStoredCartOwner()).toBe('buyer-1');

  cleanup();

  // Simulate page reload where /auth/session resolves asynchronously.
  const { promise, resolve } = Promise.withResolvers();
  const reloadAuth = { ...auth, session: vi.fn().mockReturnValue(promise) };
  render(
    <ServicesProvider services={{ auth: reloadAuth }}>
      <AuthProvider>
        <AccountCartHarness>
          <Probe />
        </AccountCartHarness>
      </AuthProvider>
    </ServicesProvider>,
  );
  // Optimistically visible even while session is still loading, and storage is not wiped!
  expect(screen.getByTestId('count')).toHaveTextContent('1');
  expect(readStoredCartOwner()).toBe('buyer-1');

  resolve({ user: buyer });
  await expect
    .poll(() => screen.getByTestId('user').textContent)
    .toBe('buyer-1');
  expect(screen.getByTestId('count')).toHaveTextContent('1');
  expect(screen.getByTestId('titles')).toHaveTextContent('Roșii de grădină');
});

it('keeps guest cart on refresh and first login, and clears it on logout or expired session', async () => {
  const buyer = { id: 'buyer-1', role: 'buyer', name: 'Ana' };
  const auth = {
    session: vi.fn().mockResolvedValue({ user: null }),
    login: vi.fn().mockResolvedValue({ user: buyer }),
    register: vi.fn(),
    logout: vi.fn().mockResolvedValue(undefined),
  };
  const user = userEvent.setup();
  render(
    <ServicesProvider services={{ auth }}>
      <AuthProvider>
        <AccountCartHarness>
          <Probe />
        </AccountCartHarness>
      </AuthProvider>
    </ServicesProvider>,
  );
  await user.click(screen.getByRole('button', { name: 'Add' }));
  expect(screen.getByTestId('count')).toHaveTextContent('1');

  cleanup();

  // Refresh as guest -> still has item; then login -> keeps item; then logout -> clears item.
  render(
    <ServicesProvider services={{ auth }}>
      <AuthProvider>
        <AccountCartHarness>
          <Probe />
        </AccountCartHarness>
      </AuthProvider>
    </ServicesProvider>,
  );
  expect(screen.getByTestId('count')).toHaveTextContent('1');
  await user.click(screen.getByRole('button', { name: 'Login' }));
  await expect
    .poll(() => screen.getByTestId('user').textContent)
    .toBe('buyer-1');
  expect(screen.getByTestId('count')).toHaveTextContent('1');
  expect(readStoredCartOwner()).toBe('buyer-1');

  await user.click(screen.getByRole('button', { name: 'Logout' }));
  await expect.poll(() => screen.getByTestId('user').textContent).toBe('guest');
  expect(screen.getByTestId('count')).toHaveTextContent('0');
  expect(readStoredCartOwner()).toBeNull();
});
