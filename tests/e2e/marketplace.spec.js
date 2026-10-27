import { test, expect } from '@playwright/test';

test('marketplace filters, login, checkout, refresh, cancellation and logout use the real API', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: /Gustul de acasă/ }),
  ).toBeVisible();
  await expect(page.locator('.product-card').first()).toBeVisible();
  expect(await page.locator('.product-card').count()).toBeGreaterThanOrEqual(6);
  await page.getByRole('button', { name: 'Legume', exact: true }).click();
  await expect(page.locator('.product-card').first()).toBeVisible();
  await expect(page.locator('.product-grid')).not.toContainText(
    'Miere de salcâm',
  );
  await expect(page).toHaveURL(/category=legume/);
  // Guest basket survives first login, while account changes clear it.
  await page
    .getByRole('button', { name: 'Adaugă Roșii de grădină în coș' })
    .click();
  await page.getByRole('link', { name: /Coșul meu/ }).click();
  await page
    .getByRole('button', { name: /Autentifică-te pentru a comanda/ })
    .click();
  await page.getByRole('button', { name: /Completează datele demo/ }).click();
  await page
    .getByRole('button', { name: 'Intră în cont', exact: true })
    .click();
  await expect(page).toHaveURL(/\/cart/);
  await expect(
    page.getByRole('heading', { name: 'Coșul tău cu bunătăți.' }),
  ).toBeVisible();
  await page.getByLabel('Alege ridicarea').selectOption({ index: 1 });
  await page.getByRole('button', { name: 'Confirmă comanda' }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Comanda a fost plasată' }),
  ).toBeVisible();
  const newest = page.locator('.order-card').last();
  await expect(newest).toContainText('35 lei');
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Comenzile tale.' }),
  ).toBeVisible();
  await newest.getByRole('button', { name: 'Anulează comanda' }).click();
  await expect(
    page.locator('.order-card').last().locator('.status'),
  ).toHaveText('Anulată');
  await page.getByRole('button', { name: 'Deconectare' }).click();
  await page.goto('/orders');
  await expect(page).toHaveURL(/\/login\?redirect=/);
  expect(errors).toEqual([]);
});

test('producer can register and publish a product visible in the real catalog', async ({
  page,
  browser,
}) => {
  await page.goto('/register?role=producer');
  await page.getByLabel('Numele gospodăriei').fill('Gospodăria de test');
  await page
    .getByLabel('Adresa de email')
    .fill(`producer-${Date.now()}@example.md`);
  await page.getByLabel('Parola', { exact: true }).fill('SecureProducer2026!');
  await page
    .getByRole('button', { name: 'Creează contul', exact: true })
    .click();
  await expect(page).toHaveURL(/\/producer$/);
  await page.getByRole('button', { name: 'Adaugă un produs' }).click();
  await page.getByLabel('Numele produsului').fill('Dovleac de toamnă');
  await page
    .getByLabel('Descriere', { exact: true })
    .fill('Dovleac proaspăt, crescut în grădina familiei.');
  await page.getByLabel('Preț (lei)').fill('25');
  await page.getByLabel('Cantitate disponibilă').fill('10');
  await page
    .getByLabel('Adresa imaginii (HTTPS)')
    .fill('https://images.unsplash.com/photo-1506917728037-b6af01a7d403?w=500');
  await page.getByRole('button', { name: 'Publică produsul' }).click();
  await expect(page.locator('.dashboard-products')).toContainText(
    'Dovleac de toamnă',
  );
  const productPath = await page
    .locator('.dashboard-products a')
    .first()
    .getAttribute('href');
  await page.getByRole('button', { name: 'Interval de ridicare' }).click();
  await page.getByLabel('Locul de ridicare').fill('Piața centrală, Chișinău');
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  await page.getByLabel('Data ridicării').fill(tomorrow);
  await page.getByRole('button', { name: 'Adaugă intervalul' }).click();
  await expect(page.locator('.pickup-list')).toContainText('Piața centrală');
  const buyerContext = await browser.newContext();
  const buyer = await buyerContext.newPage();
  await buyer.goto('http://localhost:5173/login');
  await buyer.getByRole('button', { name: /Completează datele demo/ }).click();
  await buyer
    .getByRole('button', { name: 'Intră în cont', exact: true })
    .click();
  await expect(buyer).toHaveURL('http://localhost:5173/');
  await buyer.goto(`http://localhost:5173${productPath}`);
  await buyer.getByRole('button', { name: 'Adaugă în coș' }).click();
  await buyer.getByRole('link', { name: /Coșul meu/ }).click();
  await buyer.getByLabel('Alege ridicarea').selectOption({ index: 1 });
  await buyer.getByRole('button', { name: 'Confirmă comanda' }).click();
  await expect(
    buyer.getByRole('heading', { name: 'Comenzile tale.' }),
  ).toBeVisible();
  await page.goto('/orders');
  for (const status of [
    'Confirmată',
    'În pregătire',
    'Gata de ridicare',
    'Finalizată',
  ]) {
    await page.getByRole('button', { name: status, exact: true }).click();
    await expect(page.locator('.status')).toHaveText(status);
  }
  await buyer.reload();
  await expect(
    buyer.locator('.order-card').last().locator('.status'),
  ).toHaveText('Finalizată');
  await buyerContext.close();
});

test('mobile pages remain within the viewport and show form validation', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  for (const path of [
    '/',
    '/login',
    '/register',
    '/products/product-1',
    '/producers',
  ]) {
    await page.goto(path);
    await expect(page.locator('h1')).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await page.goto('/register');
  await page
    .getByRole('button', { name: 'Creează contul', exact: true })
    .click();
  await expect(page.getByText('Introdu un email valid.')).toBeVisible();
  await expect(
    page.getByText('Folosește cel puțin 12 caractere.'),
  ).toBeVisible();
});
