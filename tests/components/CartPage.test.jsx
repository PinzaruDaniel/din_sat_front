import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import { AuthContext } from '../../src/presentation/features/auth/AuthContext.js';
import { CartContext } from '../../src/presentation/features/cart/CartContext.js';
import { CartPage } from '../../src/presentation/features/cart/CartPage.jsx';
import { ServicesProvider } from '../../src/presentation/shared/hooks/ServicesContext.jsx';

it('reuses the checkout key after a timeout and refreshes a slot that filled in the meantime', async () => {
  const user = userEvent.setup();
  const dispatch = vi.fn();
  const product = {
    id: 'tomatoes',
    producerId: 'producer',
    producer: { name: 'Gospodăria' },
    title: 'Roșii',
    imageUrl: 'https://example.com/product.jpg',
    availableQuantity: 2,
    priceAmount: '20.00',
    unit: 'kg',
  };
  const slot = {
    id: 'original-slot',
    startsAt: '2027-07-15T07:00:00.000Z',
    endsAt: '2027-07-15T09:00:00.000Z',
    location: 'Piața centrală',
    timeZone: 'Europe/Chisinau',
    capacity: 1,
  };
  const newSlot = {
    ...slot,
    id: 'alternate-slot',
    startsAt: '2027-07-15T08:00:00.000Z',
  };
  const list = vi
    .fn()
    .mockResolvedValueOnce({ items: [slot] })
    .mockResolvedValueOnce({ items: [{ ...slot, capacity: 0 }, newSlot] });
  const create = vi
    .fn()
    .mockRejectedValueOnce(new Error('Conexiunea a expirat.'))
    .mockRejectedValueOnce(
      Object.assign(new Error('Intervalul nu mai este disponibil.'), {
        code: 'SLOT_UNAVAILABLE',
      }),
    )
    .mockResolvedValueOnce({ id: 'confirmed-order', totalAmount: '20.00' });
  render(
    <ServicesProvider services={{ pickup: { list }, orders: { create } }}>
      <AuthContext value={{ user: { id: 'buyer', role: 'buyer' } }}>
        <CartContext
          value={{ items: [{ product, quantity: 1 }], total: 20, dispatch }}
        >
          <MemoryRouter initialEntries={['/cart']}>
            <Routes>
              <Route path="/cart" element={<CartPage />} />
              <Route path="/orders" element={<h1>Comenzi</h1>} />
            </Routes>
          </MemoryRouter>
        </CartContext>
      </AuthContext>
    </ServicesProvider>,
  );

  await screen.findByRole('option', { name: /Piața centrală/ });
  const selector = screen.getByLabelText('Alege ridicarea');
  const submit = screen.getByRole('button', { name: 'Confirmă comanda' });
  await user.selectOptions(selector, slot.id);
  await user.click(submit);
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Conexiunea a expirat.',
  );
  await user.click(submit);
  expect(await screen.findByRole('option', { name: /Ocupat/ })).toBeDisabled();
  expect(create.mock.calls[1][1]).toBe(create.mock.calls[0][1]);
  expect(selector).toHaveValue('');
  expect(submit).toBeDisabled();
  expect(dispatch).not.toHaveBeenCalled();

  await user.selectOptions(selector, newSlot.id);
  await user.click(submit);
  expect(await screen.findByRole('heading', { name: 'Comenzi' })).toBeVisible();
  expect(create.mock.calls[2][1]).not.toBe(create.mock.calls[0][1]);
  expect(create.mock.calls[2][0].pickupSlotId).toBe(newSlot.id);
  expect(list).toHaveBeenCalledTimes(2);
  expect(dispatch).toHaveBeenCalledWith({ type: 'clear' });
});
