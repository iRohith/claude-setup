// Claude Code hook entry points: read the hook JSON, ask the core, print the hook JSON.
import { existsSync, readFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import * as wf from './core.ts';

interface HookInput {
	cwd?: string;
	tool_name?: string;
	tool_input?: { file_path?: unknown; notebook_path?: unknown };
}

const EDIT_TOOLS = ['Edit', 'MultiEdit', 'Write', 'NotebookEdit'];

export function runHook(event: string, stdin: string): string {
	const input = (stdin.trim() ? JSON.parse(stdin) : {}) as HookInput;
	const cwd = input.cwd ?? process.cwd();
	if (event === 'session-start') {
		return JSON.stringify({
			hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: sessionContext(cwd) }
		});
	}
	if (event === 'pre-tool-use') {
		const reason = denyReason(input, cwd);
		if (!reason) return '';
		return JSON.stringify({
			hookSpecificOutput: {
				hookEventName: 'PreToolUse',
				permissionDecision: 'deny',
				permissionDecisionReason: reason
			}
		});
	}
	throw new wf.WfError(`unknown hook ${event}; expected session-start or pre-tool-use`);
}

/** Global learnings always; project learnings and the handoff inside a wf project. */
export function sessionContext(cwd: string): string {
	const parts = [section('Global learnings (from wf)', wf.globalLearningsPath())];
	let root: string | undefined;
	try {
		root = wf.findRoot(cwd);
	} catch {
		// Not a wf project: global learnings only.
	}
	if (root) {
		parts.push(
			section(`Project learnings for ${root} (from wf)`, wf.projectLearningsPath(root)),
			section('Project handoff (from wf)', join(root, 'docs', 'state', 'handoff.md'))
		);
	}
	return parts.filter(Boolean).join('\n\n');
}

function section(title: string, path: string): string {
	if (!existsSync(path)) return '';
	const body = readFileSync(path, 'utf8')
		.replace(/^# .*\n/, '')
		.trim();
	return body ? `${title}:\n${body}` : '';
}

function denyReason(input: HookInput, cwd: string): string | undefined {
	if (!EDIT_TOOLS.includes(input.tool_name ?? '')) return undefined;
	const target = input.tool_input?.file_path ?? input.tool_input?.notebook_path;
	if (typeof target !== 'string') return undefined;
	const alternative = wf.wfAlternative(resolve(cwd, target));
	if (!alternative) return undefined;
	return `${basename(target)} is written only through wf. Use ${alternative} instead (wf help <command> for usage).`;
}
