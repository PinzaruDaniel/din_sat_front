import { randomUUID } from 'node:crypto';
import { test, expect } from '@playwright/test';

test.skip(
  process.env.NEON_E2E !== 'true',
  'Opt in with NEON_E2E=true: this test creates named verification records.',
);

async function submitAndRead(page, method, path, button) {
  const pending = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === `/api/v1${path}` &&
      response.request().method() === method,
  );
  await button.click();
  const response = await pending;
  expect(response.status()).toBe(201);
  return response.json();
}

function card(page, order) {
  return page
    .locator('.order-card')
    .filter({ hasText: `Comanda #${order.id.slice(0, 8)}` });
}

async function register(page, role, run) {
  await page.goto(`/register?role=${role}`);
  await page
    .getByLabel(role === 'producer' ? 'Numele gospodăriei' : 'Numele tău')
    .fill(`Neon verification ${role}`);
  await page
    .getByLabel('Adresa de email')
    .fill(`neon-ui-${role}-${run}@example.md`);
  await page.getByLabel('Parola', { exact: true }).fill(`NeonUi-${run}!`);
  await page
    .getByRole('button', { name: 'Creează contul', exact: true })
    .click();
  await expect(page).toHaveURL(role === 'producer' ? /\/producer$/ : /\/$/, {
    timeout: 20000,
  });
}

test('Neon PostgreSQL persists a real browser marketplace flow without demo seeds', async ({
  page,
  browser,
}) => {
  test.setTimeout(180000);
  const run = randomUUID();
  const title = `Neon UI verification ${run.slice(0, 8)}`;
  await register(page, 'producer', run);
  const origin = new URL(page.url()).origin;
  await page.getByRole('button', { name: 'Adaugă un produs' }).click();
  await page.getByLabel('Numele produsului').fill(title);
  await page
    .getByLabel('Descriere', { exact: true })
    .fill('Verification product for the Neon PostgreSQL integration.');
  await page.getByLabel('Preț (lei)').fill('12.50');
  await page.getByLabel('Cantitate disponibilă').fill('4');
  await page
    .getByLabel('Adresa imaginii (HTTPS)')
    .fill('https://example.com/neon-ui-verification.jpg');
  const product = await submitAndRead(
    page,
    'POST',
    '/products',
    page.getByRole('button', { name: 'Publică produsul' }),
  );
  await expect(page.locator('.dashboard-products')).toContainText(title, {
    timeout: 20000,
  });
  await page.getByRole('button', { name: 'Interval de ridicare' }).click();
  await page
    .getByLabel('Locul de ridicare')
    .fill('Neon verification pickup, Chișinău');
  const date = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
  await page.getByLabel('Data ridicării').fill(date);
  await submitAndRead(
    page,
    'POST',
    '/pickup-slots',
    page.getByRole('button', { name: 'Adaugă intervalul' }),
  );
  await expect(page.locator('.pickup-slot-list')).toContainText(
    'Neon verification',
    {
      timeout: 20000,
    },
  );

  const buyerContext = await browser.newContext({ baseURL: origin });
  try {
    const buyer = await buyerContext.newPage();
    await register(buyer, 'buyer', run);
    async function checkout() {
      await buyer.goto(`/products/${product.id}`);
      await expect(buyer.getByRole('heading', { name: title })).toBeVisible({
        timeout: 20000,
      });
      await buyer.getByRole('button', { name: 'Adaugă în coș' }).click();
      await buyer.getByRole('link', { name: /Coșul meu/ }).click();
      const pickup = buyer.getByLabel('Alege ridicarea');
      await expect(pickup).toBeEnabled({ timeout: 20000 });
      await expect(pickup.locator('option')).toHaveCount(2, { timeout: 20000 });
      await pickup.selectOption({ index: 1 });
      const order = await submitAndRead(
        buyer,
        'POST',
        '/orders',
        buyer.getByRole('button', { name: 'Confirmă comanda' }),
      );
      await expect(card(buyer, order)).toHaveCount(1, { timeout: 20000 });
      return order;
    }

    const cancelled = await checkout();
    await buyer.reload();
    await card(buyer, cancelled)
      .getByRole('button', { name: 'Anulează comanda' })
      .click();
    await card(buyer, cancelled)
      .getByRole('button', { name: 'Confirmă anularea' })
      .click();
    await expect(card(buyer, cancelled).locator('.status')).toHaveText(
      'Anulată',
      {
        timeout: 20000,
      },
    );

    const completed = await checkout();
    await page.goto('/orders');
    for (const status of [
      'Confirmată',
      'În pregătire',
      'Gata de ridicare',
      'Finalizată',
    ]) {
      await card(page, completed)
        .getByRole('button', { name: status, exact: true })
        .click();
      await expect(card(page, completed).locator('.status')).toHaveText(
        status,
        {
          timeout: 20000,
        },
      );
    }
    await buyer.reload();
    await expect(card(buyer, completed).locator('.status')).toHaveText(
      'Finalizată',
      { timeout: 20000 },
    );
    await expect(card(buyer, cancelled).locator('.status')).toHaveText(
      'Anulată',
    );
    await buyer.getByRole('button', { name: 'Deconectare' }).click();
    await buyer.goto('/orders');
    await expect(buyer).toHaveURL(/\/login\?redirect=/);
  } finally {
    await buyerContext.close();
  }
});
