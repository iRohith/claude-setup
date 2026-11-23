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
// As the owner in a terminal: no Claude Code session in the environment.
const terminal = Object.fromEntries(
	Object.entries(process.env).filter(([k]) => k !== 'CLAUDECODE' && k !== 'CLAUDE_CODE_SESSION_ID')
);

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
		env: { ...terminal, WF_HOME: home }
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
		env: { ...terminal, WF_HOME: home },
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
	assert.match(ctx, /Instructions for the setup state \(from wf\):\nThe project is in setup/);
	assert.doesNotMatch(ctx, /The project is in build/);
	assert.match(ctx, /after every compaction: run `wf status` and `wf get intent`/);
});

test('after wf state, the next session starts with the new state instructions', () => {
	spawnSync(process.execPath, [cli, 'state', 'build'], {
		cwd: project,
		env: { ...terminal, WF_HOME: home }
	});
	const ctx: string = hook('session-start', { source: 'startup', cwd: project }).hookSpecificOutput
		.additionalContext;
	assert.match(ctx, /Instructions for the build state \(from wf\):\nThe project is in build/);
	assert.match(ctx, /State: build/);
	spawnSync(process.execPath, [cli, 'state', 'setup'], {
		cwd: project,
		env: { ...terminal, WF_HOME: home }
	});
});

const wfIn = (...args: string[]) =>
	spawnSync(process.execPath, [cli, ...args], {
		cwd: project,
		env: { ...terminal, WF_HOME: home }
	});
const edit = (tool: string, file: string) =>
	hook('pre-tool-use', { tool_name: tool, tool_input: { file_path: file }, cwd: project });
const bash = (command: string) =>
	hook('pre-tool-use', { tool_name: 'Bash', tool_input: { command }, cwd: project });

test('in discuss, project files are denied; state files and scratch/temp stay writable', () => {
	wfIn('state', 'discuss');
	const denied = edit('Edit', join(project, 'src', 'app.ts'));
	assert.equal(denied.hookSpecificOutput.permissionDecision, 'deny');
	assert.match(denied.hookSpecificOutput.permissionDecisionReason, /project is in discuss/);
	assert.equal(edit('Write', join(project, 'scratch', 'temp', 'plan.md')), undefined);
	assert.equal(edit('Write', join(project, 'docs', 'state', 'notes.md')), undefined);
	wfIn('state', 'build');
	assert.equal(edit('Edit', join(project, 'src', 'app.ts')), undefined);
	wfIn('state', 'setup');
});

test('in setup, git push is denied until the owner writes "setup done"', () => {
	for (const command of ['git push', 'git -C . push -u origin work', 'git push --force-with-lease'])
		assert.equal(bash(command).hookSpecificOutput.permissionDecision, 'deny', command);
	assert.equal(bash('git status'), undefined);
	assert.equal(hook('user-prompt-submit', { prompt: 'looks good', cwd: project }), undefined);
	const recorded = hook('user-prompt-submit', { prompt: 'Setup done.', cwd: project });
	assert.match(
		recorded.hookSpecificOutput.additionalContext,
		/recorded that the owner wrote "setup done"/
	);
	assert.equal(bash('git push -u origin work'), undefined);
});

test('"setup done" outside setup records nothing', () => {
	wfIn('state', 'build');
	assert.equal(hook('user-prompt-submit', { prompt: 'setup done', cwd: project }), undefined);
	wfIn('state', 'setup');
});

// As the owner in a terminal: no CLAUDECODE in the environment.
const asOwner = (...args: string[]) => {
	const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => k !== 'CLAUDECODE'));
	return spawnSync(process.execPath, [cli, ...args], {
		cwd: project,
		env: { ...env, WF_HOME: home }
	});
};

