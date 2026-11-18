import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
	WfError,
	addMajor,
	addMinor,
	done,
	formatHandoff,
	formatTodo,
	impl,
	parseHandoff,
	parseTodo,
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

const real = (name: string) => readFileSync(new URL(`../docs/state/${name}`, import.meta.url), 'utf8');

test('todo round-trips unchanged', () => {
	assert.equal(formatTodo(parseTodo(sample)), sample);
});

test('the real todo.md and handoff.md are canonical', () => {
	assert.equal(formatTodo(parseTodo(real('todo.md'))), real('todo.md'));
	assert.equal(formatHandoff(parseHandoff(real('handoff.md'))), real('handoff.md'));
});

test('parse errors name the line', () => {
	assert.throws(() => parseTodo('# Todo\n\n## [ ] 0 · Setup\nnot a deliverable\n'), /todo\.md:4: expected "Deliverable/);
	assert.throws(() => parseTodo('# Todo\n\nstray\n'), /todo\.md:3: unrecognised line/);
	assert.throws(() => parseTodo('# Todo\n\n## [ ] 0 · A\nDeliverable: d\n\n- [ ] 1.1 x\n  Proof: p\n'), /not under major 0/);
});

test('starting minors in two majors is rejected', () => {
	const todo = parseTodo(sample);
	start(todo, '0.2');
	assert.throws(() => start(todo, '1.1'), /major 0 has minors in progress/);
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

test('fields are required and single-line', () => {
	const todo = parseTodo(sample);
	assert.throws(() => addMajor(todo, ' ', 'd'), /title is required/);
	assert.throws(() => addMinor(todo, '1', 'a\nb', 'p'), /must be one line/);
});

test('handoff round-trips, checks the state, and is capped at 15 lines', () => {
	const text = '# Handoff\nState: build\nActive: 1.1\nNext: 1.2\nVerify: node --test\nDon\'t: hand-edit\nOpen: —\n';
	const h = parseHandoff(text);
	assert.deepEqual(h.open, []);
	assert.equal(formatHandoff(h), text);
	assert.throws(() => parseHandoff(text.replace('build', 'admin')), /state must be one of/);
	assert.throws(() => formatHandoff({ ...h, open: Array(10).fill('q') }), /limited to 15 lines/);
	assert.throws(() => parseHandoff('# Handoff\nState: build\n'), WfError);
});
