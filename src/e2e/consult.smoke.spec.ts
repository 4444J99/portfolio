import { test, expect } from '@playwright/test';

test('consult page form handles submission and loading state', async ({ page }) => {
  // Navigate to consult page (from root to test view transitions)
  await page.goto('/portfolio/');
  await page.goto('/portfolio/consult/');
  
  const challenge = page.locator('#challenge');
  await expect(challenge).toBeVisible();
  
  // Fill the form
  await challenge.fill('I want to build a generative art system for my community center.');
  
  const submitBtn = page.locator('#submit-btn');
  await expect(submitBtn).toBeEnabled();
  
  // Click submit
  await submitBtn.click();
  
  // Verify loading state triggers
  await expect(submitBtn).toHaveClass(/loading/);
  
  // It should eventually stop loading (either success or failure)
  await expect(submitBtn).not.toHaveClass(/loading/, { timeout: 30000 });
});
