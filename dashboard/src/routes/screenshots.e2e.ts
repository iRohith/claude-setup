// Proof screenshots of the real dashboard: every page, at every size, named <id>-<page>-<size>.png.
// Run: SCREENSHOTS=1 ITEM=<todo id> pnpm test
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as wf from 'wf';

const images = fileURLToPath(new URL('../../../scratch/images/', import.meta.url));
/** Throwaway projects live here; only they are ever changed by a screenshot run. */
const throwaway = fileURLToPath(new URL('../../../scratch/temp/', import.meta.url));

async function save(page: Page, info: TestInfo, name: string, fullPage = true): Promise<void> {
	await page.screenshot({
		path: `${images}${process.env.ITEM}-${name}-${info.project.name}.png`,
		fullPage
	});
}

/**
 * Puts a throwaway project's learnings back. afterEach runs even when a test times out, which a
 * finally block inside the test does not.
 */
let restore: (() => void) | undefined;
test.afterEach(() => {
	restore?.();
	restore = undefined;
});

test.beforeEach(() => {
	if (!process.env.ITEM)
		throw new Error('set ITEM=<todo id> so the screenshots name the item they prove');
});

test('real dashboard pages', async ({ page }, info) => {
	const home = await page.goto('/');
	expect(home?.ok()).toBe(true);
	const base = page.url();
	await save(page, info, 'projects');
	if (info.project.name === 'mobile') {
		await page.waitForLoadState('networkidle');
		await page.getByRole('button', { name: 'Toggle Sidebar' }).click();
		await expect(page.getByRole('navigation', { name: 'Projects' })).toBeVisible();
		// The sheet slides in; shoot it once it has settled, as the owner sees it on the phone.
		await page.waitForFunction(() =>
			document.getAnimations().every((a) => a.playState !== 'running')
		);
		await save(page, info, 'sidebar', false);
		await page.keyboard.press('Escape');
	}
	const links = page.getByRole('main').getByRole('listitem').getByRole('link');
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
		const views = page.getByRole('navigation', { name: 'Views' });
		await views.getByRole('link', { name: 'memory' }).click();
		await expect(page.getByRole('heading', { name: 'Memory', level: 1 })).toBeVisible();
		await save(page, info, `project-${name}-memory`);
		await views.getByRole('link', { name: 'learnings' }).click();
		await expect(page.getByRole('progressbar', { name: 'Session context used' })).toBeVisible();
		await save(page, info, `project-${name}-learnings`);
	}
	expect((await page.goto(new URL('global', base).href))?.ok()).toBe(true);
	await save(page, info, 'global');
});

