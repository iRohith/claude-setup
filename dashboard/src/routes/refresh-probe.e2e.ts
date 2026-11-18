// The two-second refresh must never reset what the owner is typing: every kind of form field,
// left open across a refresh, keeps its text. (A refresh once reset fields fed from page data.)
import { expect, test, type Page } from '@playwright/test';

async function openView(page: Page, view: string) {
	await page.goto('/');
	await page.getByRole('main').getByRole('link', { name: 'notes' }).click();
	await page.getByRole('navigation', { name: 'Views' }).getByRole('link', { name: view }).click();
	await page.waitForLoadState('networkidle');
}

/** Long enough for at least one refresh to land. */
const pastARefresh = (page: Page) => page.waitForTimeout(2600);

test('a section editor keeps its text across a refresh', async ({ page }) => {
	await openView(page, 'memory');
	await page.getByRole('button', { name: 'Edit section 2' }).click();
	const editor = page.getByLabel('Markdown of section 2');
	await editor.fill('## Contracts\n\n- typed before a refresh');
	await pastARefresh(page);
	await expect(editor).toHaveValue('## Contracts\n\n- typed before a refresh');
});

test('todo add and edit fields keep their text across a refresh', async ({ page }) => {
	await openView(page, 'todo');
	await page.getByText('Add a major').click();
	await page.getByLabel('New major title').fill('typed before a refresh');
	await page.getByRole('button', { name: 'Edit 0.2' }).click();
	await page.getByLabel('Title of 0.2').fill('renamed before a refresh');
	await pastARefresh(page);
	await expect(page.getByLabel('New major title')).toHaveValue('typed before a refresh');
	await expect(page.getByLabel('Title of 0.2')).toHaveValue('renamed before a refresh');
});

test('learning fields keep their text across a refresh', async ({ page }) => {
	await openView(page, 'learnings');
	await page.getByLabel('New learning').fill('typed before → a refresh');
	await pastARefresh(page);
	await expect(page.getByLabel('New learning')).toHaveValue('typed before → a refresh');
});
