import { test as base, expect } from '@playwright/test';

// Every test fails on uncaught page errors or console errors.
export const test = base.extend({
  page: async ({ page }, use) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
    await use(page);
    expect(errors, 'no page errors').toEqual([]);
  },
});

export { expect };

export async function noHorizontalScroll(page) {
  const [sw, iw] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  expect(sw, 'horizontal scroll').toBeLessThanOrEqual(iw);
}
