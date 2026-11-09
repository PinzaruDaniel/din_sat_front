import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';

for (const width of [360, 1280]) {
  test(`registration and login with the API at ${width}px`, async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width, height: 850 });
    const email = `auth-${randomUUID()}@dinsat.test`;
    const password = 'a-long-e2e-test-password';
    const fillCredentials = async () => {
      await page.getByLabel('Adresa de email').fill(email);
      await page.getByLabel('Parola', { exact: true }).fill(password);
    };
    await page.goto('/register?redirect=%2Forders');
    await page.getByLabel('Numele tău').fill('Cumpărător E2E');
    await fillCredentials();
    await page.getByRole('button', { name: 'Creează contul' }).click();
    await expect(page).toHaveURL(/\/orders$/);
    const me = await page.request.get('/api/v1/auth/me');
    expect(me.status()).toBe(200);
    expect((await me.json()).user).toMatchObject({ email, role: 'buyer' });
    await page.reload();
    await expect(
      page.getByRole('heading', { name: 'Comenzile tale.' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Deconectare' }).click();
    await expect
      .poll(async () => (await page.request.get('/api/v1/auth/me')).status())
      .toBe(401);
    await page.goto('/login?redirect=%2Forders');
    await fillCredentials();
    await page.getByRole('button', { name: 'Intră în cont' }).click();
    await expect(page).toHaveURL(/\/orders$/);
    await expect(
      page.getByRole('heading', { name: 'Comenzile tale.' }),
    ).toBeVisible();
    await context.clearCookies({ name: 'dinsat.sid' });
    await page.reload();
    await expect(page).toHaveURL(/\/login\?redirect=/);
    await expect(
      page.getByRole('heading', { name: 'Bine ai revenit.' }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
  });
}
