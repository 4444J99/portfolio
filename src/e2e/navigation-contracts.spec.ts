import { test, expect, type Page } from '@playwright/test';

async function replayAstroPageLoad(page: Page, cycles = 3) {
  await page.evaluate((count) => {
    for (let i = 0; i < count; i += 1) {
      document.dispatchEvent(new Event('astro:page-load'));
    }
  }, cycles);
}

async function assertMenuSingleFire(page: Page) {
  const toggle = page.locator('.header__toggle').first();
  if (await toggle.count() === 0 || !(await toggle.isVisible())) return;

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
}

async function assertSearchSingleFire(page: Page) {
  const trigger = page.locator('.search-trigger').first();
  const dialog = page.locator('.search-dialog').first();
  if (await trigger.count() === 0 || !(await trigger.isVisible()) || await dialog.count() === 0) return;

  await trigger.click();
  await expect(dialog).toBeVisible();

  const close = page.locator('.search-dialog__close').first();
  if (await close.count() > 0 && await close.isVisible()) {
    await close.click();
  } else {
    await page.keyboard.press('Escape');
  }
  await expect(dialog).not.toBeVisible();
}

async function assertThemeSingleFire(page: Page) {
  const toggle = page.locator('.theme-toggle').first();
  if (await toggle.count() === 0 || !(await toggle.isVisible())) return;

  const before = await page.evaluate(() => ({
    pref: localStorage.getItem('theme-preference'),
    theme: document.documentElement.dataset.theme ?? null,
  }));

  await toggle.click();
  await page.waitForTimeout(120);

  const after = await page.evaluate(() => ({
    pref: localStorage.getItem('theme-preference'),
    theme: document.documentElement.dataset.theme ?? null,
  }));

  expect(after.pref !== before.pref || after.theme !== before.theme).toBe(true);
}

async function assertFullscreenControl(page: Page) {
  const button = page.locator('.sketch-ctrl--fullscreen').first();
  if (await button.count() === 0 || !(await button.isVisible())) return;

  const fullscreenEnabled = await page.evaluate(() => document.fullscreenEnabled);
  if (!fullscreenEnabled) return;

  await button.click();
  await expect
    .poll(async () => page.evaluate(() => Boolean(document.fullscreenElement)), { timeout: 3000 })
    .toBe(true);

  await page.keyboard.press('Escape');
  await expect
    .poll(async () => page.evaluate(() => Boolean(document.fullscreenElement)), { timeout: 3000 })
    .toBe(false);
}

test('navigation controls stay single-fire across repeated lifecycle triggers', async ({ page }) => {
  const routes = ['/', '/about', '/dashboard', '/consult', '/omega'];

  for (const route of routes) {
    await page.goto(route, { waitUntil: 'networkidle' });
    await replayAstroPageLoad(page, 4);
    await assertMenuSingleFire(page);
    await assertSearchSingleFire(page);
    await assertThemeSingleFire(page);
  }

  await page.goto('/gallery', { waitUntil: 'networkidle' });
  await replayAstroPageLoad(page, 4);
  await assertMenuSingleFire(page);
  await assertSearchSingleFire(page);
  await assertThemeSingleFire(page);
  await assertFullscreenControl(page);
});
