// Behaviour checks against the fixture registry built by e2e.setup.ts.
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const e2e = fileURLToPath(new URL('../../../scratch/temp/e2e/', import.meta.url));
const cli = fileURLToPath(new URL('../../../wf/cli.ts', import.meta.url));

/** The real wf CLI, run in the fixture project as a terminal would: no Claude Code session. */
const terminal = Object.fromEntries(
	Object.entries(process.env).filter(([k]) => k !== 'CLAUDECODE' && k !== 'CLAUDE_CODE_SESSION_ID')
);
const wf = (...args: string[]) =>
	execFileSync(process.execPath, [cli, ...args], {
		cwd: `${e2e}notes`,
		env: { ...terminal, WF_HOME: `${e2e}home` }
	});

/** On mobile the projects sidebar is a sheet behind the trigger. */
async function sidebar(page: Page, info: TestInfo) {
	if (info.project.name === 'mobile') {
		await page.waitForLoadState('networkidle');
		await page.getByRole('button', { name: 'Toggle Sidebar' }).click();
	}
	return page.getByRole('navigation', { name: 'Projects' });
}

async function openNotes(page: Page) {
	await page.goto('/');
	await page.getByRole('main').getByRole('link', { name: 'notes' }).click();
	await expect(page.getByRole('heading', { name: 'notes', level: 1 })).toBeVisible();
	// A click before hydration finishes gets reset when Svelte applies state.
	await page.waitForLoadState('networkidle');
}

test('projects page lists the project with state, active and next', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { name: 'Projects', level: 1 })).toBeVisible();
	const row = page.getByRole('main').getByRole('listitem').filter({ hasText: 'notes' });
	await expect(row.getByRole('link', { name: 'notes' })).toBeVisible();
	await expect(row).toContainText('setup');
	await expect(row).toContainText('0.1 notes store');
	await expect(row).toContainText('0.2 notes page');
	await expect(row.getByRole('img', { name: '1 of 3 done, 1 in progress' })).toBeVisible();
});

test('todo page shows majors, minors, proofs and details', async ({ page }) => {
	await openNotes(page);
	await expect(page.getByText('Deliverable: a page that lists notes')).toBeVisible();
	await expect(page.getByText('Proof: a unit test saves and reloads two notes')).toBeVisible();
	await expect(page.getByRole('heading', { name: '1 Sharing', level: 2 })).toBeVisible();
	await expect(
		page.getByRole('region', { name: 'Crude end to end' }).getByRole('img')
	).toHaveAccessibleName('1 of 3 done, 1 in progress');
});

test('code spans render as code, not backticks', async ({ page }) => {
	await openNotes(page);
	await expect(page.locator('code', { hasText: 'notes.json' })).toBeVisible();
	await expect(page.getByText('`notes.json`')).toHaveCount(0);
});

test('details stay open for work in progress and fold for finished work', async ({ page }) => {
	await openNotes(page);
	await expect(page.locator('code', { hasText: 'notes.json' })).toBeVisible();
	const done = page.getByRole('main').getByRole('listitem').filter({ hasText: '0.3 setup' });
	await expect(done.getByText('scaffolded')).toBeHidden();
	await done.getByText('1 implementation detail').click();
	await expect(done.getByText('scaffolded')).toBeVisible();
});

test('the owner turns admin mode on and off from the project page', async ({ page }) => {
	await openNotes(page);
	await page.getByRole('button', { name: 'Turn admin mode on' }).click();
	await expect(page.getByText('Admin mode is on.')).toBeVisible();
	await page.reload();
	await expect(page.getByText('Admin mode is on.')).toBeVisible();
	await page.waitForLoadState('networkidle');
	await page.getByRole('button', { name: 'Turn off' }).click();
	await expect(page.getByRole('button', { name: 'Turn admin mode on' })).toBeVisible();
});

