import { test, expect } from '@playwright/test';
import { assertMenuSingleFire, assertSearchSingleFire, assertThemeSingleFire } from './helpers';

test('consult page form and global controls handle navigation', async ({ page }) => {
  // Navigate to consult page (from root to test view transitions)
  await page.goto('/portfolio/', { waitUntil: 'networkidle' });
  await page.goto('/portfolio/consult/', { waitUntil: 'networkidle' });
  
  const challenge = page.locator('#challenge');
  await expect(challenge).toBeVisible();
  
  // Verify global controls still work after view transition
  await assertMenuSingleFire(page);
  await assertSearchSingleFire(page);
  await assertThemeSingleFire(page);
  
  // Fill the form
  await challenge.fill('I want to build a generative art system for my community center.');
  
  const submitBtn = page.locator('#submit-btn');
  await expect(submitBtn).toBeEnabled();
  
  // Click submit and wait for either result area or error area.
  await submitBtn.click();

  const responseArea = page.locator('#response-area');
  const errorArea = page.locator('#error-area');
  await expect.poll(async () => {
    const responseHidden = await responseArea.evaluate((el) => (el as HTMLDivElement).hidden);
    const errorHidden = await errorArea.evaluate((el) => (el as HTMLDivElement).hidden);
    return !responseHidden || !errorHidden;
  }, { timeout: 30000 }).toBeTruthy();

  // Submit button should always recover from loading state.
  await expect(submitBtn).not.toHaveClass(/loading/);
  await expect(submitBtn).toBeEnabled();
});
