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

// As the owner in a terminal by default: no Claude Code session in the environment.
const terminal = Object.fromEntries(
	Object.entries(process.env).filter(([k]) => k !== 'CLAUDECODE' && k !== 'CLAUDE_CODE_SESSION_ID')
);

function run(cwd: string, env: Record<string, string>, ...args: string[]) {
	const r = spawnSync(process.execPath, [cli, ...args], {
		cwd,
		env: { ...terminal, WF_HOME: home, ...env },
		encoding: 'utf8'
	});
	return { code: r.status, out: r.stdout, err: r.stderr };
}

const wf = (...args: string[]) => run(project, {}, ...args);

// The steps share one project, so they run in order.
test('init creates docs/state in setup state and registers the project', () => {
	const r = wf('init');
	assert.equal(r.code, 0, r.err);
	assert.match(r.out, /Instructions for the setup state:\nThe project is in setup/);
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
	writeFileSync(part, 'Format:\n\n```\n# Todo\n## [ ] 0 · Title\n```\n');
	assert.equal(wf('doc', 'implementation', '--section', 'Store', '--from', part).code, 0);
	assert.match(doc(), /## Store\n\nFormat:\n\n```\n# Todo\n## \[ \] 0 · Title\n```\n\n## Page\n/);
	writeFileSync(part, 'Second write.\n');
	wf('doc', 'implementation', '--section', 'Store', '--from', part);
	assert.match(doc(), /## Store\n\nSecond write\.\n\n## Page\n/);
	writeFileSync(part, '## sneaky\n');
	assert.match(
		wf('doc', 'implementation', '--section', 'X', '--from', part).err,
		/no "# " or "## "/
	);
	assert.match(wf('doc', 'notes', '--from', part).err, /no document notes/);
	writeFileSync(part, 'Fine: `<id>`, \\<id>.\n\n```\n<title>\n```\n\nBroken: "# <Title>".\n');
	const bare = wf('doc', 'implementation', '--section', 'X', '--from', part);
	assert.equal(bare.code, 1);
	assert.match(
		bare.err,
		/the implementation text, line 7: <Title> outside code renders as an HTML tag/
	);
	assert.equal(wf('doc', 'spec').code, 2);
});

test('state switches the handoff state and prints the new instructions', () => {
	const r = wf('state', 'discuss');
	assert.equal(r.code, 0, r.err);
	assert.match(r.out, /^- State: setup$/m);
	assert.match(r.out, /^\+ State: discuss$/m);
	assert.match(r.out, /Instructions for the discuss state:\nThe project is in discuss/);
	assert.match(wf('status').out, /state: discuss/);
	assert.match(wf('state', 'admin').err, /state must be one of setup, discuss, build/);
	assert.equal(wf('state').code, 2);
	wf('state', 'setup');
});

test('learn numbers lessons, needs the arrow, and by default only warns about size', () => {
	const file = join(project, 'docs', 'state', 'learnings.md');
	const first = wf('learn', 'pushed before updating state → state first, then commit');
	assert.equal(first.code, 0, first.err);
	assert.match(first.out, /^\+ 1\. pushed before updating state → state first, then commit$/m);
	assert.match(wf('learn', 'second lesson → do better').out, /^\+ 2\. second lesson → do better$/m);
	assert.match(wf('learn', 'no arrow here').err, /what went wrong → what to do instead/);
	const long = wf('learn', `${'x'.repeat(200)} → y`);
	assert.equal(long.code, 0, long.err);
	assert.match(
		long.err,
		/warning: this learning in characters is 204, over the owner's warn limit of 200/
	);
	wf('learn', '--remove', '3');
	const global = wf('learn', 'a lesson for all → apply it', '--global');
	assert.equal(global.code, 0, global.err);
	assert.match(
		readFileSync(join(home, 'global', 'learnings.md'), 'utf8'),
		/^1\. a lesson for all → apply it$/m
	);
	// Past the size target, learn still writes and only warns, naming this project's sizes.
	let lastErr = '';
	for (let i = 0; i < 40; i++) {
		const r = wf('learn', `filler lesson number ${i} ${'z'.repeat(150)} → keep it short`);
		assert.equal(r.code, 0, r.err);
		lastErr = r.err;
	}
	assert.match(
		lastErr,
		/warning: this project's session context in characters \(global learnings \d+, project learnings \d+, handoff \d+\) is \d+, over the owner's warn limit of 4000/
	);
	assert.equal(wf('learn', `a global one ${'z'.repeat(150)} → still fine`, '--global').code, 0);
	assert.match(readFileSync(file, 'utf8'), /^42\. filler lesson number 39/m);
});

test('learn --edit rewrites in place, --remove renumbers, and both keep the rules', () => {
	const file = join(project, 'docs', 'state', 'learnings.md');
	const lessons = () =>
		readFileSync(file, 'utf8')
			.split('\n')
			.filter((l) => /^\d+\. /.test(l));
	const before = lessons();

	const edited = wf('learn', '--edit', '1', 'state after push → state first, then commit');
	assert.equal(edited.code, 0, edited.err);
	assert.match(edited.out, /^\+ 1\. state after push → state first, then commit$/m);
	assert.equal(lessons().length, before.length);

	const removed = wf('learn', '--remove', '2');
	assert.equal(removed.code, 0, removed.err);
	const after = lessons();
	assert.equal(after.length, before.length - 1);
	assert.equal(after[1], before[2].replace(/^3\./, '2.'));
	assert.deepEqual(
		after.map((l) => Number(l.split('.')[0])),
		after.map((_, i) => i + 1)
	);

	assert.match(wf('learn', '--remove', '999').err, /no learning 999; there are \d+/);
	assert.match(wf('learn', '--edit', 'x', 'a → b').err, /a learning number is a positive integer/);
	assert.match(wf('learn', '--edit', '1', 'no arrow').err, /what went wrong → what to do instead/);
	assert.equal(wf('learn', '--edit', '1', '--remove', '2').code, 2);

	// Growing one by an edit, and a long handoff, are never refused for size.
	assert.equal(wf('learn', '--edit', '1', `${'z'.repeat(190)} → y`).code, 0);
	const long = wf('handoff', '--next', 'n'.repeat(3000), '--verify', 'v', '--dont', 'd');
	assert.equal(long.code, 0, long.err);
	assert.match(long.err, /warning: this project's session context/);
});

test('steers and assumptions are recorded as summaries and listed by wf show', () => {
	const r = wf(
		'steer',
		'export must not need the network',
		'--why',
		'changes the architecture of 0.2',
		'--affects',
		'0.2',
		'--changed',
		'0.2 proof now runs offline',
		'--log',
		'true'
	);
	assert.equal(r.code, 0, r.err);
	assert.match(r.out, /^\+ Steer: export must not need the network$/m);
	assert.match(r.out, /^\+ Changed: 0\.2 proof now runs offline$/m);
	const a = wf('assume', 'kept JSON over SQLite', '--why', 'most reversible', '--affects', '0');
	assert.equal(a.code, 0, a.err);
	const shown = wf('show', '0.2').out;
	assert.match(shown, /Steers:\n- \d{4}-\d{2}-\d{2} steer: export must not need the network/);
	assert.match(shown, /assumption: kept JSON over SQLite/);
	assert.match(
		wf('steer', 'x', '--why', 'y', '--affects', '9.9', '--changed', 'z', '--log', 'true').err,
		/no major 9/
	);
	assert.match(
		wf('steer', 'x', '--why', 'y', '--affects', '0', '--log', 'true').err,
		/say what changed/
	);
	assert.equal(wf('steer', 'x', '--why', 'y', '--affects', '0').code, 2);
	assert.match(wf('steer', 'chatter', '--log', 'false').out, /not logged/);
	// wf show stays bounded: the five newest steers, then a pointer to the rest.
	for (let i = 1; i <= 5; i++)
		wf('steer', `later ${i}`, '--why', 'y', '--affects', '0.2', '--changed', 'z', '--log', 'true');
	const bounded = wf('show', '0.2').out;
	assert.match(bounded, /steer: later 5/);
	assert.doesNotMatch(bounded, /export must not need the network/);
	assert.match(bounded, /\(2 older: wf find/);
});

test('risk needs every field, names the missing ones, and logs the entry', () => {
	const missing = wf(
		'risk',
		'--item',
		'0.2',
		'--action',
		'rm old.json',
		'--why',
		'replaced',
		'--level',
		'low',
		'--surface',
		'one file'
	);
	assert.equal(missing.code, 1);
	assert.match(missing.err, /missing --recover; the action must not run/);
	assert.match(wf('risk').err, /missing --item, --action, --why, --level, --surface, --recover/);
	assert.match(
		wf(
			'risk',
			'--item',
			'0.2',
			'--action',
			'a',
			'--why',
			'b',
			'--level',
			'huge',
			'--surface',
			'c',
			'--recover',
			'd'
		).err,
		/--level is one of low, medium, high/
	);
	const ok = wf(
		'risk',
		'--item',
		'0.2',
		'--action',
		'rm old.json',
		'--why',
		'replaced by notes.json',
		'--level',
		'low',
		'--surface',
		'one file',
		'--recover',
		'git checkout old.json'
	);
	assert.equal(ok.code, 0, ok.err);
	assert.match(ok.out, /^\+ ## \d{4}-\d{2}-\d{2} · 0\.2 · low$/m);
	assert.match(ok.out, /^\+ Recover: git checkout old\.json$/m);
	assert.match(ok.out, /the action may run now/);
});

test('memory sections keep their shape; find and get read the state', () => {
	assert.match(
		wf('memory', 'invariants', 'only wf writes state').out,
		/^\+ 1\. only wf writes state$/m
	);
	assert.match(
		wf('memory', 'invariants', 'one core holds the rules').out,
		/^\+ 2\. one core holds the rules$/m
	);
	assert.match(
		wf('memory', 'pitfalls', 'globs miss dotfiles; cause: default options').out,
		/^\+ - \d{4}-\d{2}-\d{2}: globs miss dotfiles/m
	);
	assert.match(
		wf('memory', 'contracts', 'todo.md stays canonical').out,
		/^\+ - todo\.md stays canonical$/m
	);
	assert.match(
		wf('memory', 'anti-patterns', 'a kind field on items').out,
		/^\+ 1\. a kind field on items$/m
	);
	assert.match(wf('memory', 'deferred', 'x').err, /memory section is one of/);
	const memory = readFileSync(join(project, 'docs', 'state', 'memory.md'), 'utf8');
	assert.match(
		memory,
		/## Invariants\n\n1\. only wf writes state\n2\. one core holds the rules\n\n## Contracts/
	);

	assert.match(
		wf('find', 'NETWORK').out,
		/^steers\.md:\d+: Steer: export must not need the network$/m
	);
	const hits = wf('find', '0.2').out;
	assert.match(hits, /^steers\.md:\d+: ## \d{4}-\d{2}-\d{2} · affects 0\.2$/m);
	assert.match(hits, /^todo\.md:\d+: - \[.\] 0\.2 write$/m);
	assert.equal(wf('find', 'zzz-nothing').out.trim(), 'no matches');

	assert.equal(
		wf('get', 'memory', 'Invariants').out.trimEnd(),
		'## Invariants\n\n1. only wf writes state\n2. one core holds the rules'
	);
	assert.match(wf('get', 'handoff.md').out, /^# Handoff\nState: /);
	assert.match(wf('get', 'memory', 'Nope').err, /has no "## Nope" section/);
});

test('env set writes keys without ever printing values; keys lists names only', () => {
	const env = join(project, '.env');
	assert.match(wf('env', 'set', 'API_KEY', 'sekret-1').err, /not listed in \.gitignore/);
	writeFileSync(join(project, '.gitignore'), '.env\n');
	const added = wf('env', 'set', 'API_KEY', 'sekret-1');
	assert.equal(added.code, 0, added.err);
	assert.equal(added.out.trim(), 'added API_KEY in .env');
	const updated = wf('env', 'set', 'API_KEY', 'sekret 2');
	assert.equal(updated.out.trim(), 'updated API_KEY in .env');
	wf('env', 'set', 'DB_URL', 'postgres://x');
	assert.equal(readFileSync(env, 'utf8'), 'API_KEY="sekret 2"\nDB_URL=postgres://x\n');
	const keys = wf('env', 'keys');
	assert.equal(keys.out.trim(), 'API_KEY\nDB_URL');
	for (const r of [added, updated, keys]) assert.doesNotMatch(r.out + r.err, /sekret|postgres/);
	assert.match(wf('env', 'set', 'bad-key', 'x').err, /not a valid env key/);
	assert.equal(wf('env', 'show').code, 2);
});

test('defer adds to the Deferred table, checks the id, and shows up in wf show', () => {
	const r = wf('defer', 'retry on network errors | backoff', '--resolves', '0.2');
	assert.equal(r.code, 0, r.err);
	assert.match(r.out, /^\+ \| retry on network errors \\\| backoff \| 0\.2 \|$/m);
	assert.match(
		readFileSync(join(project, 'docs', 'state', 'memory.md'), 'utf8'),
		/\|---\|---\|\n\| retry on network errors/
	);
	assert.match(wf('defer', 'x', '--resolves', '7.1').err, /no major 7/);
	assert.match(
		wf('show', '0.2').out,
		/Deferred to it:\n- retry on network errors \| backoff \(0\.2\)/
	);
	assert.match(wf('show', '0').out, /Deferred to it:/);
});

test('commands outside a project explain what to do', () => {
	// Everything under scratch/ sits inside this repo, so run from / (read-only) instead.
	const r = spawnSync(process.execPath, [cli, 'status'], { cwd: '/', encoding: 'utf8' });
	assert.match(r.stderr, /run wf init in the project/);
});

test('inside Claude Code, wf writes only the project its session started in', () => {
	const other = join(tmp, 'other');
	mkdirSync(other);
	assert.equal(run(other, {}, 'init').code, 0);
	writeFileSync(join(home, 'local', 'sessions.json'), JSON.stringify({ s1: project }));
	const agent = { CLAUDECODE: '1', CLAUDE_CODE_SESSION_ID: 's1' };

	const own = run(project, agent, 'learn', 'own lesson → fine');
	assert.equal(own.code, 0, own.err);
	const otherLearnings = readFileSync(join(other, 'docs', 'state', 'learnings.md'), 'utf8');
	for (const args of [
		['learn', 'cross lesson → refused'],
		['add', 'major', 'x', '--deliverable', 'y'],
		['handoff', '--next', 'n', '--verify', 'v', '--dont', 'd'],
		['state', 'discuss']
	]) {
		const r = run(other, agent, ...args);
		assert.equal(r.code, 1, args.join(' '));
		assert.match(r.err, /never writes another project/, args.join(' '));
	}
	assert.equal(readFileSync(join(other, 'docs', 'state', 'learnings.md'), 'utf8'), otherLearnings);
	// Reading another project, and the shared global learnings, stay open.
	assert.equal(run(other, agent, 'status').code, 0);
	assert.equal(run(other, agent, 'learn', 'shared lesson → fine', '--global').code, 0);

	const fresh = join(tmp, 'fresh');
	mkdirSync(fresh);
	assert.match(run(fresh, agent, 'init').err, /never writes another project/);
	const unknown = run(
		project,
		{ CLAUDECODE: '1', CLAUDE_CODE_SESSION_ID: 'nope' },
		'learn',
		'a → b'
	);
	assert.match(unknown.err, /unknown to wf/);
});

test("each limit has the owner's warn and refuse thresholds, and -1 turns either off", () => {
	const settingsFile = join(home, 'local', 'wf-settings.json');
	const set = (s: object) => writeFileSync(settingsFile, JSON.stringify(s));
	const learnings = join(project, 'docs', 'state', 'learnings.md');
	const handoffArgs = (opens: number) => [
		'handoff',
		'--next',
		'n',
		'--verify',
		'v',
		'--dont',
		'd',
		...Array.from({ length: opens }, (_, i) => ['--open', `q${i}`]).flat()
	];

	// Warn at 30, refuse at 60: a 45-character learning warns, a longer one is refused untouched.
	set({ learningChars: { warn: 30, refuse: 60 } });
	const middle = wf('learn', 'a lesson of forty-five characters → it warns');
	assert.equal(middle.code, 0, middle.err);
	assert.match(
		middle.err,
		/warning: this learning in characters is \d+, over the owner's warn limit of 30/
	);
	const kept = readFileSync(learnings, 'utf8');
	const refused = wf('learn', 'a lesson that runs well past the sixty character line → refused');
	assert.equal(refused.code, 1);
	assert.match(refused.err, /over the owner's refuse limit of 60/);
	assert.equal(readFileSync(learnings, 'utf8'), kept);
	set({ learningChars: { warn: -1, refuse: -1 } });
	const off = wf('learn', 'a lesson that runs well past the sixty character line → both off');
	assert.equal(off.code, 0, off.err);
	assert.doesNotMatch(off.err, /this learning in characters/);

	// The context limit refuses for this project only, and a refused write is rolled back.
	set({ contextChars: { warn: -1, refuse: 100 } });
	const before = readFileSync(learnings, 'utf8');
	assert.match(wf('learn', 'one more → refused by context').err, /session context.*refuse limit/);
	assert.equal(readFileSync(learnings, 'utf8'), before);
	assert.equal(wf('learn', '--remove', '1').code, 0, 'a prune is never refused');

	set({ handoffLines: { warn: -1, refuse: 8 } });
	assert.match(
		wf(...handoffArgs(4)).err,
		/the handoff in lines is 10, over the owner's refuse limit of 8/
	);
	set({ handoffLines: { warn: 8, refuse: -1 } });
	const warned = wf(...handoffArgs(4));
	assert.equal(warned.code, 0, warned.err);
	assert.match(warned.err, /warning: the handoff in lines is 10, over the owner's warn limit of 8/);

	set({ titleChars: 3, listedItems: 1 });
	assert.match(wf('show', '0').out, /^\[x\] 0\.1 pa…$/m);
	set({ titleChars: -1, listedItems: -1 });
	assert.doesNotMatch(wf('status').out, /…|also /);
	set({ learningChars: { warn: 50, refuse: 40 } });
	assert.match(wf('status').err, /learningChars refuse must be above its warn/);
	set({ titleChars: 0 });
	assert.match(wf('status').err, /titleChars must be a whole number of at least 1, or -1 for off/);
	rmSync(settingsFile);
});
