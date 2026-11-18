// The one list of wf commands, with the usage and the rules each enforces. The CLI accepts only
// commands listed here, so every command has help.

interface Help {
	usage: string[];
	summary: string;
	details: string[];
}

export const HELP: Record<string, Help> = {
	init: {
		usage: ['wf init'],
		summary: 'start a project here, or register one that already has docs/state/',
		details: [
			'Without docs/state/: creates it from empty templates, in setup state.',
			'With docs/state/: checks todo.md and handoff.md parse, then only registers it.',
			'Registered projects show in the dashboard.'
		]
	},
	status: {
		usage: ['wf status'],
		summary: 'state, active minors, next item, learnings count',
		details: ['Read-only. Run it first in any session.']
	},
	next: {
		usage: ['wf next'],
		summary: 'what to work on next',
		details: [
			'While a major has minors in progress: its first open minor, or nothing (finish what is active).',
			'Otherwise: the first unfinished major, its first open minor, or the major itself when it needs minors or is ready to check.'
		]
	},
	show: {
		usage: ['wf show <id>'],
		summary:
			'one item: a major with its minors, or a minor with its proof and implementation details',
		details: ['Read-only. <id> is x (major) or x.x (minor).']
	},
	add: {
		usage: [
			'wf add major "<title>" --deliverable "<text>"',
			'wf add minor <major> "<title>" --proof "<text>"'
		],
		summary: 'add one major or one minor',
		details: [
			'Ids are assigned: majors x (max + 1), minors x.x starting at .1. Ids are never reused.',
			'A major needs a deliverable the owner can inspect; a minor needs a tangible, verifiable proof.',
			'Every field is one line. Minors cannot be added to a done major.',
			'Prints the changed lines of todo.md.'
		]
	},
	start: {
		usage: ['wf start <minor>'],
		summary: 'mark a minor in progress before working on it',
		details: [
			'Choose the item first, start it, then work. Never claim work after the fact.',
			'Only one major may have minors in progress; several minors in that major are fine.',
			'Starting a minor marks its major in progress.'
		]
	},
	done: {
		usage: ['wf done <id>'],
		summary: 'mark a minor or a major done',
		details: [
			'Order: verify the proof, run the pre-commit checks, then done (with impl and handoff), then commit, then push.',
			'A minor must be in progress. A major needs at least one minor and all of them done.'
		]
	},
	impl: {
		usage: ['wf impl <minor> "<detail>"'],
		summary: 'record how a minor was actually built',
		details: ['Only on a started or done minor. One line per detail; details are appended.']
	},
	handoff: {
		usage: ['wf handoff --next "<text>" --verify "<text>" --dont "<text>" [--open "<text>" ...]'],
		summary: 'rewrite the handoff so any session can pick up where work stopped',
		details: [
			'State is kept; Active is filled from the minors in progress.',
			'--open repeats, once per question waiting for the owner. At most 15 lines in all.',
			'Rewrite it at the end of each minor and whenever work stops, before the commit.'
		]
	},
	hook: {
		usage: ['wf hook session-start|pre-tool-use'],
		summary: 'Claude Code hook entry points (hook JSON on stdin)',
		details: [
			'session-start: prints global learnings, project learnings and the handoff as context.',
			'pre-tool-use: denies Edit/Write on state files that wf writes, naming the wf command instead.',
			'Registered by wf install; not run by hand.'
		]
	},
	install: {
		usage: ['wf install'],
		summary: 'once per machine, by the owner in a terminal: wf on PATH and the hooks registered',
		details: [
			'Links ~/.local/bin/wf and adds the hooks to ~/.claude/settings.json, keeping other settings.',
			'Idempotent. Refuses to run inside Claude Code.'
		]
	},
	help: {
		usage: ['wf help [command]', 'wf <command> --help'],
		summary: 'this help',
		details: ['Without a command: every command with a one-line summary.']
	}
};

export function overview(): string {
	const width = Math.max(...Object.keys(HELP).map((k) => k.length));
	return [
		'wf keeps project state in docs/state/ and is the only way to change it.',
		'Read state with wf queries; write it only with wf commands.',
		'',
		...Object.entries(HELP).map(([name, h]) => `  ${name.padEnd(width)}  ${h.summary}`),
		'',
		'wf help <command> for usage and rules.'
	].join('\n');
}

export function commandHelp(name: string): string | undefined {
	const h = HELP[name];
	if (!h) return undefined;
	return [
		`${name}: ${h.summary}`,
		'',
		'usage:',
		...h.usage.map((u) => `  ${u}`),
		'',
		...h.details
	].join('\n');
}
