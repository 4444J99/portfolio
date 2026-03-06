import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const __dirname = dirname(fileURLToPath(import.meta.url));
const targets = JSON.parse(readFileSync(resolve(__dirname, '../data/targets.json'), 'utf-8')) as {
	targets: { slug: string }[];
};
const personas = JSON.parse(readFileSync(resolve(__dirname, '../data/personas.json'), 'utf-8')) as {
	personas: { slug: string }[];
};

const firstTargetSlug = targets.targets[0]?.slug ?? 'anthropic';
const firstPersonaSlug = personas.personas[0]?.slug ?? 'ai-systems-engineer';

test('strike target page loads and has intro content', async ({ page }) => {
	await page.goto(`for/${firstTargetSlug}/`, { waitUntil: 'networkidle' });

	await expect(page).toHaveTitle(/.+/);
	const intro = page.locator('.target-intro');
	await expect(intro).toBeVisible({ timeout: 5000 });
});

test('resume persona page loads and has heading', async ({ page }) => {
	await page.goto(`resume/${firstPersonaSlug}/`, { waitUntil: 'networkidle' });

	await expect(page).toHaveTitle(/Resume|Anthony/);
	const main = page.locator('main');
	await expect(main).toBeVisible();
});
