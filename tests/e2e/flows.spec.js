import { test, expect, noHorizontalScroll } from './helpers.js';

const cards = (page) => page.getByTestId('recipe-card');

test('home lists recipes without horizontal scroll', async ({ page }) => {
  await page.goto('/');
  await expect(cards(page)).toHaveCount(15);
  await expect(page.getByTestId('recipe-count')).toContainText('۱۵');
  await noHorizontalScroll(page);
});

test('search narrows results and can be cleared', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('searchbox', { name: /جست‌وجوی غذا/ }).fill('عدس');
  await expect(cards(page)).toHaveCount(1);
  await expect(cards(page).first()).toContainText('سوپ عدس');
  await page.getByRole('button', { name: 'پاک کردن جست‌وجو' }).click();
  await expect(cards(page)).toHaveCount(15);
  await page.getByRole('searchbox').fill('چیزی که نیست');
  await expect(page.getByText('غذایی پیدا نشد')).toBeVisible();
  await page.getByRole('button', { name: 'پاک کردن فیلترها' }).click();
  await expect(cards(page)).toHaveCount(15);
});

test('filter sheet applies, counts and resets', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'فیلتر' }).click();
  const dialog = page.getByRole('dialog', { name: 'فیلتر غذاها' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'تا ۱۵ دقیقه' }).click();
  await dialog.getByRole('button', { name: 'فقط با وسایل خودم' }).click();
  const show = dialog.getByRole('button', { name: /نمایش .* غذا/ });
  await expect(show).not.toContainText('۱۵ غذا');
  await show.click();
  await expect(dialog).toBeHidden();
  const n = await cards(page).count();
  expect(n).toBeGreaterThan(0);
  expect(n).toBeLessThan(15);
  await expect(page.locator('.filter-btn .count')).toHaveText('۲');
  // Escape closes, reset clears
  await page.getByRole('button', { name: 'فیلتر' }).click();
  await page.getByRole('button', { name: 'پاک کردن', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(cards(page)).toHaveCount(15);
});

test('favorites persist across reload', async ({ page }) => {
  await page.goto('/');
  const first = cards(page).first();
  const title = await first.locator('.rcard-title').innerText();
  await first.getByRole('button', { name: /افزودن .* به علاقه‌مندی‌ها/ }).click();
  await page.reload();
  await page.getByRole('link', { name: 'علاقه‌مندی' }).click();
  await expect(cards(page)).toHaveCount(1);
  await expect(cards(page).first()).toContainText(title);
  await cards(page).first().getByRole('button', { name: /حذف .* از علاقه‌مندی‌ها/ }).click();
  await expect(page.getByText('هنوز چیزی ذخیره نکردی')).toBeVisible();
});

test('pantry toggles change what recipes need', async ({ page }) => {
  await page.goto('/#/recipe/rcp-omelet');
  const buy = page.getByTestId('cost-buy');
  const before = await buy.innerText();
  await page.goto('/#/pantry');
  await page.getByRole('switch', { name: 'تخم‌مرغ', exact: true }).click();
  await page.getByRole('switch', { name: 'گوجه‌فرنگی', exact: true }).click();
  await page.goto('/#/recipe/rcp-omelet');
  await expect(page.getByTestId('cost-buy')).not.toHaveText(before);
  await page.goto('/#/pantry');
  await page.getByRole('switch', { name: 'تخم‌مرغ', exact: true }).click(); // un-toggle
  await expect(page.getByRole('switch', { name: 'تخم‌مرغ', exact: true })).toHaveAttribute('aria-checked', 'false');
});

