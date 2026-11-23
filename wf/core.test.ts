import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	WfError,
	addMajor,
	addMicro,
	applyBatch,
	editItem,
	addMinor,
	done,
	formatHandoff,
	formatLearnings,
	formatTodo,
	impl,
	nextItem,
	parseHandoff,
	parseLearnings,
	parseTodo,
	readSections,
	reopen,
	start,
	writeSection
} from './core.ts';

const sample = `# Todo

## [~] 0 · Setup
Deliverable: a repo

- [x] 0.1 init
  Proof: git log shows init
  - git init -b work
- [ ] 0.2 ignore
  Proof: git status --ignored

## [ ] 1 · Core
Deliverable: the core works

- [ ] 1.1 parse
  Proof: tests pass

## [ ] 2 · Later
Deliverable: nothing yet
`;

const real = (name: string) =>
	readFileSync(new URL(`../docs/state/${name}`, import.meta.url), 'utf8');

test('todo round-trips unchanged', () => {
	assert.equal(formatTodo(parseTodo(sample)), sample);
});

test('the real todo.md and handoff.md are canonical', () => {
	assert.equal(formatTodo(parseTodo(real('todo.md'))), real('todo.md'));
	assert.equal(formatHandoff(parseHandoff(real('handoff.md'))), real('handoff.md'));
});

test('parse errors name the line', () => {
	assert.throws(
		() => parseTodo('# Todo\n\n## [ ] 0 · Setup\nnot a deliverable\n'),
		/todo\.md:4: expected "Deliverable/
	);
	assert.throws(() => parseTodo('# Todo\n\nstray\n'), /todo\.md:3: unrecognised line/);
	assert.throws(
		() => parseTodo('# Todo\n\n## [ ] 0 · A\nDeliverable: d\n\n- [ ] 1.1 x\n  Proof: p\n'),
		/not under major 0/
	);
});

test('learnings round-trip, numbered 1..n, and a broken file names its line', () => {
	for (const file of ['../docs/state/learnings.md', '../global/learnings.md']) {
		const text = readFileSync(new URL(file, import.meta.url), 'utf8');
		assert.equal(formatLearnings(parseLearnings(text, file)), text);
	}
	assert.equal(formatLearnings([]), '# Learnings\n');
	assert.deepEqual(parseLearnings('# Learnings\n', 'l.md'), []);
	assert.throws(
		() => parseLearnings('# Learnings\n\n1. a → b\n3. c → d\n', 'l.md'),
		/l\.md:4: expected "2\. <learning>"/
	);
	assert.throws(() => parseLearnings('# Notes\n', 'l.md'), /l\.md:1: expected "# Learnings"/);
});

test('a minor waiting on the owner does not block starting the next one, in any major', () => {
	const todo = parseTodo(sample);
	start(todo, '0.2');
	start(todo, '1.1');
	assert.deepEqual(
		todo.majors.flatMap((m) => m.minors.filter((n) => n.mark === '~').map((n) => n.id)),
		['0.2', '1.1']
	);
});

test('several minors in one major may be in progress', () => {
	const todo = parseTodo(sample);
	addMinor(todo, '0', 'third', 'proof');
	start(todo, '0.2');
	start(todo, '0.3');
	assert.equal(todo.majors[0].minors.filter((n) => n.mark === '~').length, 2);
});

test('done needs an in-progress minor; a major needs all minors done', () => {
	const todo = parseTodo(sample);
	assert.throws(() => done(todo, '0.2'), /not in progress/);
	assert.throws(() => done(todo, '0'), /unfinished minors: 0\.2/);
	assert.throws(() => done(todo, '2'), /has no minors/);
	start(todo, '0.2');
	done(todo, '0.2');
	done(todo, '0');
	assert.equal(todo.majors[0].mark, 'x');
	assert.throws(() => addMinor(todo, '0', 'late', 'p'), /is done/);
});

