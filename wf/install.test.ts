import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readlinkSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = fileURLToPath(new URL('..', import.meta.url));
const cli = fileURLToPath(new URL('cli.ts', import.meta.url));
let tmp = '';
let home = '';

before(() => {
	mkdirSync(join(repo, 'scratch', 'temp'), { recursive: true });
	tmp = mkdtempSync(join(repo, 'scratch', 'temp', 'install-test-'));
	home = join(tmp, 'home');
	mkdirSync(join(home, '.claude'), { recursive: true });
	writeFileSync(
		join(home, '.claude', 'settings.json'),
		JSON.stringify({
			model: 'opus',
			hooks: { Stop: [{ hooks: [{ type: 'command', command: 'x' }] }] }
		})
	);
});

after(() => rmSync(tmp, { recursive: true }));

// A fake HOME inside scratch/temp, and no CLAUDECODE, as when the owner runs it in a terminal.
function install(env: Record<string, string> = {}) {
	const base = Object.fromEntries(Object.entries(process.env).filter(([k]) => k !== 'CLAUDECODE'));
	return spawnSync(process.execPath, [cli, 'install'], {
		env: { ...base, HOME: home, ...env },
		encoding: 'utf8'
	});
}

const settings = () => JSON.parse(readFileSync(join(home, '.claude', 'settings.json'), 'utf8'));

test('install links wf and CLAUDE.md and registers both hooks, keeping existing settings', () => {
	const r = install();
	assert.equal(r.status, 0, r.stderr);
	assert.equal(readlinkSync(join(home, '.local', 'bin', 'wf')), cli);
	assert.equal(readlinkSync(join(home, '.claude', 'CLAUDE.md')), join(repo, 'global', 'CLAUDE.md'));
	const s = settings();
	assert.equal(s.model, 'opus');
	assert.equal(s.hooks.Stop.length, 1);
	assert.equal(s.hooks.SessionStart[0].matcher, 'startup|resume|clear|compact');
	assert.equal(s.hooks.SessionStart[0].hooks[0].command, `${cli} hook session-start`);
	assert.equal(s.hooks.PreToolUse[0].matcher, 'Edit|MultiEdit|Write|NotebookEdit|Bash');
	assert.equal(s.hooks.PreToolUse[0].hooks[0].command, `${cli} hook pre-tool-use`);
	assert.equal(s.hooks.UserPromptSubmit[0].matcher, undefined);
	assert.equal(s.hooks.UserPromptSubmit[0].hooks[0].command, `${cli} hook user-prompt-submit`);
});

test('install updates the matcher of a hook it already registered', () => {
	const path = join(home, '.claude', 'settings.json');
	const s = settings();
	s.hooks.PreToolUse[0].matcher = 'Edit|Write';
	writeFileSync(path, JSON.stringify(s));
	const r = install();
	assert.match(r.stdout, /updated the PreToolUse hook's matcher/);
	assert.equal(settings().hooks.PreToolUse.length, 1);
	assert.equal(settings().hooks.PreToolUse[0].matcher, 'Edit|MultiEdit|Write|NotebookEdit|Bash');
});

test('install is idempotent', () => {
	const r = install();
	assert.equal(r.stdout.trim(), 'already installed');
	assert.equal(settings().hooks.SessionStart.length, 1);
});

test('install refuses inside Claude Code', () => {
	const r = install({ CLAUDECODE: '1' });
	assert.equal(r.status, 1);
	assert.match(r.stderr, /the owner runs it in a terminal/);
});

test('install refuses to replace a different wf on PATH', () => {
	const other = join(tmp, 'home2');
	mkdirSync(join(other, '.local', 'bin'), { recursive: true });
	writeFileSync(join(other, '.local', 'bin', 'wf'), 'something else');
	const r = install({ HOME: other });
	assert.equal(r.status, 1);
	assert.match(r.stderr, /exists and isn't a link/);
});

test('install refuses to replace an existing CLAUDE.md', () => {
	const other = join(tmp, 'home3');
	mkdirSync(join(other, '.claude'), { recursive: true });
	writeFileSync(join(other, '.claude', 'CLAUDE.md'), 'my own rules');
	const r = install({ HOME: other });
	assert.equal(r.status, 1);
	assert.match(r.stderr, /CLAUDE\.md exists and isn't a link/);
	assert.equal(readFileSync(join(other, '.claude', 'CLAUDE.md'), 'utf8'), 'my own rules');
});