test('the owner adds, edits, checks and reopens items, with rule errors inline', async ({
	page
}, info) => {
	const title = `Edits on ${info.project.name}`;
	await openNotes(page);

	await page.getByText('Add a major').click();
	await page.getByLabel('New major title').fill(title);
	await page.getByLabel('New major deliverable').fill('a page the owner can edit');
	await page.getByRole('button', { name: 'Add major' }).click();
	const major = page.getByRole('region', { name: title });
	await expect(major).toBeVisible();
	const heading = await major.getByRole('heading', { level: 2 }).textContent();
	const id = heading?.trim().match(/^(\d+)/)?.[1];
	expect(id).toBeTruthy();

	await major.getByText(`Add a minor to ${id}`).click();
	await major.getByLabel(`New minor title for ${id}`).fill('first edit');
	await major.getByRole('button', { name: 'Add minor' }).click();
	await expect(major.getByRole('alert')).toHaveText('proof is required');
	await major.getByLabel(`New minor title for ${id}`).fill('first edit');
	await major.getByLabel(`New minor proof for ${id}`).fill('a screenshot shows it');
	await major.getByRole('button', { name: 'Add minor' }).click();
	const minor = major.getByRole('listitem').filter({ hasText: `${id}.1 first edit` });
	const checkbox = minor.getByRole('checkbox', { name: `Done ${id}.1` });
	await expect(checkbox).not.toBeChecked();

	await minor.getByRole('button', { name: `Start ${id}.1` }).click();
	await expect(minor).toContainText('in progress');
	await checkbox.click();
	await expect(checkbox).toBeChecked();
	await expect(major.getByRole('button', { name: `Mark done ${id}` })).toBeVisible();
	await checkbox.click();
	await expect(checkbox).not.toBeChecked();
	await expect(minor.getByRole('button', { name: `Start ${id}.1` })).toBeVisible();

	await minor.getByRole('button', { name: `Edit ${id}.1` }).click();
	await minor.getByLabel(`Title of ${id}.1`).fill('renamed edit');
	await minor.getByRole('button', { name: 'Save' }).click();
	await expect(
		major.getByRole('listitem').filter({ hasText: `${id}.1 renamed edit` })
	).toBeVisible();
	await expect(major.getByLabel(`Title of ${id}.1`)).toBeHidden();
});

test('the sidebar leads to every project and to Global', async ({ page }, info) => {
	await page.goto('/');
	let nav = await sidebar(page, info);
	await expect(nav.getByRole('link', { name: 'All projects' })).toBeVisible();
	await nav.getByRole('link', { name: 'notes' }).click();
	await expect(page.getByRole('heading', { name: 'notes', level: 1 })).toBeVisible();
	nav = await sidebar(page, info);
	await nav.getByRole('link', { name: 'Global' }).click();
	await expect(page.getByRole('heading', { name: 'Global', level: 1 })).toBeVisible();
});

test('each view shows its state file, and docs switch between documents', async ({ page }) => {
	await openNotes(page);
	const views = page.getByRole('navigation', { name: 'Views' });
	await views.getByRole('link', { name: 'memory' }).click();
	await expect(page.getByRole('heading', { name: 'Invariants' })).toBeVisible();
	await views.getByRole('link', { name: 'steers' }).click();
	await expect(page.getByRole('heading', { name: 'Steers', level: 1 })).toBeVisible();
	await views.getByRole('link', { name: 'docs' }).click();
	await expect(page.getByRole('heading', { name: 'Overview', level: 1 })).toBeVisible();
	await page.getByRole('link', { name: 'spec', exact: true }).click();
	await expect(page.getByRole('heading', { name: 'Spec', level: 1 })).toBeVisible();
	await views.getByRole('link', { name: 'todo' }).click();
	await expect(page.getByText('Deliverable: a page that lists notes')).toBeVisible();
});

async function switchState(page: Page, state: string) {
	await openNotes(page);
	await page.getByRole('combobox', { name: 'State' }).click();
	await page.getByRole('option', { name: state }).click();
	await Promise.all([
		page.waitForResponse((r) => r.url().includes('/state')),
		page.getByRole('button', { name: 'Switch' }).click()
	]);
	await page.goto('/');
	const row = page.getByRole('main').getByRole('listitem').filter({ hasText: 'notes' });
	await expect(row).toContainText(state);
}

test('the owner switches the project state', async ({ page }) => {
	await switchState(page, 'discuss');
	await switchState(page, 'setup');
});

