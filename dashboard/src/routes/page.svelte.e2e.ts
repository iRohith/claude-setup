import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const images = fileURLToPath(new URL('../../../scratch/images/', import.meta.url));

// Screenshots are part of a UI item's proof: SCREENSHOTS=1 writes them, named <id>-<page>-<size>.png.
async function shot(page: Page, info: TestInfo, name: string): Promise<void> {
	if (process.env.SCREENSHOTS)
		await page.screenshot({
			path: `${images}1.5-${name}-${info.project.name}.png`,
			fullPage: true
		});
}

test('projects page lists the project with state, active and next', async ({ page }, info) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();
	const card = page.getByRole('listitem').filter({ hasText: 'notes' });
	await expect(card.getByRole('link', { name: 'notes' })).toBeVisible();
	await expect(card).toContainText('setup');
	await expect(card).toContainText('0.1 notes store');
	await expect(card).toContainText('0.2 notes page');
	await shot(page, info, 'projects');
});

test('todo page shows majors, minors, proofs and details', async ({ page }, info) => {
	await page.goto('/');
	await page.getByRole('link', { name: 'notes' }).click();
	await expect(page.getByRole('heading', { name: 'notes', level: 1 })).toBeVisible();
	await expect(page.getByText('Deliverable: a page that lists notes')).toBeVisible();
	await expect(page.getByText('Proof: a unit test saves and reloads two notes')).toBeVisible();
	await expect(page.getByText('notes kept in a JSON file')).toBeVisible();
	await expect(page.getByText('1 · Sharing')).toBeVisible();
	await shot(page, info, 'todo');
});

test('an unregistered path is a 404', async ({ page }) => {
	const response = await page.goto('/projects/etc');
	expect(response?.status()).toBe(404);
});
