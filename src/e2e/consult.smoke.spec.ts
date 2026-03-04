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
  
  // Click submit
  await submitBtn.click();
  
  // Verify loading state triggers
  await expect(submitBtn).toHaveClass(/loading/);
  
  // It should eventually stop loading (either success or failure in CI environment)
  await expect(submitBtn).not.toHaveClass(/loading/, { timeout: 30000 });
});
