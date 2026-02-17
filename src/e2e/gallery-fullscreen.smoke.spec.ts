import { test } from '@playwright/test';
import {
  assertFullscreenSingleFire,
  assertMenuSingleFire,
  assertSearchSingleFire,
  assertThemeSingleFire,
  replayAstroPageLoad,
} from './helpers';

test('gallery controls remain deterministic across lifecycle replays', async ({ page }) => {
  await page.goto('/gallery', { waitUntil: 'networkidle' });
  await replayAstroPageLoad(page, 5);

  await assertMenuSingleFire(page);
  await assertSearchSingleFire(page);
  await assertThemeSingleFire(page);
  await assertFullscreenSingleFire(page);
});
