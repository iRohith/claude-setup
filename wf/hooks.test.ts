import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = fileURLToPath(new URL('..', import.meta.url));
const cli = fileURLToPath(new URL('cli.ts', import.meta.url));
let tmp = '';
let project = '';
let home = '';

before(() => {
	mkdirSync(join(repo, 'scratch', 'temp'), { recursive: true });
	tmp = mkdtempSync(join(repo, 'scratch', 'temp', 'hooks-test-'));
	project = join(tmp, 'project');
	home = join(tmp, 'home');
	mkdirSync(project);
	mkdirSync(join(home, 'global'), { recursive: true });
	writeFileSync(
		join(home, 'global', 'learnings.md'),
		'# Learnings\n\n1. a global lesson → do this\n'
	);
	spawnSync(process.execPath, [cli, 'init'], {
		cwd: project,
		env: { ...process.env, WF_HOME: home }
	});
	writeFileSync(
		join(project, 'docs', 'state', 'learnings.md'),
		'# Learnings\n\n1. a project lesson → do that\n'
	);
});

after(() => rmSync(tmp, { recursive: true }));

function hook(event: string, input: object, cwd = project) {
	const r = spawnSync(process.execPath, [cli, 'hook', event], {
		cwd,
		input: JSON.stringify(input),
		env: { ...process.env, WF_HOME: home },
		encoding: 'utf8'
	});
	assert.equal(r.status, 0, r.stderr);
	return r.stdout ? JSON.parse(r.stdout) : undefined;
}

test('session start injects global learnings, project learnings and the handoff', () => {
	const out = hook('session-start', {
		hook_event_name: 'SessionStart',
		source: 'startup',
		cwd: project
	});
	assert.equal(out.hookSpecificOutput.hookEventName, 'SessionStart');
	const ctx: string = out.hookSpecificOutput.additionalContext;
	assert.match(ctx, /Global learnings \(from wf\):\n1\. a global lesson/);
	assert.match(ctx, /Project learnings for .* \(from wf\):\n1\. a project lesson/);
	assert.match(ctx, /Project handoff \(from wf\):\nState: setup/);
});

test('outside a project, session start injects global learnings only', () => {
	const out = hook('session-start', { source: 'compact', cwd: '/' }, '/');
	const ctx: string = out.hookSpecificOutput.additionalContext;
	assert.match(ctx, /a global lesson/);
	assert.doesNotMatch(ctx, /handoff/i);
});

test('edits to wf-owned state files are denied with the alternative', () => {
	for (const [tool, file] of [
		['Edit', 'todo.md'],
		['Write', 'handoff.md'],
		['MultiEdit', 'todo.md']
	]) {
		const out = hook('pre-tool-use', {
			hook_event_name: 'PreToolUse',
			tool_name: tool,
			tool_input: { file_path: join(project, 'docs', 'state', file) },
			cwd: project
		});
		assert.equal(out.hookSpecificOutput.permissionDecision, 'deny', `${tool} ${file}`);
		assert.match(out.hookSpecificOutput.permissionDecisionReason, /only through wf\. Use wf add/);
	}
});

test('relative paths are resolved against the hook cwd', () => {
	const out = hook('pre-tool-use', {
		tool_name: 'Edit',
		tool_input: { file_path: 'docs/state/todo.md' },
		cwd: project
	});
	assert.equal(out.hookSpecificOutput.permissionDecision, 'deny');
});

test('other files, other tools and state files without wf commands yet pass silently', () => {
	const cases = [
		{ tool_name: 'Edit', tool_input: { file_path: join(project, 'src', 'app.ts') } },
		{ tool_name: 'Write', tool_input: { file_path: join(project, 'docs', 'state', 'steers.md') } },
		{ tool_name: 'Read', tool_input: { file_path: join(project, 'docs', 'state', 'todo.md') } },
		{ tool_name: 'Bash', tool_input: { command: 'ls' } }
	];
	for (const input of cases)
		assert.equal(hook('pre-tool-use', { ...input, cwd: project }), undefined);
});
