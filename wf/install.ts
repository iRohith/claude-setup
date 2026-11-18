// One-time machine setup, run by the owner: wf on PATH, the global instructions as
// ~/.claude/CLAUDE.md, and the Claude Code hooks in user settings.
import { existsSync, lstatSync, mkdirSync, readFileSync, readlinkSync, symlinkSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WfError, globalFile, writeAtomic } from './core.ts';

interface HookGroup {
	matcher?: string;
	hooks?: { type: string; command: string }[];
}
type Settings = Record<string, unknown> & { hooks?: Record<string, HookGroup[]> };

const cli = fileURLToPath(new URL('cli.ts', import.meta.url));

const HOOKS: [event: string, matcher: string | undefined, command: string][] = [
	['SessionStart', 'startup|resume|clear|compact', `${cli} hook session-start`],
	['PreToolUse', 'Edit|MultiEdit|Write|NotebookEdit|Bash|Read', `${cli} hook pre-tool-use`],
	['UserPromptSubmit', undefined, `${cli} hook user-prompt-submit`]
];

/** Idempotent. Returns one line per change made. */
export function install(): string[] {
	return [
		...linkTo(join(homedir(), '.local', 'bin', 'wf'), cli),
		...linkTo(join(homedir(), '.claude', 'CLAUDE.md'), globalFile('CLAUDE.md')),
		...registerHooks()
	];
}

/** Links `link` to `target`; never replaces anything that isn't already that link. */
function linkTo(link: string, target: string): string[] {
	if (existsSync(link) || isSymlink(link)) {
		if (isSymlink(link) && readlinkSync(link) === target) return [];
		throw new WfError(`${link} exists and isn't a link to ${target}; move it aside and rerun`);
	}
	mkdirSync(dirname(link), { recursive: true });
	symlinkSync(target, link);
	return [`linked ${link} → ${target}`];
}

function isSymlink(path: string): boolean {
	try {
		return lstatSync(path).isSymbolicLink();
	} catch {
		return false;
	}
}

function registerHooks(): string[] {
	const path = join(homedir(), '.claude', 'settings.json');
	const settings = (existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {}) as Settings;
	settings.hooks ??= {};
	const changes: string[] = [];
	for (const [event, matcher, command] of HOOKS) {
		const groups = (settings.hooks[event] ??= []);
		const ours = groups.find((g) => g.hooks?.some((h) => h.command === command));
		if (ours) {
			if (ours.matcher === matcher) continue;
			ours.matcher = matcher;
			changes.push(`updated the ${event} hook's matcher to ${matcher ?? 'every event'} in ${path}`);
			continue;
		}
		groups.push({ ...(matcher && { matcher }), hooks: [{ type: 'command', command }] });
		changes.push(`added ${event} hook (${matcher ?? 'every event'}) to ${path}`);
	}
	if (changes.length) {
		mkdirSync(dirname(path), { recursive: true });
		writeAtomic(path, JSON.stringify(settings, null, 2) + '\n');
	}
	return changes;
}
