// One-time machine setup, run by the owner: wf on PATH and the Claude Code hooks in user settings.
import { existsSync, lstatSync, mkdirSync, readFileSync, readlinkSync, symlinkSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WfError, writeAtomic } from './core.ts';

interface HookGroup {
	matcher?: string;
	hooks?: { type: string; command: string }[];
}
type Settings = Record<string, unknown> & { hooks?: Record<string, HookGroup[]> };

const cli = fileURLToPath(new URL('cli.ts', import.meta.url));

const HOOKS: [event: string, matcher: string, command: string][] = [
	['SessionStart', 'startup|resume|clear|compact', `${cli} hook session-start`],
	['PreToolUse', 'Edit|MultiEdit|Write|NotebookEdit', `${cli} hook pre-tool-use`]
];

/** Idempotent. Returns one line per change made. */
export function install(): string[] {
	return [...linkBinary(), ...registerHooks()];
}

function linkBinary(): string[] {
	const link = join(homedir(), '.local', 'bin', 'wf');
	if (existsSync(link) || isSymlink(link)) {
		if (isSymlink(link) && readlinkSync(link) === cli) return [];
		throw new WfError(`${link} exists and isn't a link to ${cli}; move it aside and rerun`);
	}
	mkdirSync(dirname(link), { recursive: true });
	symlinkSync(cli, link);
	return [`linked ${link} → ${cli}`];
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
		if (groups.some((g) => g.hooks?.some((h) => h.command === command))) continue;
		groups.push({ matcher, hooks: [{ type: 'command', command }] });
		changes.push(`added ${event} hook (${matcher}) to ${path}`);
	}
	if (changes.length) {
		mkdirSync(dirname(path), { recursive: true });
		writeAtomic(path, JSON.stringify(settings, null, 2) + '\n');
	}
	return changes;
}
