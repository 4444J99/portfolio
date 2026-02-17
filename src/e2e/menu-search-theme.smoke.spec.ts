import { test } from '@playwright/test';
import {
  assertMenuSingleFire,
  assertSearchSingleFire,
  assertThemeSingleFire,
  replayAstroPageLoad,
  TOP_LEVEL_ROUTES,
} from './helpers';

test('menu/search/theme controls stay single-fire across top-level routes', async ({ page }) => {
  for (const route of TOP_LEVEL_ROUTES) {
    await page.goto(route, { waitUntil: 'networkidle' });
    await replayAstroPageLoad(page, 4);
    await assertMenuSingleFire(page);
    await assertSearchSingleFire(page);
    await assertThemeSingleFire(page);
  }
});
