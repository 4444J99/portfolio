import { test } from '@playwright/test';
import { assertMenuSingleFire, assertSearchSingleFire, assertThemeSingleFire, replayAstroPageLoad } from './helpers';

test('menu/search/theme controls stay single-fire across top-level routes', async ({ page }) => {
  const routes = ['/', '/about', '/dashboard', '/consult', '/omega', '/architecture'];

  for (const route of routes) {
    await page.goto(route, { waitUntil: 'networkidle' });
    await replayAstroPageLoad(page, 4);
    await assertMenuSingleFire(page);
    await assertSearchSingleFire(page);
    await assertThemeSingleFire(page);
  }
});