test('learnings added, edited, removed and refused over budget, on a throwaway project', async ({
	page
}, info) => {
	const root = Object.keys(wf.readRegistry()).find((r) => `${r}/`.startsWith(throwaway));
	if (!root) throw new Error(`register a throwaway project under ${throwaway} with wf init first`);
	const name = root.split('/').at(-1);
	const file = join(root, 'docs', 'state', 'learnings.md');
	const original = readFileSync(file, 'utf8');
	const count = wf.readLearnings(root, false).length;
	restore = () => {
		while (wf.readLearnings(root, false).length > count)
			wf.removeLearning(root, wf.readLearnings(root, false).length, false);
		expect(readFileSync(file, 'utf8')).toBe(original);
	};
	// Filling to the budget takes a while on the phone emulation.
	test.setTimeout(120_000);
	await page.goto(`/projects${root}?view=learnings`);
	await page.waitForLoadState('networkidle');
	const list = page.getByRole('main').getByRole('list');

	await page
		.getByLabel('New learning')
		.fill('screenshot run added this → it is removed right after');
	await page.getByRole('button', { name: 'Add learning' }).click();
	await expect(list).toContainText('screenshot run added this');
	await save(page, info, `project-${name}-learning-added`);

	const n = count + 1;
	await page.getByRole('button', { name: `Edit learning ${n}` }).click();
	await page
		.getByLabel(`Learning ${n}`)
		.fill('screenshot run edited this → it is removed right after');
	await save(page, info, `project-${name}-learning-editing`);
	await page.getByRole('button', { name: 'Save' }).click();
	await expect(list).toContainText('screenshot run edited this');
	await page.getByRole('button', { name: `Edit learning ${n}` }).click();
	await page.getByRole('button', { name: 'Remove' }).click();
	await expect(page.getByText('screenshot run edited this')).toHaveCount(0);
	await save(page, info, `project-${name}-learning-removed`);

	// Fill to the budget through the core; one more from the dashboard is refused.
	// Each filler is under the 200-character cap, so only the budget can stop the loop.
	const filler = (i: number) => `budget filler ${i} ${'z'.repeat(150)} → removed right after`;
	for (let i = 0; ; i++) {
		try {
			wf.addLearning(root, filler(i), false);
		} catch (e) {
			if (e instanceof Error && e.message.includes('budget')) break;
			throw e;
		}
	}
	await page.reload();
	await page.waitForLoadState('networkidle');
	await page.getByLabel('New learning').fill(filler(999));
	await page.getByRole('button', { name: 'Add learning' }).click();
	await expect(page.getByRole('alert')).toContainText('over the 4000 budget');
	await page.getByRole('alert').scrollIntoViewIfNeeded();
	await save(page, info, `project-${name}-learning-over-budget`, false);
});

test('a section edited on a throwaway project, and a malformed edit refused on this repo', async ({
	page
}, info) => {
	// The refusal runs on this repo's real steers: the core writes nothing, which the hash shows.
	const repo = fileURLToPath(new URL('../../../', import.meta.url)).replace(/\/$/, '');
	const steers = join(repo, 'docs', 'state', 'steers.md');
	const steersBefore = readFileSync(steers, 'utf8');
	await page.goto(`/projects${repo}?view=steers`);
	await page.waitForLoadState('networkidle');
	await page.getByRole('button', { name: 'Edit section 1', exact: true }).click();
	const editor = page.getByLabel('Markdown of section 1', { exact: true });
	await editor.fill((await editor.inputValue()).replace(/^Why: .*\n?/m, ''));
	await page.getByRole('button', { name: 'Save' }).click();
	await expect(page.getByRole('alert')).toContainText('steers.md: malformed entry');
	await save(page, info, 'project-claude-setup-section-refused', false);
	expect(readFileSync(steers, 'utf8')).toBe(steersBefore);

	// The edit runs on the throwaway project, and afterEach puts the section back.
	const root = Object.keys(wf.readRegistry()).find((r) => `${r}/`.startsWith(throwaway));
	if (!root) throw new Error(`register a throwaway project under ${throwaway} with wf init first`);
	const name = root.split('/').at(-1);
	const file = join(root, 'docs', 'state', 'memory.md');
	const original = readFileSync(file, 'utf8');
	const invariants = wf.readSections(root, 'memory.md').sections[0].text;
	restore = () => {
		wf.writeSection(root, 'memory.md', 0, invariants);
		expect(readFileSync(file, 'utf8')).toBe(original);
	};
	await page.goto(`/projects${root}?view=memory`);
	await page.waitForLoadState('networkidle');
	await page.getByRole('button', { name: 'Edit section 1', exact: true }).click();
	await page
		.getByLabel('Markdown of section 1', { exact: true })
		.fill('## Invariants\n\n1. The screenshot run wrote this; it is put back right after.');
	await page.getByRole('button', { name: 'Save' }).click();
	const section = page.getByRole('region', { name: 'Invariants' });
	await expect(section).toContainText('The screenshot run wrote this');
	await save(page, info, `project-${name}-section-edited`);
	// Only that section changed: everything after it is as it was.
	const after = readFileSync(file, 'utf8');
	const rest = (text: string) => text.slice(text.indexOf('## Contracts'));
	expect(rest(after)).toBe(rest(original));
});
