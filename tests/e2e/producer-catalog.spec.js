import { test, expect } from '@playwright/test';

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGNQSrYDAAFuAMTo5d1kAAAAAElFTkSuQmCC',
  'base64',
);

test('producer edits the public profile, uploads and edits a product, then archives it on mobile', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  const suffix = Date.now();
  const title = `Mere din grădină ${suffix}`;
  const locality = `Criuleni ${suffix}`;
  await page.goto('/register?role=producer');
  await page.getByLabel('Numele gospodăriei').fill('Gospodărie de test');
  await page.getByLabel('Adresa de email').fill(`catalog-${suffix}@example.md`);
  await page.getByLabel('Parola', { exact: true }).fill('SecureProducer2026!');
  await page
    .getByRole('button', { name: 'Creează contul', exact: true })
    .click();
  await expect(page).toHaveURL(/\/producer$/);

  await page.getByRole('button', { name: 'Editează profilul' }).click();
  const name = page.getByLabel('Numele public al gospodăriei');
  await name.fill('');
  await page.getByLabel('Localitate', { exact: true }).fill(locality);
  await page.getByRole('button', { name: 'Salvează profilul' }).click();
  await expect(page.getByText('Introdu cel puțin 2 caractere.')).toBeVisible();
  await expect(page.getByLabel('Localitate', { exact: true })).toHaveValue(
    locality,
  );
  await name.fill('Gospodăria de la livadă');
  await page
    .getByLabel('Descrierea gospodăriei')
    .fill('Fructe culese în livada familiei noastre.');
  await page.getByRole('button', { name: 'Salvează profilul' }).click();
  await expect(page.getByText('Profilul a fost actualizat.')).toBeVisible();
  await page.reload();
  await page.getByRole('link', { name: 'Vezi profilul public' }).click();
  await expect(
    page.getByRole('heading', { name: 'Gospodăria de la livadă' }),
  ).toBeVisible();
  await expect(page.getByText(locality, { exact: true })).toBeVisible();

  await page.goto('/producer');
  await page.getByRole('button', { name: 'Adaugă un produs' }).click();
  const form = page.locator('.product-form');
  await form.getByLabel('Numele produsului').fill(title);
  await form
    .getByLabel('Descriere', { exact: true })
    .fill('Mere parfumate culese în livada noastră.');
  await form.getByLabel('Categorie').selectOption('fructe');
  await form.getByLabel('Preț (lei)').fill('25.95');
  await form.getByLabel('Cantitate disponibilă').fill('10');
  const image = form.getByLabel('Imaginea produsului');
  await image.setInputFiles({
    name: 'wrong.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('wrong'),
  });
  await expect(
    form.getByText('Alege o imagine PNG, JPEG sau WebP.'),
  ).toBeVisible();
  await image.setInputFiles({
    name: 'big.png',
    mimeType: 'image/png',
    buffer: Buffer.alloc(2 * 1024 * 1024 + 1),
  });
  await expect(
    form.getByText('Imaginea poate avea cel mult 2 MB.'),
  ).toBeVisible();
  await image.setInputFiles({
    name: 'broken.png',
    mimeType: 'image/png',
    buffer: Buffer.from('wrong'),
  });
  await expect(
    form.getByText('Fișierul nu conține o imagine validă.'),
  ).toBeVisible();
  await expect(form.getByLabel('Numele produsului')).toHaveValue(title);
  await expect(
    form.getByRole('button', { name: 'Publică produsul' }),
  ).toBeDisabled();
  await image.setInputFiles({
    name: 'mere.png',
    mimeType: 'image/png',
    buffer: png,
  });
  const preview = form.getByRole('img', { name: 'Previzualizare produs' });
  await expect(preview).toBeVisible();
  await expect.poll(() => preview.evaluate((img) => img.naturalWidth)).toBe(1);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(360);
  await form.getByRole('button', { name: 'Publică produsul' }).click();

  const article = page
    .locator('.dashboard-products article')
    .filter({ hasText: title });
  await expect(article).toBeVisible();
  const productPath = await article
    .getByRole('link', { name: title })
    .getAttribute('href');
  await article.getByRole('button', { name: 'Editează' }).click();
  const updatedTitle = `Mere proaspete ${suffix}`;
  await form.getByLabel('Numele produsului').fill(updatedTitle);
  await form.getByRole('button', { name: 'Salvează produsul' }).click();
  const updated = page
    .locator('.dashboard-products article')
    .filter({ hasText: updatedTitle });
  await expect(updated).toBeVisible();
  await page.goto(productPath);
  await expect(page.getByRole('heading', { name: updatedTitle })).toBeVisible();
  await expect
    .poll(() =>
      page
        .getByRole('img', { name: updatedTitle })
        .evaluate((img) => img.naturalWidth),
    )
    .toBe(1);
  await expect(
    page.getByRole('link', { name: 'Gospodăria de la livadă' }),
  ).toBeVisible();

  await page.goto('/producer');
  await updated.getByRole('button', { name: 'Arhivează' }).click();
  await updated.getByRole('button', { name: 'Confirmă arhivarea' }).click();
  await expect(updated).toContainText('Arhivat');
  await page.goto(productPath);
  await expect(
    page.getByRole('heading', { name: 'Produs indisponibil' }),
  ).toBeVisible();
});

test('combined catalog filters agree with the API across pagination, refresh and reset', async ({
  page,
}) => {
  const query = 'category=legume&locality=Ialoveni&pageSize=1';
  const firstResponse = await page.request.get(
    `/api/v1/products?${query}&q=gr%C4%83din%C4%83`,
  );
  const first = await firstResponse.json();
  expect(first.total).toBeGreaterThan(0);

  await page.goto(`/?${query}`);
  await expect(page.locator('.product-card')).toHaveCount(1);
  const search = page.getByRole('textbox', { name: 'Caută produse' });
  await search.fill('grădină');
  await search.press('Enter');
  await expect(page).toHaveURL(
    /category=legume&locality=Ialoveni&pageSize=1&q=/,
  );
  await expect(page.locator('.catalog-toolbar')).toContainText(
    `${first.total} produse`,
  );
  await expect(page.locator('.product-title')).toHaveText(first.items[0].title);

  const all = await (
    await page.request.get(`/api/v1/products?${query}`)
  ).json();
  expect(all.total).toBeGreaterThan(1);
  await page.goto(`/?${query}`);
  const last = await (
    await page.request.get(`/api/v1/products?${query}&page=${all.total}`)
  ).json();
  for (let current = 1; current < all.total; current++) {
    await page.getByRole('button', { name: 'Înainte', exact: true }).click();
    await expect(page.locator('.pagination')).toContainText(
      `Pagina ${current + 1} din ${all.total}`,
    );
  }
  await expect(
    page.getByRole('button', { name: 'Înainte', exact: true }),
  ).toBeDisabled();
  await expect(page.locator('.product-title')).toHaveText(last.items[0].title);
  await page.reload();
  await expect(page.locator('.product-title')).toHaveText(last.items[0].title);
  await expect(page.getByLabel('Filtrează după localitate')).toHaveValue(
    'Ialoveni',
  );

  await page.goto(`/?${query}&q=f%C4%83r%C4%83rezultate`);
  await expect(
    page.getByRole('heading', { name: 'Nu am găsit produse' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Resetează filtrele' }).click();
  await expect(page).toHaveURL('/');
  await expect(page.locator('.product-card').first()).toBeVisible();
});
