// Behaviour checks against the fixture registry built by e2e.setup.ts.
import { expect, test } from '@playwright/test';

test('projects page lists the project with state, active and next', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();
	const card = page.getByRole('listitem').filter({ hasText: 'notes' });
	await expect(card.getByRole('link', { name: 'notes' })).toBeVisible();
	await expect(card).toContainText('setup');
	await expect(card).toContainText('0.1 notes store');
	await expect(card).toContainText('0.2 notes page');
});

test('todo page shows majors, minors, proofs and details', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('link', { name: 'notes' }).click();
	await expect(page.getByRole('heading', { name: 'notes', level: 1 })).toBeVisible();
	await expect(page.getByText('Deliverable: a page that lists notes')).toBeVisible();
	await expect(page.getByText('Proof: a unit test saves and reloads two notes')).toBeVisible();
	await expect(page.getByText('1 · Sharing')).toBeVisible();
});

test('code spans render as code, not backticks', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('link', { name: 'notes' }).click();
	await expect(page.locator('code', { hasText: 'notes.json' })).toBeVisible();
	await expect(page.getByText('`notes.json`')).toHaveCount(0);
});

test('details stay open for work in progress and fold for finished work', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('link', { name: 'notes' }).click();
	await expect(page.locator('code', { hasText: 'notes.json' })).toBeVisible();
	const done = page.getByRole('listitem').filter({ hasText: '0.3 setup' });
	await expect(done.getByText('scaffolded')).toBeHidden();
	// A click before hydration finishes gets reset when Svelte applies `open`.
	await page.waitForLoadState('networkidle');
	await done.getByText('1 implementation detail').click();
	await expect(done.getByText('scaffolded')).toBeVisible();
});

test('an unregistered path is a 404', async ({ page }) => {
	const response = await page.goto('/projects/etc');
	expect(response?.status()).toBe(404);
});
