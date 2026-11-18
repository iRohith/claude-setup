// Proof screenshots of the real dashboard: every page, at every size, named <id>-<page>-<size>.png.
// Run: SCREENSHOTS=1 ITEM=<todo id> pnpm test
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const images = fileURLToPath(new URL('../../../scratch/images/', import.meta.url));

async function save(page: Page, info: TestInfo, name: string): Promise<void> {
	await page.screenshot({
		path: `${images}${process.env.ITEM}-${name}-${info.project.name}.png`,
		fullPage: true
	});
}

test('real dashboard pages', async ({ page }, info) => {
	if (!process.env.ITEM)
		throw new Error('set ITEM=<todo id> so the screenshots name the item they prove');
	const home = await page.goto('/');
	expect(home?.ok()).toBe(true);
	const base = page.url();
	await save(page, info, 'projects');
	const links = page.getByRole('listitem').getByRole('link');
	const targets = await Promise.all(
		(await links.all()).map(async (l) => ({
			name: (await l.textContent())?.trim() ?? '',
			href: (await l.getAttribute('href')) ?? ''
		}))
	);
	expect(targets.length).toBeGreaterThan(0);
	for (const { name, href } of targets) {
		const response = await page.goto(new URL(href, base).href);
		expect(response?.ok(), `${name} → ${href}`).toBe(true);
		await save(page, info, `project-${name}`);
		// A rejected edit, shown inline. The core refuses an empty major, so nothing real changes.
		await page.waitForLoadState('networkidle');
		await page.getByText('Add a major').click();
		await page.getByRole('button', { name: 'Add major' }).click();
		await expect(page.getByRole('alert')).toHaveText('title is required');
		await save(page, info, `project-${name}-rejected-edit`);
		await page
			.getByRole('navigation', { name: 'Views' })
			.getByRole('link', { name: 'memory' })
			.click();
		await expect(page.getByRole('heading', { name: 'Memory', level: 1 })).toBeVisible();
		await save(page, info, `project-${name}-memory`);
	}
	expect((await page.goto(new URL('global', base).href))?.ok()).toBe(true);
	await save(page, info, 'global');
});
