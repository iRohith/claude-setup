// Claude Code hook entry points: read the hook JSON, ask the core, print the hook JSON.
import { existsSync, readFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import * as wf from './core.ts';

interface HookInput {
	cwd?: string;
	prompt?: string;
	tool_name?: string;
	tool_input?: { file_path?: unknown; notebook_path?: unknown; command?: unknown };
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
	if (event === 'user-prompt-submit') {
		const root = projectRoot(cwd);
		if (!root || !wf.recordSetupDone(root, input.prompt ?? '')) return '';
		return JSON.stringify({
			hookSpecificOutput: {
				hookEventName: 'UserPromptSubmit',
				additionalContext:
					'wf recorded that the owner wrote "setup done": pushing is allowed now. Update the state, push init to work, create main at init and push it.'
			}
		});
	}
	throw new wf.WfError(
		`unknown hook ${event}; expected session-start, pre-tool-use or user-prompt-submit`
	);
}

function projectRoot(cwd: string): string | undefined {
	try {
		return wf.findRoot(cwd);
	} catch {
		return undefined;
	}
}

/**
 * Global learnings always; inside a wf project also the instructions for its current state, its
 * learnings and its handoff.
 */
export function sessionContext(cwd: string): string {
	const parts = [section('Global learnings (from wf)', wf.globalLearningsPath())];
	const root = projectRoot(cwd);
	if (root) {
		const state = wf.readHandoff(root).state;
		parts.push(
			`Instructions for the ${state} state (from wf):\n${wf.stateInstructions(state)}`,
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
	const root = projectRoot(cwd);
	if (input.tool_name === 'Bash') {
		const command = input.tool_input?.command;
		return root && typeof command === 'string' ? wf.pushDenial(root, command) : undefined;
	}
	if (!EDIT_TOOLS.includes(input.tool_name ?? '')) return undefined;
	const target = input.tool_input?.file_path ?? input.tool_input?.notebook_path;
	if (typeof target !== 'string') return undefined;
	const file = resolve(cwd, target);
	const alternative = wf.wfAlternative(file);
	if (alternative)
		return `${basename(target)} is written only through wf. This is a fixed rule, so retrying the edit will be denied again. Use ${alternative} instead (wf help <command> for usage).`;
	return root ? wf.discussDenial(root, file) : undefined;
}
