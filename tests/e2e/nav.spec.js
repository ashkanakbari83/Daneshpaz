import { test, expect, noHorizontalScroll } from './helpers.js';

const TABS = [
  ['غذاها', /\/#?\/?$/, 'امشب چی بپزیم؟'],
  ['مواد من', /#\/pantry$/, 'مواد و وسایل من'],
  ['آشپزی', /#\/cook$/, 'الان چیزی نمی‌پزی'],
  ['علاقه‌مندی', /#\/favorites$/, 'علاقه‌مندی‌ها'],
];

test('bottom nav reaches every tab and marks the current one', async ({ page }) => {
  await page.goto('/');
  for (const [label, url, heading] of TABS) {
    const link = page.getByRole('navigation', { name: 'منوی اصلی' }).getByRole('link', { name: label });
    await link.click();
    await expect(page).toHaveURL(url);
    await expect(page.getByText(heading).first()).toBeVisible();
    await expect(link).toHaveAttribute('aria-current', 'page');
    await noHorizontalScroll(page);
  }
});

test('every recipe page opens without errors and has a cooking CTA', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('recipe-card')).toHaveCount(15);
  const hrefs = await page.getByTestId('recipe-card').locator('a.rcard-main').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  expect(hrefs).toHaveLength(15);
  for (const href of hrefs) {
    await page.goto(`/${href}`);
    await expect(page.getByTestId('start-cooking')).toBeVisible();
    await expect(page.getByTestId('cost-used')).toBeVisible();
    await noHorizontalScroll(page);
  }
});

test('back button on a recipe returns to the list; unknown routes are handled', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('recipe-card').first().locator('a.rcard-main').click();
  await expect(page.getByTestId('start-cooking')).toBeVisible();
  await page.getByRole('button', { name: 'بازگشت' }).click();
  await expect(page.getByTestId('recipe-card').first()).toBeVisible();

  await page.goto('/#/nothing-here');
  await expect(page.getByText('این صفحه پیدا نشد')).toBeVisible();
  await page.goto('/#/recipe/does-not-exist');
  await expect(page.getByText('این غذا پیدا نشد')).toBeVisible();
});

test('keyboard: filter sheet traps Escape and restores focus', async ({ page }) => {
  await page.goto('/');
  const btn = page.getByRole('button', { name: 'فیلتر' });
  await btn.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(btn).toBeFocused();
});

test('old saved state (no seed items yet) is upgraded without losing user data', async ({ page }) => {
  // Seed an "old" save once, before the app boots (sessionStorage survives reloads in this tab).
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem('daneshpaz:state', JSON.stringify({
      version: 1, seedRelease: 0, recipes: {}, ingredients: {}, equipment: {},
      user: { favorites: ['rcp-omelet'], pantry: ['ing-egg'], equipment: ['eq-oven'] },
    }));
  });
  await page.goto('/');
  await expect(page.getByTestId('recipe-card')).toHaveCount(15);
  await page.getByRole('link', { name: 'علاقه‌مندی' }).click();
  await expect(page.getByTestId('recipe-card')).toHaveCount(1);
  await page.getByRole('link', { name: 'مواد من' }).click();
  await expect(page.getByRole('switch', { name: 'تخم‌مرغ', exact: true })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('switch', { name: 'فر', exact: true })).toHaveAttribute('aria-checked', 'true');
  await page.reload();
  await expect(page.getByRole('switch', { name: 'تخم‌مرغ', exact: true })).toHaveAttribute('aria-checked', 'true');
});