test('the owner adds, edits and removes project learnings, with rule errors inline', async ({
	page
}, info) => {
	await openNotes(page);
	await page
		.getByRole('navigation', { name: 'Views' })
		.getByRole('link', { name: 'learnings' })
		.click();
	await expect(page.getByText('No learnings yet')).toBeVisible();
	await expect(page.getByRole('progressbar', { name: 'Session context used' })).toBeVisible();
	await page.waitForLoadState('networkidle');

	await page.getByLabel('New learning').fill('no arrow here');
	await expect(page.getByText('needs the → arrow')).toBeVisible();
	await page.getByRole('button', { name: 'Add learning' }).click();
	await expect(page.getByRole('alert')).toHaveText(
		'a learning reads "what went wrong → what to do instead"'
	);

	const lesson = `pushed first on ${info.project.name} → state first, then commit`;
	await page.getByLabel('New learning').fill(lesson);
	await page.getByRole('button', { name: 'Add learning' }).click();
	const list = page.getByRole('main').getByRole('list');
	await expect(list.getByRole('listitem')).toHaveCount(1);
	await expect(list).toContainText(`pushed first on ${info.project.name}`);
	await expect(page.getByLabel('New learning')).toHaveValue('');

	await page.getByRole('button', { name: 'Edit learning 1' }).click();
	await page.getByLabel('Learning 1').fill(`edited on ${info.project.name} → keep it`);
	await page.getByRole('button', { name: 'Save' }).click();
	await expect(list).toContainText(`edited on ${info.project.name}`);

	await page.getByRole('button', { name: 'Edit learning 1' }).click();
	await page.getByRole('button', { name: 'Remove' }).click();
	await expect(page.getByText('No learnings yet')).toBeVisible();
});

test('global learnings are edited on the Global page', async ({ page }, info) => {
	await page.goto('/global');
	await page.waitForLoadState('networkidle');
	const lesson = `global on ${info.project.name} → applies everywhere`;
	await page.getByLabel('New learning').fill(lesson);
	await page.getByRole('button', { name: 'Add learning' }).click();
	const item = page
		.getByRole('main')
		.getByRole('listitem')
		.filter({ hasText: lesson.slice(0, 12) });
	await expect(item).toBeVisible();
	const n = (await item.locator('span').first().textContent())?.trim();
	await page.getByRole('button', { name: `Edit learning ${n}` }).click();
	await page.getByRole('button', { name: 'Remove' }).click();
	await expect(item).toHaveCount(0);
});

test('the open dashboard re-reads state within two seconds and shows a terminal change', async ({
	page
}, info) => {
	await openNotes(page);
	const title = `Added from a terminal on ${info.project.name}`;
	await expect(page.getByRole('region', { name: title })).toHaveCount(0);
	wf('add', 'major', title, '--deliverable', 'the page updates without a reload');
	// The refresh starts within two seconds of the write (plus timer slack), with no reload.
	await page.waitForRequest((r) => r.url().includes('__data.json'), { timeout: 2500 });
	await expect(page.getByRole('region', { name: title })).toBeVisible();
});

