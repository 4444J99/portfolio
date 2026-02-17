import { expect, test } from '@playwright/test';
import { assertMenuSingleFire, replayAstroPageLoad, TRANSITION_STRESS_ROUTES } from './helpers';

test('repeated transition cycles preserve single active menu behavior', async ({ page }) => {
  for (let i = 0; i < 3; i += 1) {
    for (const route of TRANSITION_STRESS_ROUTES) {
      await page.goto(route, { waitUntil: 'networkidle' });
      await replayAstroPageLoad(page, 3);
      await assertMenuSingleFire(page);
    }
  }

  await page.goto('/', { waitUntil: 'networkidle' });
  await replayAstroPageLoad(page, 3);

  const openDropdownMenus = await page.locator('.header__dropdown-menu[data-open]').count();
  expect(openDropdownMenus).toBe(0);
});
