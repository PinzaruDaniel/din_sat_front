import { act, fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { ProducerDashboardStats } from '../../src/presentation/features/dashboard/ProducerDashboardStats.jsx';
import { ServicesContext } from '../../src/presentation/shared/hooks/ServicesContext.js';

const period = { from: '2026-03-01', to: '2026-03-31' };
const report = (values, counts = {}) => ({
  period: { ...values, timeZone: 'Europe/Chisinau' },
  orderCount: 0,
  activeCount: 0,
  completedCount: 0,
  cancelledCount: 0,
  completedAmounts: [{ currency: 'MDL', amount: '0.00' }],
  popularProducts: [],
  ...counts,
});

function setup(read) {
  render(
    <ServicesContext value={{ dashboard: { read } }}>
      <ProducerDashboardStats />
    </ServicesContext>,
  );
  const from = screen.getByLabelText('De la');
  const to = screen.getByLabelText('Până la');
  return {
    from,
    to,
    change(values) {
      fireEvent.change(from, { target: { value: values.from } });
      fireEvent.change(to, { target: { value: values.to } });
      fireEvent.click(screen.getByRole('button', { name: 'Aplică perioada' }));
    },
  };
}

it('shows zero values and the server period, and rejects a reversed period', async () => {
  const read = vi.fn().mockResolvedValue(report(period));
  const form = setup(read);
  expect(screen.getByRole('status')).toHaveTextContent('Încărcăm statisticile');
  expect(
    await screen.findByText('Nu ai comenzi în această perioadă.'),
  ).toBeVisible();
  expect(screen.getByText(/0,00\s+MDL/)).toBeVisible();
  expect(screen.getByText(/Europe\/Chisinau/)).toBeVisible();
  expect(form.from).toHaveValue(period.from);
  expect(form.to).toHaveValue(period.to);
  form.change({ from: '2026-03-30', to: '2026-03-29' });
  expect(form.to).toBeInvalid();
  expect(read).toHaveBeenCalledTimes(1);
});

it('ignores a slower request after a new reporting period is applied', async () => {
  let finishPrevious;
  const previous = new Promise((resolve) => {
    finishPrevious = resolve;
  });
  const read = vi
    .fn()
    .mockResolvedValueOnce(report(period))
    .mockReturnValueOnce(previous)
    .mockResolvedValueOnce(
      report(
        { from: '2026-05-01', to: '2026-05-31' },
        {
          orderCount: 1,
          completedCount: 1,
          completedAmounts: [
            { currency: 'MDL', amount: '15.02' },
            { currency: 'EUR', amount: '4.10' },
          ],
          popularProducts: [
            { productId: 'apples', title: 'Mere din livadă', orderCount: 1 },
          ],
        },
      ),
    );
  const form = setup(read);
  await screen.findByText('Nu ai comenzi în această perioadă.');
  const april = { from: '2026-04-01', to: '2026-04-30' };
  form.change(april);
  expect(screen.queryByText('Nu ai comenzi în această perioadă.')).toBeNull();
  form.change({ from: '2026-05-01', to: '2026-05-31' });
  expect(read.mock.calls[1][1].aborted).toBe(true);
  expect(await screen.findByText(/Mere din livadă/)).toBeVisible();
  expect(screen.getByText(/15,02\s+MDL/)).toBeVisible();
  expect(screen.getByText(/4,10\s+EUR/)).toBeVisible();
  await act(async () => finishPrevious(report(april)));
  expect(screen.queryByText('Nu ai comenzi în această perioadă.')).toBeNull();
  expect(screen.getByText(/Mere din livadă/)).toBeVisible();
});

it('lets a producer retry a failed report', async () => {
  const read = vi
    .fn()
    .mockRejectedValueOnce(new Error('Raportul nu este disponibil.'))
    .mockResolvedValueOnce(report(period));
  setup(read);
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Raportul nu este disponibil.',
  );
  fireEvent.click(screen.getByRole('button', { name: 'Încearcă din nou' }));
  expect(
    await screen.findByText('Nu ai comenzi în această perioadă.'),
  ).toBeVisible();
});
