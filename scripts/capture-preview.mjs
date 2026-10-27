import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
const output = process.env.PREVIEW_OUTPUT || '/tmp/dinsat-preview';
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
});
for (const [name, path, width, height] of [
  ['marketplace', '/', 1440, 1000],
  ['login', '/login', 1440, 1000],
  ['register', '/register', 1440, 1000],
  ['mobile', '/', 390, 844],
  ['mobile-login', '/login', 390, 844],
]) {
  await page.setViewportSize({ width, height });
  await page.goto(`http://localhost:5173${path}`);
  await page.locator('h1').waitFor();
  if (path === '/') await page.locator('.product-card').first().waitFor();
  await page.evaluate(() =>
    Promise.all(
      Array.from(document.images, (image) => image.decode().catch(() => {})),
    ),
  );
  await page.screenshot({ path: `${output}/${name}.png`, fullPage: true });
  console.log(
    name,
    await page.evaluate(() => ({
      width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      images: Array.from(document.images, (image) => ({
        alt: image.alt,
        loaded: image.complete && image.naturalWidth > 0,
      })),
    })),
  );
}
await browser.close();
