import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = fileURLToPath(new URL('..', import.meta.url));
const cli = fileURLToPath(new URL('cli.ts', import.meta.url));
let tmp = '';
let project = '';

const run = (cmd: string, args: string[]) =>
	spawnSync(cmd, args, {
		cwd: project,
		encoding: 'utf8',
		env: { ...process.env, WF_HOME: join(tmp, 'home') }
	});
const git = (...args: string[]) => run('git', args);
const wf = (...args: string[]) => run(process.execPath, [cli, ...args]);
const commit = (file: string, text: string, subject: string) => {
	writeFileSync(join(project, file), text);
	git('add', file);
	return git('commit', '-q', '-m', subject);
};

before(() => {
	mkdirSync(join(repo, 'scratch', 'temp'), { recursive: true });
	tmp = mkdtempSync(join(repo, 'scratch', 'temp', 'githooks-test-'));
	project = join(tmp, 'project');
	mkdirSync(project);
	spawnSync('git', ['init', '-q', '--bare', join(tmp, 'origin.git')]);
	git('init', '-q', '-b', 'work');
	git('config', 'user.name', 'Testy McTestface');
	git('config', 'user.email', 'test@example.invalid');
	git('remote', 'add', 'origin', join(tmp, 'origin.git'));
	wf('init');
	writeFileSync(join(project, '.gitignore'), 'scratch/temp/\n*.flag\n');
});

after(() => rmSync(tmp, { recursive: true }));

test('checks set writes a pre-commit hook and points git at it', () => {
	const r = wf('checks', 'set', "sed -i 's/ugly/pretty/' a.txt", 'test -f ok.flag');
	assert.equal(r.status, 0, r.stderr);
	assert.equal(git('config', 'core.hooksPath').stdout.trim(), '.githooks');
});

test('a failing check stops the commit', () => {
	assert.notEqual(commit('a.txt', 'ugly\n', '0.1.1 first').status, 0);
});

test('a passing run commits, with a check rewrite staged again', () => {
	writeFileSync(join(project, 'ok.flag'), '');
	git('add', '.gitignore', 'docs');
	const r = commit('a.txt', 'ugly\n', '0.1.1 first');
	assert.equal(r.status, 0, r.stderr);
	assert.equal(git('show', 'HEAD:a.txt').stdout, 'pretty\n');
});

test('gitleaks blocks the git config email', () => {
	const r = commit('b.txt', 'mail test@example.invalid\n', '0.1.2 leak');
	assert.notEqual(r.status, 0);
	assert.match(r.stdout + r.stderr, /leaks found/);
	git('reset', '-q', 'b.txt');
});

test('pre-push runs the commands only for majors, and a failure blocks the push', () => {
	assert.equal(wf('push', 'set', 'touch pushed.flag').status, 0);
	assert.equal(git('push', '-q', '-u', 'origin', 'work').status, 0);
	assert.ok(!existsSync(join(project, 'pushed.flag')), 'a minor push ran the commands');
	assert.equal(commit('c.txt', 'major\n', '1 done').status, 0);
	assert.equal(git('push', '-q').status, 0);
	assert.ok(existsSync(join(project, 'pushed.flag')), 'a major push skipped the commands');
	wf('push', 'set', 'false');
	assert.equal(commit('d.txt', 'next\n', '2 next').status, 0);
	assert.notEqual(git('push', '-q').status, 0);
});

test('push set with no commands removes the hook', () => {
	assert.match(wf('push', 'set').stdout, /no pre-push hook/);
	assert.ok(!existsSync(join(project, '.githooks', 'pre-push')));
	assert.equal(git('push', '-q').status, 0);
});
