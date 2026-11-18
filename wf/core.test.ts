import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
	WfError,
	addMajor,
	applyBatch,
	editItem,
	addMinor,
	done,
	formatHandoff,
	formatTodo,
	impl,
	nextItem,
	parseHandoff,
	parseTodo,
	reopen,
	start
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

test('start sets the major in progress', () => {
	const todo = parseTodo(sample);
	start(todo, '1.1');
	assert.equal(todo.majors[1].mark, '~');
	assert.throws(() => start(todo, '1.1'), /already in progress/);
	assert.throws(() => start(todo, '1'), /takes a minor id/);
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

test('handoff round-trips, checks the state, and is capped at 15 lines', () => {
	const text =
		"# Handoff\nState: build\nActive: 1.1\nNext: 1.2\nVerify: node --test\nDon't: hand-edit\nOpen: —\n";
	const h = parseHandoff(text);
	assert.deepEqual(h.open, []);
	assert.equal(formatHandoff(h), text);
	assert.throws(() => parseHandoff(text.replace('build', 'admin')), /state must be one of/);
	assert.throws(() => formatHandoff({ ...h, open: Array(10).fill('q') }), /limited to 15 lines/);
	assert.throws(() => parseHandoff('# Handoff\nState: build\n'), WfError);
});