test('recipe page: servings scale amounts and costs; marking have/need updates buy cost', async ({ page }) => {
  await page.goto('/#/recipe/rcp-omelet');
  await expect(page.getByTestId('servings-value')).toHaveText('۲ نفر');
  const eggRow = page.getByTestId('ingredient-row').filter({ hasText: 'تخم‌مرغ' });
  await expect(eggRow).toContainText('۴ عدد');
  const usedBefore = await page.getByTestId('cost-used').innerText();
  await page.getByRole('button', { name: 'زیاد کردن یک نفر' }).click();
  await expect(page.getByTestId('servings-value')).toHaveText('۳ نفر');
  await expect(eggRow).toContainText('۶ عدد');
  expect(await page.getByTestId('cost-used').innerText()).not.toBe(usedBefore);

  const buyBefore = await page.getByTestId('cost-buy').innerText();
  await eggRow.click();
  await expect(eggRow).toHaveAttribute('aria-checked', 'true');
  expect(await page.getByTestId('cost-buy').innerText()).not.toBe(buyBefore);
  await noHorizontalScroll(page);

  // servings are remembered per recipe
  await page.reload();
  await expect(page.getByTestId('servings-value')).toHaveText('۳ نفر');
});

test('guided cooking: steps, timer, restore after reload, finish', async ({ page }) => {
  await page.goto('/#/recipe/rcp-omelet');
  await page.getByTestId('start-cooking').click();
  await expect(page).toHaveURL(/#\/cook$/);
  await expect(page.getByTestId('step-counter')).toHaveText('۱ از ۵');
  await page.getByTestId('next-step').click();
  await expect(page.getByTestId('step-counter')).toHaveText('۲ از ۵');
  await page.getByTestId('timer-start').click();
  await expect(page.getByTestId('timer')).toContainText('۰۳:');

  // restore: reload keeps the step and a still-running timer
  await page.reload();
  await expect(page.getByTestId('step-counter')).toHaveText('۲ از ۵');
  await expect(page.getByTestId('timer')).toContainText('تایمر در حال شمارشه');

  // dots jump, prev disabled on first step
  await page.getByRole('button', { name: 'رفتن به مرحله‌ی ۱' }).click();
  await expect(page.getByRole('button', { name: 'قبلی' })).toBeDisabled();
  await page.getByRole('button', { name: 'رفتن به مرحله‌ی ۵' }).click();
  await expect(page.getByTestId('finish')).toBeVisible();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  await page.getByTestId('finish').click();
  await expect(page.getByText('نوش جان!')).toBeVisible();
  await page.getByRole('button', { name: 'برگشت به غذاها' }).click();
  await expect(cards(page)).toHaveCount(15);

  // session is gone
  await page.getByRole('link', { name: 'آشپزی' }).click();
  await expect(page.getByText('الان چیزی نمی‌پزی')).toBeVisible();
});

test('expired timer shows done state after reload', async ({ page }) => {
  await page.clock.install();
  await page.goto('/#/recipe/rcp-omelet');
  await page.getByTestId('start-cooking').click();
  await page.getByTestId('next-step').click();
  await page.getByTestId('timer-start').click();
  await expect(page.getByTestId('timer')).toContainText('تایمر در حال شمارشه');
  await page.clock.fastForward('05:00'); // the 4-minute timer is over
  await expect(page.getByTestId('timer')).toContainText('تایمر تموم شد');
  await page.reload();
  await expect(page.getByTestId('timer')).toContainText('تایمر تموم شد');
});

test('abandon cooking returns home and clears the resume banner', async ({ page }) => {
  await page.goto('/#/recipe/rcp-pasta');
  await page.getByTestId('start-cooking').click();
  await page.getByRole('button', { name: 'رها کردن' }).click();
  await expect(cards(page).first()).toBeVisible();
  await expect(page.locator('.resume')).toHaveCount(0);
});

test('resume banner appears on home while cooking', async ({ page }) => {
  await page.goto('/#/recipe/rcp-pasta');
  await page.getByTestId('start-cooking').click();
  await page.goto('/#/');
  await expect(page.locator('.resume')).toContainText('ماکارونی با سس گوجه');
  await page.locator('.resume').getByRole('link', { name: 'ادامه' }).click();
  await expect(page.getByTestId('step-counter')).toHaveText('۱ از ۵');
});
