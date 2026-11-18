import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = fileURLToPath(new URL('..', import.meta.url));
const cli = fileURLToPath(new URL('cli.ts', import.meta.url));
let project = '';
let home = '';
let tmp = '';

before(() => {
	mkdirSync(join(repo, 'scratch', 'temp'), { recursive: true });
	tmp = mkdtempSync(join(repo, 'scratch', 'temp', 'cli-test-'));
	project = join(tmp, 'project');
	home = join(tmp, 'home');
	mkdirSync(project);
});

after(() => rmSync(tmp, { recursive: true }));

function wf(...args: string[]) {
	const r = spawnSync(process.execPath, [cli, ...args], {
		cwd: project,
		env: { ...process.env, WF_HOME: home },
		encoding: 'utf8'
	});
	return { code: r.status, out: r.stdout, err: r.stderr };
}

// The steps share one project, so they run in order.
test('init creates docs/state in setup state and registers the project', () => {
	const r = wf('init');
	assert.equal(r.code, 0, r.err);
	for (const f of ['todo.md', 'handoff.md', 'learnings.md', 'memory.md', 'steers.md', 'risks.md'])
		assert.ok(existsSync(join(project, 'docs', 'state', f)), f);
	const registry = JSON.parse(readFileSync(join(home, 'local', 'projects.json'), 'utf8'));
	assert.ok(project in registry);
	assert.match(wf('status').out, /state: setup/);
	const again = wf('init');
	assert.equal(again.code, 0, again.err);
	assert.match(again.out, /already exists; registered it/);
	assert.equal(
		Object.keys(JSON.parse(readFileSync(join(home, 'local', 'projects.json'), 'utf8'))).length,
		1
	);
});