test('admin mode is guarded from the model and lifts every denial when the owner turns it on', () => {
	for (const command of [
		'wf admin on',
		'node wf/cli.ts admin on',
		'cat local/projects.json',
		"curl -X POST 'http://localhost:5199/projects/x?/admin'",
		"sed -i 's/refuse/off/' local/wf-settings.json",
		"curl -X POST 'http://wf.localhost/settings?/settings'"
	])
		assert.match(
			bash(command).hookSpecificOutput.permissionDecisionReason,
			/Admin mode, wf.s settings and its session store belong to the owner alone/,
			command
		);
	assert.equal(bash('wf help admin'), undefined);
	// A record that only mentions a store is fine; a chain that reaches it is not.
	assert.equal(bash('wf impl 4.8 "settings live in local/wf-settings.json"'), undefined);
	assert.ok(bash('wf status; cat local/wf-settings.json').hookSpecificOutput);
	for (const file of ['projects.json', 'wf-settings.json'])
		assert.match(
			edit('Write', join(home, 'local', file)).hookSpecificOutput.permissionDecisionReason,
			/Admin mode, wf.s settings and its session store belong to the owner alone/,
			file
		);

	assert.equal(asOwner('admin', 'on').status, 0);
	wfIn('state', 'discuss');
	assert.equal(edit('Edit', join(project, 'docs', 'state', 'todo.md')), undefined);
	assert.equal(edit('Edit', join(project, 'src', 'app.ts')), undefined);
	assert.equal(bash('wf admin off'), undefined);
	const ctx: string = hook('session-start', { cwd: project }).hookSpecificOutput.additionalContext;
	assert.match(ctx, /Admin mode is on for this project/);

	assert.equal(asOwner('admin', 'off').status, 0);
	assert.equal(
		edit('Edit', join(project, 'src', 'app.ts')).hookSpecificOutput.permissionDecision,
		'deny'
	);
	wfIn('state', 'setup');
});

test("a session never edits another registered project's files, even by absolute path", () => {
	const other = join(tmp, 'other');
	mkdirSync(other);
	spawnSync(process.execPath, [cli, 'init'], { cwd: other, env: { ...terminal, WF_HOME: home } });
	hook('session-start', { session_id: 'h1', source: 'startup', cwd: project });
	for (const tool of ['Edit', 'Write']) {
		// Even when the shell has moved into the other project, the session stays the start project's.
		const out = hook('pre-tool-use', {
			session_id: 'h1',
			tool_name: tool,
			tool_input: { file_path: join(other, 'docs', 'state', 'learnings.md') },
			cwd: other
		});
		assert.match(out.hookSpecificOutput.permissionDecisionReason, /is another project/, tool);
	}
	assert.equal(edit('Write', join(project, 'src', 'own.ts')), undefined);
});

test('linked projects are read-only and claude -p is never run', () => {
	const linked = edit('Write', join(project, 'scratch', 'links', 'engine', 'src', 'x.ts'));
	assert.match(
		linked.hookSpecificOutput.permissionDecisionReason,
		/never write into another project/
	);
	for (const command of [
		'claude -p "summarise"',
		'claude --print hi',
		'npx claude -p x',
		'/usr/bin/claude --model opus -p x',
		'cd src; claude -p y',
		'wf learn "x → y"; claude -p z',
		'wf learn "$(claude -p z)"',
		'wf status\nclaude -p z',
		'wf learn "a; b" && claude -p z'
	])
		assert.match(
			bash(command).hookSpecificOutput.permissionDecisionReason,
			/never allowed/,
			command
		);
	for (const command of [
		'claude --version',
		'mkdir -p .claude/worktrees',
		'git -C .claude/worktrees/agent-a log -p',
		'cargo test -p ck --manifest-path ~/.claude/x/Cargo.toml',
		'claude --version; mkdir -p x',
		'wf learn "the claude -p rule fired on paths; all false → test lookalikes"',
		"wf handoff --dont 'claude -p; ever'",
		`wf handoff --verify "ITEM=\\<id> runs" --open "the owner's check: ask it to run claude -p"`,
		`wf learn "Wrote the claude -p denial as a loose regex; all 15 of its denials in cuda-kernels were false (.claude/ paths, other tools' -p) → test each deny pattern against lookalikes"`
	])
		assert.equal(bash(command), undefined, command);
	assert.equal(bash('ls scratch/links/engine'), undefined);
	const outside = hook(
		'pre-tool-use',
		{ tool_name: 'Bash', tool_input: { command: 'claude -p x' }, cwd: '/' },
		'/'
	);
	assert.equal(outside.hookSpecificOutput.permissionDecision, 'deny');
});

