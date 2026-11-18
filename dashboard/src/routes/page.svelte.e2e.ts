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

test('the owner turns admin mode on and off from the project page', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('link', { name: 'notes' }).click();
	await page.waitForLoadState('networkidle');
	await page.getByRole('button', { name: 'Turn admin mode on' }).click();
	await expect(page.getByText('Admin mode is on.')).toBeVisible();
	await page.reload();
	await expect(page.getByText('Admin mode is on.')).toBeVisible();
	await page.getByRole('button', { name: 'Turn off' }).click();
	await expect(page.getByRole('button', { name: 'Turn admin mode on' })).toBeVisible();
});

test('the owner adds, edits, checks and reopens items, with rule errors inline', async ({
	page
}, info) => {
	const title = `Edits on ${info.project.name}`;
	await page.goto('/');
	await page.getByRole('link', { name: 'notes' }).click();
	await page.waitForLoadState('networkidle');

	await page.getByText('Add a major').click();
	await page.getByLabel('New major title').fill(title);
	await page.getByLabel('New major deliverable').fill('a page the owner can edit');
	await page.getByRole('button', { name: 'Add major' }).click();
	const major = page.locator('main > details').filter({ hasText: title });
	await expect(major).toBeVisible();
	const id = (await major.locator('summary').first().textContent())?.match(/(\d+) ·/)?.[1];
	expect(id).toBeTruthy();

	await major.getByText(`Add a minor to ${id}`).click();
	await major.getByLabel(`New minor title for ${id}`).fill('first edit');
	await major.getByRole('button', { name: 'Add minor' }).click();
	await expect(major.getByRole('alert')).toHaveText('proof is required');
	await major.getByLabel(`New minor title for ${id}`).fill('first edit');
	await major.getByLabel(`New minor proof for ${id}`).fill('a screenshot shows it');
	await major.getByRole('button', { name: 'Add minor' }).click();
	const minor = major.getByRole('listitem').filter({ hasText: `${id}.1 first edit` });
	await expect(minor).toContainText('open');

	await minor.getByRole('button', { name: `Start ${id}.1` }).click();
	await expect(minor).toContainText('in progress');
	await minor.getByRole('button', { name: `Check ${id}.1` }).click();
	await expect(minor).toContainText('done');
	await minor.getByRole('button', { name: `Reopen ${id}.1` }).click();
	await expect(minor.getByRole('button', { name: `Start ${id}.1` })).toBeVisible();

	await minor.getByText('Edit', { exact: true }).click();
	await minor.getByLabel(`Title of ${id}.1`).fill('renamed edit');
	await minor.getByRole('button', { name: 'Save' }).click();
	await expect(
		major.getByRole('listitem').filter({ hasText: `${id}.1 renamed edit` })
	).toBeVisible();
});

test('an unregistered path is a 404', async ({ page }) => {
	const response = await page.goto('/projects/etc');
	expect(response?.status()).toBe(404);
});