test('the owner edits a memory section, and a broken edit is refused with the file kept', async ({
	page
}, info) => {
	await openNotes(page);
	await page
		.getByRole('navigation', { name: 'Views' })
		.getByRole('link', { name: 'memory' })
		.click();
	await expect(page.getByRole('heading', { name: 'Invariants' })).toBeVisible();
	await page.waitForLoadState('networkidle');

	await page.getByRole('button', { name: 'Edit section 1' }).click();
	const editor = page.getByLabel('Markdown of section 1');
	// Earlier runs on other sizes may have written an invariant; the heading is always first.
	await expect(editor).toHaveValue(/^## Invariants/);
	await editor.fill('## Invariant\n\n1. renamed by mistake');
	await page.getByRole('button', { name: 'Save' }).click();
	await expect(page.getByRole('alert')).toHaveText('memory.md needs its "## Invariants" section');

	const invariant = `notes are written atomically (${info.project.name})`;
	await editor.fill(`## Invariants\n\n1. ${invariant}`);
	await page.getByRole('button', { name: 'Save' }).click();
	await expect(page.getByRole('region', { name: 'Invariants' })).toContainText(invariant);
	await expect(editor).toBeHidden();
});

test('a steer is edited in place; one missing its Why is refused', async ({ page }, info) => {
	wf(
		'steer',
		`notes open from links on ${info.project.name}`,
		'--why',
		'sharing needs it',
		'--affects',
		'1',
		'--changed',
		'1 deliverable',
		'--log',
		'true'
	);
	await openNotes(page);
	await page
		.getByRole('navigation', { name: 'Views' })
		.getByRole('link', { name: 'steers' })
		.click();
	await page.waitForLoadState('networkidle');
	const steer = page
		.getByRole('main')
		.getByRole('region')
		.filter({ hasText: `notes open from links on ${info.project.name}` });
	const n = (await steer.getAttribute('aria-labelledby'))?.replace('section-', '');
	await steer.getByRole('button', { name: `Edit section ${Number(n) + 1}` }).click();
	const editor = page.getByLabel(`Markdown of section ${Number(n) + 1}`);
	const text = await editor.inputValue();
	await editor.fill(text.replace(/^Why: .*$/m, ''));
	await page.getByRole('button', { name: 'Save' }).click();
	await expect(page.getByRole('alert')).toContainText('steers.md: malformed entry');
	await editor.fill(text.replace(/^Why: .*$/m, 'Why: the owner reworded it'));
	await page.getByRole('button', { name: 'Save' }).click();
	await expect(steer).toContainText('the owner reworded it');
});

test('an unregistered path is a 404', async ({ page }) => {
	const response = await page.goto('/projects/etc');
	expect(response?.status()).toBe(404);
});

test('the owner sets a refuse limit, then a warn limit, and wf follows them', async ({
	page
}, info) => {
	await page.goto('/');
	const nav = await sidebar(page, info);
	await nav.getByRole('link', { name: 'Settings' }).click();
	await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();
	await page.waitForLoadState('networkidle');

	const warn = page.getByLabel('One learning: warn above');
	const refuse = page.getByLabel('One learning: refuse above');
	const save = page.getByRole('button', { name: 'Save settings' });
	await expect(save).toBeDisabled();
	await expect(warn).toHaveValue('200');
	await expect(refuse).toHaveValue('-1');

	// Typed values survive the two-second refresh.
	await warn.fill('-1');
	await refuse.fill('30');
	await page.waitForTimeout(2500);
	await expect(refuse).toHaveValue('30');
	await save.click();
	await expect(save).toBeDisabled();
	await expect(page.getByText('Saved; wf uses them from its next command.')).toBeVisible();
	const long = `a lesson from ${info.project.name} that runs past thirty → limited`;
	expect(() => wf('learn', long)).toThrow(/over the owner's refuse limit of 30/);

	await warn.fill('30');
	await refuse.fill('-1');
	await save.click();
	await expect(save).toBeDisabled();
	const r = spawnSync(process.execPath, [cli, 'learn', long], {
		cwd: `${e2e}notes`,
		env: { ...terminal, WF_HOME: `${e2e}home` },
		encoding: 'utf8'
	});
	expect(r.status).toBe(0);
	expect(r.stderr).toContain("over the owner's warn limit of 30");
	wf('learn', '--remove', '1');

	// The dashboard follows the same limits: its counter shows them, and its save warns.
	await page.goto(`/projects${e2e}notes?view=learnings`);
	await page.waitForLoadState('networkidle');
	await page.getByLabel('New learning').fill(long);
	const counter = page.locator('#new-learning-count');
	await expect(counter).toContainText('warn above 30');
	await expect(counter).toHaveClass(/text-progress/);
	await page.getByRole('button', { name: 'Add learning' }).click();
	await expect(page.getByText(/Saved, with a warning: .*warn limit of 30/)).toBeVisible();
	wf('learn', '--remove', '1');
	await page.goto('/settings');
	await page.waitForLoadState('networkidle');

	// A refuse limit at or below its warn limit is refused, with the saved settings kept.
	await refuse.fill('20');
	await save.click();
	await expect(page.getByRole('alert')).toContainText(
		'learningChars refuse must be above its warn'
	);

	// Back to the defaults for the next run.
	await warn.fill('200');
	await refuse.fill('-1');
	await save.click();
	await expect(save).toBeDisabled();
});