test('micros are checkable items under a minor: added, started, done, round-tripped', () => {
	const todo = parseTodo(sample);
	const first = addMicro(todo, '1.1', 'parse the header');
	const second = addMicro(todo, '1.1', 'parse the rows');
	assert.deepEqual([first.id, second.id], ['1.1.1', '1.1.2']);
	assert.throws(() => addMicro(todo, '1', 'x'), /under a minor/);
	assert.throws(() => done(todo, '1.1.1'), /not in progress/);

	// Starting a micro starts its minor and major.
	start(todo, '1.1.1');
	assert.equal(todo.majors[1].minors[0].mark, '~');
	assert.equal(todo.majors[1].mark, '~');
	done(todo, '1.1.1');
	assert.throws(() => done(todo, '1.1'), /unfinished micros: 1\.1\.2/);
	start(todo, '1.1.2');
	done(todo, '1.1.2');
	done(todo, '1.1');

	// The file keeps micros under their minor, before its details, and reads back the same.
	const text = formatTodo(todo);
	assert.match(
		text,
		/^- \[x\] 1\.1 .+\n {2}Proof: .+\n {2}- \[x\] 1\.1\.1 parse the header\n {2}- \[x\] 1\.1\.2 parse the rows$/m
	);
	assert.equal(formatTodo(parseTodo(text)), text);
	assert.throws(() => addMicro(todo, '1.1', 'late'), /is done/);

	reopen(todo, '1.1.2');
	assert.equal(todo.majors[1].minors[0].mark, '~');
	editItem(todo, '1.1.2', { title: 'parse every row' });
	assert.match(formatTodo(todo), /- \[ \] 1\.1\.2 parse every row/);
	assert.throws(() => editItem(todo, '1.1.2', { proof: 'p' }), /micros have only a title/);
	assert.throws(
		() => parseTodo(text.replace('1.1.1', '2.1.1')),
		/micro 2\.1\.1 is not under minor 1\.1/
	);
});

test('start sets the major in progress', () => {
	const todo = parseTodo(sample);
	start(todo, '1.1');
	assert.equal(todo.majors[1].mark, '~');
	assert.throws(() => start(todo, '1.1'), /already in progress/);
	assert.throws(() => start(todo, '1'), /takes a minor \(x\.x\) or a micro/);
});

test('ids are max+1 and minors start at .1', () => {
	const todo = parseTodo(sample);
	assert.equal(addMajor(todo, 'Next', 'd').id, '3');
	assert.equal(addMinor(todo, '3', 'first', 'p').id, '3.1');
	assert.equal(addMinor(todo, '0', 'third', 'p').id, '0.3');
});

