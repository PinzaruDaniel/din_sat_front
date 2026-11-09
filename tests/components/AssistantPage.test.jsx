import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import { AssistantPage } from '../../src/presentation/features/ai/AssistantPage.jsx';
import { CartContext } from '../../src/presentation/features/cart/CartContext.js';
import { ServicesProvider } from '../../src/presentation/shared/hooks/ServicesContext.jsx';

const proposal = {
  id: 'proposal',
  totalAmount: '70.00',
  items: [
    { product: { id: 'product', title: 'Roșii', unit: 'kg' }, quantity: 2 },
  ],
};

async function openAssistant(assistant, items = []) {
  const user = userEvent.setup();
  const dispatch = vi.fn();
  render(
    <ServicesProvider services={{ assistant }}>
      <CartContext value={{ items, dispatch }}>
        <MemoryRouter initialEntries={['/assistant']}>
          <Routes>
            <Route path="/" element={<h1>Catalog</h1>} />
            <Route path="/assistant" element={<AssistantPage />} />
            <Route path="/cart" element={<h1>Coș</h1>} />
          </Routes>
        </MemoryRouter>
      </CartContext>
    </ServicesProvider>,
  );
  await user.type(screen.getByLabelText('Ce produse cauți?'), 'roșii');
  await user.click(screen.getByRole('button', { name: 'Trimite' }));
  return { user, dispatch };
}

it('asks before replacing a basket and uses only canonical items from the API', async () => {
  const canonical = [
    {
      product: { id: 'product', title: 'Roșii de grădină', unit: 'kg' },
      quantity: 2,
    },
  ];
  const assistant = {
    chat: vi.fn().mockResolvedValue({ message: 'Am găsit roșii.', proposal }),
    confirm: vi.fn().mockResolvedValue({ items: canonical }),
  };
  const { user, dispatch } = await openAssistant(assistant, [
    { product: { id: 'existing' } },
  ]);
  expect(await screen.findByText('Roșii · 2 kg')).toBeVisible();
  expect(screen.getByText('Total estimat 70 MDL')).toBeVisible();
  await user.click(
    screen.getByRole('button', { name: 'Adaugă propunerea în coș' }),
  );
  expect(assistant.confirm).not.toHaveBeenCalled();
  expect(dispatch).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Înlocuiește coșul' }));
  expect(await screen.findByRole('heading', { name: 'Coș' })).toBeVisible();
  expect(assistant.confirm).toHaveBeenCalledWith(
    'proposal',
    expect.any(AbortSignal),
  );
  expect(dispatch).toHaveBeenCalledWith({ type: 'replace', items: canonical });
});

it('leaves the basket untouched when the buyer declines', async () => {
  const assistant = {
    chat: vi.fn().mockResolvedValue({ message: 'Am găsit roșii.', proposal }),
    confirm: vi.fn(),
  };
  const { user, dispatch } = await openAssistant(assistant);
  await user.click(
    await screen.findByRole('button', { name: 'Refuză propunerea' }),
  );
  expect(
    screen.queryByRole('article', { name: 'Propunere de coș' }),
  ).toBeNull();
  expect(assistant.confirm).not.toHaveBeenCalled();
  expect(dispatch).not.toHaveBeenCalled();
});

it('keeps manual shopping available when the assistant is offline', async () => {
  const { dispatch } = await openAssistant({
    chat: vi.fn().mockRejectedValue({ code: 'AI_UNAVAILABLE' }),
  });
  expect(await screen.findByRole('alert')).toHaveTextContent('indisponibil');
  expect(
    screen.getByRole('link', { name: 'Continuă în catalog' }),
  ).toHaveAttribute('href', '/');
  expect(dispatch).not.toHaveBeenCalled();
});

it('cancels confirmation on navigation and ignores a late response', async () => {
  const { promise, resolve } = Promise.withResolvers();
  const assistant = {
    chat: vi.fn().mockResolvedValue({ message: 'Am găsit roșii.', proposal }),
    confirm: vi.fn().mockReturnValue(promise),
  };
  const { user, dispatch } = await openAssistant(assistant);
  await user.click(
    await screen.findByRole('button', { name: 'Adaugă propunerea în coș' }),
  );
  const signal = assistant.confirm.mock.calls[0][1];
  await user.click(screen.getByRole('link', { name: 'Continuă în catalog' }));
  expect(signal.aborted).toBe(true);
  await act(async () => resolve({ items: proposal.items }));
  expect(screen.getByRole('heading', { name: 'Catalog' })).toBeVisible();
  expect(dispatch).not.toHaveBeenCalled();
});