test('learnings are written only through wf learn and show up after a compaction', () => {
	const projectFile = edit('Edit', join(project, 'docs', 'state', 'learnings.md'));
	assert.match(projectFile.hookSpecificOutput.permissionDecisionReason, /Use wf learn instead/);
	const globalFile = edit('Write', join(home, 'global', 'learnings.md'));
	assert.match(
		globalFile.hookSpecificOutput.permissionDecisionReason,
		/Use wf learn --global instead/
	);
	wfIn('learn', 'compaction test → it stays in context');
	const ctx: string = hook('session-start', { source: 'compact', cwd: project }).hookSpecificOutput
		.additionalContext;
	assert.match(ctx, /compaction test → it stays in context/);
});

test('.env is never read, printed or edited; .env.example, .env.local and wf env are fine', () => {
	const env = join(project, '.env');
	for (const tool of ['Read', 'Edit', 'Write'])
		assert.match(
			edit(tool, env).hookSpecificOutput.permissionDecisionReason,
			/never read, print or edit it/,
			tool
		);
	for (const command of ['cat .env', 'grep KEY .env', 'source ./.env', 'cp .env /x', 'less < .env'])
		assert.equal(bash(command).hookSpecificOutput.permissionDecision, 'deny', command);
	for (const command of [
		'cat .env.example',
		'cat .env.local',
		'wf env keys',
		'wf env set A b',
		'pnpm dev',
		'ls -a'
	])
		assert.equal(bash(command), undefined, command);
	assert.equal(edit('Read', join(project, '.env.example')), undefined);
	assert.equal(edit('Edit', join(project, '.env.local')), undefined);
});

test('wf admin refuses inside Claude Code', () => {
	const r = spawnSync(process.execPath, [cli, 'admin', 'on'], {
		cwd: project,
		env: { ...process.env, WF_HOME: home, CLAUDECODE: '1' },
		encoding: 'utf8'
	});
	assert.equal(r.status, 1);
	assert.match(r.stderr, /admin mode belongs to the owner/);
});

test('outside a project, session start injects global learnings only', () => {
	const out = hook('session-start', { source: 'compact', cwd: '/' }, '/');
	const ctx: string = out.hookSpecificOutput.additionalContext;
	assert.match(ctx, /a global lesson/);
	assert.doesNotMatch(ctx, /handoff/i);
});

test('edits to wf-owned state files are denied with the alternative', () => {
	for (const [tool, file, alternative] of [
		['Edit', 'todo.md', 'wf add, edit, batch'],
		['MultiEdit', 'todo.md', 'wf add, edit, batch'],
		['Write', 'handoff.md', 'wf handoff'],
		['Edit', 'implementation.md', 'wf doc implementation'],
		['Write', 'spec.md', 'wf doc spec'],
		['Edit', 'steers.md', 'wf steer or wf assume'],
		['Edit', 'risks.md', 'wf risk'],
		['Edit', 'memory.md', 'wf memory']
	]) {
		const out = hook('pre-tool-use', {
			hook_event_name: 'PreToolUse',
			tool_name: tool,
			tool_input: { file_path: join(project, 'docs', 'state', file) },
			cwd: project
		});
		assert.equal(out.hookSpecificOutput.permissionDecision, 'deny', `${tool} ${file}`);
		assert.match(
			out.hookSpecificOutput.permissionDecisionReason,
			new RegExp(
				`only through wf\\. This is a fixed rule, so retrying the edit will be denied again\\. Use ${alternative}`
			)
		);
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
		{ tool_name: 'Write', tool_input: { file_path: join(project, 'docs', 'state', 'notes.md') } },
		{ tool_name: 'Read', tool_input: { file_path: join(project, 'docs', 'state', 'todo.md') } },
		{ tool_name: 'Bash', tool_input: { command: 'ls' } }
	];
	for (const input of cases)
		assert.equal(hook('pre-tool-use', { ...input, cwd: project }), undefined);
});