test('implementation details need a started minor', () => {
	const todo = parseTodo(sample);
	assert.throws(() => impl(todo, '1.1', 'x'), /hasn't started/);
	start(todo, '1.1');
	impl(todo, '1.1', 'wrote the parser');
	assert.deepEqual(todo.majors[1].minors[0].impl, ['wrote the parser']);
});

test('next is the first open minor, so work in progress never stalls it', () => {
	const todo = parseTodo(sample);
	assert.equal(nextItem(todo)?.id, '0.2');
	start(todo, '0.2');
	assert.equal(nextItem(todo)?.id, '1.1');
	start(todo, '1.1');
	assert.equal(nextItem(todo)?.id, '2');
	done(todo, '0.2');
	assert.equal(nextItem(todo)?.id, '0');
	done(todo, '0');
	done(todo, '1.1');
	assert.equal(nextItem(todo)?.id, '1');
	done(todo, '1');
	assert.equal(nextItem(todo)?.id, '2');
});

const plan = `## Store
Deliverable: notes persist across restarts

- save and load
  Proof: a test saves two notes and reloads them
- migrate old file
  Proof: an old-format file loads

## Page
Deliverable: a page lists the notes

- list view
  Proof: desktop and mobile screenshots show both notes
`;

test('a batch writes a whole plan, assigning ids', () => {
	const todo = parseTodo('# Todo\n');
	assert.deepEqual(applyBatch(todo, plan), ['0', '0.1', '0.2', '1', '1.1']);
	assert.equal(todo.majors[1].deliverable, 'a page lists the notes');
	assert.equal(todo.majors[0].minors[1].proof, 'an old-format file loads');
	assert.equal(formatTodo(parseTodo(formatTodo(todo))), formatTodo(todo));
});

test('a batch adds minors to an existing major by id', () => {
	const todo = parseTodo(sample);
	assert.deepEqual(applyBatch(todo, '## 1\n- write\n  Proof: file written\n'), ['1.2']);
	assert.throws(
		() => applyBatch(parseTodo(sample), '## 9\n- x\n  Proof: p\n'),
		/batch:1: no major 9/
	);
});

test('a batch is all or nothing and names the bad line', () => {
	const todo = parseTodo(sample);
	const before = formatTodo(todo);
	const bad = plan.replace('  Proof: an old-format file loads\n', '');
	assert.throws(() => applyBatch(todo, bad, 'plan.md'), /plan\.md:7: expected " {2}Proof/);
	assert.throws(() => applyBatch(todo, '- orphan\n  Proof: p\n'), /needs a "## " major header/);
	assert.throws(() => applyBatch(todo, '\n\n'), /nothing to add/);
	assert.throws(() => applyBatch(todo, 'stray\n'), /batch:1: unrecognised line/);
	assert.equal(formatTodo(todo), before);
});

test('edit changes titles, proofs and deliverables, each on the right kind of item', () => {
	const todo = parseTodo(sample);
	editItem(todo, '1.1', { title: 'parse strictly', proof: 'round-trip test' });
	editItem(todo, '1', { deliverable: 'the core works end to end' });
	assert.equal(todo.majors[1].minors[0].title, 'parse strictly');
	assert.equal(todo.majors[1].minors[0].proof, 'round-trip test');
	assert.equal(todo.majors[1].deliverable, 'the core works end to end');
	assert.throws(() => editItem(todo, '1.1', { deliverable: 'x' }), /minors have a proof/);
	assert.throws(() => editItem(todo, '1', { proof: 'x' }), /majors have a deliverable/);
	assert.throws(() => editItem(todo, '1', {}), /nothing to change/);
});

test('a bare < is escaped in the file and plain in memory; code spans are left alone', () => {
	const todo = parseTodo(sample);
	start(todo, '1.1');
	impl(todo, '1.1', 'writeDoc takes "# <Title>" and `wf show <id>`');
	editItem(todo, '1', { deliverable: 'renders past <title> tags' });
	const text = formatTodo(todo);
	assert.ok(text.includes('  - writeDoc takes "# \\<Title>" and `wf show <id>`'));
	assert.ok(text.includes('Deliverable: renders past \\<title> tags'));
	const back = parseTodo(text);
	assert.equal(back.majors[1].minors[0].impl[0], 'writeDoc takes "# <Title>" and `wf show <id>`');
	assert.equal(back.majors[1].deliverable, 'renders past <title> tags');
	assert.equal(formatTodo(back), text);
});

test('items are kept in id order, whatever order the file has', () => {
	const shuffled = `# Todo

## [ ] 1 · Second
Deliverable: d

- [ ] 1.10 tenth
  Proof: p
- [ ] 1.2 second
  Proof: p
- [ ] 1.9 ninth
  Proof: p

## [ ] 0 · First
Deliverable: d

- [ ] 0.2 b
  Proof: p
- [ ] 0.1 a
  Proof: p
`;
	const todo = parseTodo(shuffled);
	assert.deepEqual(
		todo.majors.flatMap((m) => [m.id, ...m.minors.map((n) => n.id)]),
		['0', '0.1', '0.2', '1', '1.2', '1.9', '1.10']
	);
	assert.match(
		formatTodo(todo),
		/0\.1 a[\s\S]*0\.2 b[\s\S]*1\.2 second[\s\S]*1\.9 ninth[\s\S]*1\.10 tenth/
	);
});

test('the handoff escapes the same way', () => {
	const h = {
		state: 'build' as const,
		active: '—',
		next: 'run with ITEM=<id>',
		verify: '`ITEM=<id> pnpm test`',
		dont: 'x',
		open: []
	};
	const text = formatHandoff(h);
	assert.match(text, /^Next: run with ITEM=\\<id>$/m);
	assert.match(text, /^Verify: `ITEM=<id> pnpm test`$/m);
	assert.deepEqual(parseHandoff(text), h);
});

test('reopen undoes marks for the owner', () => {
	const todo = parseTodo(sample);
	start(todo, '0.2');
	done(todo, '0.2');
	done(todo, '0');
	reopen(todo, '0');
	assert.equal(todo.majors[0].mark, '~');
	reopen(todo, '0.2');
	assert.equal(todo.majors[0].minors[1].mark, ' ');
	assert.throws(() => reopen(todo, '0.2'), /already open/);
	assert.throws(() => reopen(todo, '1'), /isn't done/);
	start(todo, '1.1');
	reopen(todo, '1.1');
	assert.equal(todo.majors[1].mark, ' ');
});

test('fields are required and single-line', () => {
	const todo = parseTodo(sample);
	assert.throws(() => addMajor(todo, ' ', 'd'), /title is required/);
	assert.throws(() => addMinor(todo, '1', 'a\nb', 'p'), /must be one line/);
});

test('handoff round-trips and checks the state; its length is left to the owner limit', () => {
	const text =
		"# Handoff\nState: build\nActive: 1.1\nNext: 1.2\nVerify: node --test\nDon't: hand-edit\nOpen: —\n";
	const h = parseHandoff(text);
	assert.deepEqual(h.open, []);
	assert.equal(formatHandoff(h), text);
	assert.throws(() => parseHandoff(text.replace('build', 'admin')), /state must be one of/);
	assert.equal(
		formatHandoff({ ...h, open: Array(10).fill('q') })
			.trimEnd()
			.split('\n').length,
		16
	);
	assert.throws(() => parseHandoff('# Handoff\nState: build\n'), WfError);
});

/** A scratch project holding copies of this repo's real state files. */
function copyOfRealState(): string {
	const root = fileURLToPath(new URL('../scratch/temp/core-sections', import.meta.url));
	rmSync(root, { recursive: true, force: true });
	mkdirSync(join(root, 'docs'), { recursive: true });
	cpSync(fileURLToPath(new URL('../docs/state', import.meta.url)), join(root, 'docs', 'state'), {
		recursive: true
	});
	return root;
}

test('every section written back unchanged leaves the real files byte-identical', () => {
	const root = copyOfRealState();
	for (const file of ['steers.md', 'risks.md', 'memory.md', 'implementation.md', 'spec.md']) {
		const path = join(root, 'docs', 'state', file);
		const original = readFileSync(path, 'utf8');
		const { sections } = readSections(root, file);
		assert.ok(sections.length > 0, file);
		sections.forEach((s, i) => writeSection(root, file, i, s.text));
		assert.equal(readFileSync(path, 'utf8'), original, file);
	}
});

test('a section edit changes only that section, and each file keeps its own rules', () => {
	const root = copyOfRealState();
	const path = (f: string) => join(root, 'docs', 'state', f);
	const steers = readSections(root, 'steers.md').sections;
	const before = readFileSync(path('steers.md'), 'utf8');
	const edited = steers[1].text.replace(/^Why: .*$/m, 'Why: reworded by the owner');
	const { after } = writeSection(root, 'steers.md', 1, edited);
	const changed = after.split('\n').filter((l, i) => l !== before.split('\n')[i]);
	assert.deepEqual(changed, ['Why: reworded by the owner']);

	const kept = readFileSync(path('steers.md'), 'utf8');
	assert.throws(
		() => writeSection(root, 'steers.md', 1, steers[1].text.replace(/^Why: .*\n/m, '')),
		/steers\.md: malformed entry/
	);
	assert.equal(readFileSync(path('steers.md'), 'utf8'), kept);

	const risk = readSections(root, 'risks.md').sections[0].text;
	assert.throws(
		() => writeSection(root, 'risks.md', 0, risk.replace(/ · medium$/m, ' · huge')),
		/level is one of low, medium, high/
	);
	const pitfalls = readSections(root, 'memory.md').sections.findIndex(
		(s) => s.heading === 'Pitfalls'
	);
	assert.throws(
		() => writeSection(root, 'memory.md', pitfalls, '## Pitfall\n\n- renamed'),
		/memory\.md needs its "## Pitfalls" section/
	);
	assert.throws(() => writeSection(root, 'spec.md', 0, 'no heading'), /starts with its "## /);
	assert.throws(
		() => writeSection(root, 'spec.md', 0, '## A\n\n## B'),
		/one "## " heading; use "### "/
	);
	assert.throws(
		() => writeSection(root, 'spec.md', 0, '## A\n\na <title> tag'),
		/renders as an HTML tag/
	);
	assert.throws(() => writeSection(root, 'spec.md', 999, '## A'), /has no section 1000/);
	assert.throws(() => readSections(root, 'todo.md'), /isn't edited by section/);
});
