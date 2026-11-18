import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { HELP } from './help.ts';

const cli = fileURLToPath(new URL('cli.ts', import.meta.url));
// From / so no project is found: help must work anywhere.
const wf = (...args: string[]) =>
	spawnSync(process.execPath, [cli, ...args], { cwd: '/', encoding: 'utf8' });

test('a bare wf, wf help and wf --help print the overview with every command', () => {
	for (const args of [[], ['help'], ['--help'], ['-h']]) {
		const r = wf(...args);
		assert.equal(r.status, 0, `${args.join(' ')}: ${r.stderr}`);
		assert.match(r.stdout, /only way to change it/);
		for (const name of Object.keys(HELP)) assert.match(r.stdout, new RegExp(`^  ${name} `, 'm'));
	}
});

test('every command has help with its usage, both as wf help <cmd> and <cmd> --help', () => {
	for (const [name, h] of Object.entries(HELP)) {
		for (const args of [
			['help', name],
			[name, '--help']
		]) {
			const r = wf(...args);
			assert.equal(r.status, 0, `${args.join(' ')}: ${r.stderr}`);
			assert.match(r.stdout, new RegExp(`^${name}: `));
			for (const u of h.usage) assert.ok(r.stdout.includes(u), `${name} usage: ${u}`);
		}
	}
});

test('help states the rules a command enforces', () => {
	assert.match(wf('help', 'start').stdout, /Only one major may have minors in progress/);
	assert.match(wf('add', '--help').stdout, /Ids are assigned/);
	assert.match(wf('help', 'done').stdout, /verify the proof, run the pre-commit checks/);
});

test('usage mistakes exit 2 with the relevant help', () => {
	const unknown = wf('frobnicate');
	assert.equal(unknown.status, 2);
	assert.match(unknown.stderr, /unknown command frobnicate/);
	assert.match(unknown.stderr, /wf help <command>/);
	const missing = wf('show');
	assert.equal(missing.status, 2);
	assert.match(missing.stderr, /missing <id>[\s\S]*show: one item/);
	assert.equal(wf('help', 'nope').status, 2);
});