test('add prints the added lines and assigns ids', () => {
	const major = wf('add', 'major', 'Core', '--deliverable', 'it works');
	assert.equal(major.code, 0, major.err);
	assert.match(major.out, /^\+ ## \[ \] 0 · Core$/m);
	assert.match(major.out, /^\+ Deliverable: it works$/m);
	assert.match(
		wf('add', 'minor', '0', 'parse', '--proof', 'tests pass').out,
		/^\+ - \[ \] 0\.1 parse$/m
	);
	assert.match(
		wf('add', 'minor', '0', 'write', '--proof', 'file written').out,
		/^\+ - \[ \] 0\.2 write$/m
	);
	assert.equal(wf('next').out.trim(), '0.1 parse');
});

test('start, impl and done print the changed lines', () => {
	const started = wf('start', '0.1');
	assert.match(started.out, /^- - \[ \] 0\.1 parse$/m);
	assert.match(started.out, /^\+ - \[~\] 0\.1 parse$/m);
	assert.match(started.out, /^\+ ## \[~\] 0 · Core$/m);
	assert.match(wf('impl', '0.1', 'a strict line parser').out, /^\+ {3}- a strict line parser$/m);
	assert.match(wf('done', '0.1').out, /^\+ - \[x\] 0\.1 parse$/m);
	const shown = wf('show', '0.1').out;
	assert.match(shown, /Proof: tests pass/);
	assert.match(shown, /- a strict line parser/);
	assert.match(wf('show', '0').out, /\[x\] 0\.1 parse\n\[ \] 0\.2 write/);
});

test('status and handoff reflect the todo', () => {
	const s = wf('status').out;
	assert.match(s, /active: —/);
	assert.match(s, /next: 0\.2 write/);
	assert.match(s, /learnings: 0 project, 0 global/);
	wf('start', '0.2');
	const h = wf(
		'handoff',
		'--next',
		'finish 0.2',
		'--verify',
		'node --test',
		'--dont',
		'skip tests'
	);
	assert.equal(h.code, 0, h.err);
	assert.match(h.out, /^\+ Active: 0\.2$/m);
	assert.match(h.out, /^\+ Next: finish 0\.2$/m);
	assert.match(readFileSync(join(project, 'docs', 'state', 'handoff.md'), 'utf8'), /State: setup/);
});

test('rule violations and bad usage fail without writing', () => {
	const todo = () => readFileSync(join(project, 'docs', 'state', 'todo.md'), 'utf8');
	const unchanged = todo();
	const missing = wf('add', 'major', 'No deliverable');
	assert.equal(missing.code, 1);
	assert.match(missing.err, /deliverable is required/);
	assert.match(wf('done', '0.1').err, /not in progress/);
	assert.equal(wf('frobnicate').code, 2);
	assert.equal(wf('add', 'major', 'x', '--nope', 'y').code, 2);
	assert.equal(todo(), unchanged);
});

test('the lock blocks a live writer and takes over from a dead one', () => {
	const lock = join(project, 'scratch', 'temp', 'wf.lock');
	mkdirSync(join(project, 'scratch', 'temp'), { recursive: true });
	writeFileSync(lock, String(process.pid));
	assert.match(wf('impl', '0.2', 'blocked').err, /being written by process/);
	writeFileSync(lock, '2147483646');
	assert.equal(wf('impl', '0.2', 'taken over').code, 0);
	assert.ok(!existsSync(lock));
});

test('batch writes a plan in one call, all or nothing', () => {
	const file = join(tmp, 'plan.md');
	writeFileSync(
		file,
		'## Page\nDeliverable: a page lists notes\n\n- list\n  Proof: screenshots\n\n## 0\n- export\n  Proof: a file is written\n'
	);
	const r = wf('batch', file);
	assert.equal(r.code, 0, r.err);
	assert.match(r.out, /^\+ ## \[ \] 1 · Page$/m);
	assert.match(r.out, /^\+ - \[ \] 1\.1 list$/m);
	assert.match(r.out, /^\+ - \[ \] 0\.3 export$/m);
	const todo = readFileSync(join(project, 'docs', 'state', 'todo.md'), 'utf8');
	writeFileSync(file, '## More\nDeliverable: d\n- no proof here\n');
	const bad = wf('batch', file);
	assert.equal(bad.code, 1);
	assert.match(bad.err, /plan\.md:4: expected " {2}Proof/);
	assert.equal(readFileSync(join(project, 'docs', 'state', 'todo.md'), 'utf8'), todo);
});

test('edit prints the changed line', () => {
	const r = wf('edit', '1.1', '--title', 'list view');
	assert.equal(r.code, 0, r.err);
	assert.match(r.out, /^- - \[ \] 1\.1 list$/m);
	assert.match(r.out, /^\+ - \[ \] 1\.1 list view$/m);
	assert.match(wf('edit', '1', '--proof', 'x').err, /majors have a deliverable/);
});

test('doc writes a whole document or one section', () => {
	const doc = () => readFileSync(join(project, 'docs', 'state', 'implementation.md'), 'utf8');
	const whole = join(tmp, 'whole.md');
	writeFileSync(whole, '# Implementation\n\n## Store\n\nJSON file.\n\n## Page\n\nSvelte.\n');
	assert.equal(wf('doc', 'implementation', '--from', whole).code, 0);
	const part = join(tmp, 'part.md');
	writeFileSync(part, 'SQLite, one table.\n\n### Why\n\nConcurrent writers.\n');
	const r = wf('doc', 'implementation', '--section', 'Store', '--from', part);
	assert.equal(r.code, 0, r.err);
	assert.match(r.out, /^- JSON file\.$/m);
	assert.match(r.out, /^\+ SQLite, one table\.$/m);
	assert.equal(
		doc(),
		'# Implementation\n\n## Store\n\nSQLite, one table.\n\n### Why\n\nConcurrent writers.\n\n## Page\n\nSvelte.\n'
	);
	writeFileSync(part, 'Later.\n');
	wf('doc', 'implementation', '--section', 'Risks', '--from', part);
	assert.match(doc(), /## Page\n\nSvelte\.\n\n## Risks\n\nLater\.\n$/);
	writeFileSync(part, '## sneaky\n');
	assert.match(
		wf('doc', 'implementation', '--section', 'X', '--from', part).err,
		/no "# " or "## "/
	);
	assert.match(wf('doc', 'notes', '--from', part).err, /no document notes/);
	assert.equal(wf('doc', 'spec').code, 2);
});

test('commands outside a project explain what to do', () => {
	// Everything under scratch/ sits inside this repo, so run from / (read-only) instead.
	const r = spawnSync(process.execPath, [cli, 'status'], { cwd: '/', encoding: 'utf8' });
	assert.match(r.stderr, /run wf init in the project/);
});
