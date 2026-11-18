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
			'The first open minor of the first unfinished major that has one, in id order.',
			'Otherwise the first unfinished major that needs minors added or is ready to check.',
			'Minors in progress elsewhere (waiting on the owner, say) never hold it up.'
		]
	},
	find: {
		usage: ['wf find "<text>"'],
		summary: 'search every docs/state/ file, case-insensitive: file:line: text',
		details: ['Use it to answer "how did we do X" or "what is related to Y" before reading files.']
	},
	get: {
		usage: ['wf get <file> ["<section>"]'],
		summary: 'print one docs/state/ file, or one "## <section>" of it',
		details: ['<file> is the name with or without .md, e.g. spec or memory.md.']
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
			'todo.md is always in id order, so where an item sits follows from its id.',
			'A major needs a deliverable the owner can inspect; a minor needs a tangible, verifiable proof.',
			'Every field is one line. Minors cannot be added to a done major.',
			'Prints the changed lines of todo.md.'
		]
	},
	batch: {
		usage: ['wf batch <file>'],
		summary: 'add many majors and minors at once, from a file (for planning a whole todo)',
		details: [
			'The file is the todo.md shape without ids or marks:',
			'  ## <title>            a new major; next line "Deliverable: <text>"',
			'  ## <id>               an existing major, to add minors to',
			'  - <title>             a minor under the header above; next line "  Proof: <text>"',
			'Blank lines are ignored. All or nothing: any error names file:line and writes nothing.',
			'Write the file in scratch/temp/ first. Prints the changed lines of todo.md.'
		]
	},
	edit: {
		usage: ['wf edit <id> [--title "<text>"] [--proof "<text>"] [--deliverable "<text>"]'],
		summary: 'change the text of a major or minor',
		details: [
			'Minors have a title and a proof; majors have a title and a deliverable.',
			'Marks change only through start and done; ids never change.'
		]
	},
	doc: {
		usage: ['wf doc <name> --from <file>', 'wf doc <name> --section "<heading>" --from <file>'],
		summary: 'write a plan document: overview, intent, references, implementation or spec',
		details: [
			'Whole document: the file starts with "# <Title>" and replaces the document.',
			'One section: the file is the body of "## <heading>" (no "#" or "##" headings in it, "###" is fine);',
			'it replaces that section, or is appended when the section is new.',
			'Write the file in scratch/temp/ first. Prints the changed lines.'
		]
	},
	start: {
		usage: ['wf start <minor>'],
		summary: 'mark a minor in progress before working on it',
		details: [
			'Choose the item first, start it, then work. Never claim work after the fact.',
			'Finish a major before moving on, but never wait idle: when an item waits on the owner,',
			'note it in the handoff and start the next one, in any major.',
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
	steer: {
		usage: [
			'wf steer "<summary>" --why "<reason>" --affects <ids|all> --changed "<what changed>" --log true|false'
		],
		summary: 'record an owner steer, after changing the plan it affects',
		details: [
			'A steer is the owner redirecting the code, project, architecture, state or flow of work.',
			'Questions, chatter and small one-off requests are not steers.',
			'Update the plan first (todo, plan documents), then record what changed with --changed.',
			'--affects lists existing ids, comma-separated, or all. --log false records nothing.',
			"The summary is yours, never the owner's words verbatim. wf show <id> lists the steers for an item."
		]
	},
	assume: {
		usage: ['wf assume "<summary>" --why "<reason>" --affects <ids|all> [--changed "<text>"]'],
		summary: 'record a reversible choice made while the owner is away, for their review',
		details: ['Take the most reversible option, do it, then record it here.']
	},
	checks: {
		usage: ['wf checks set "<cmd>" ["<cmd>" ...]'],
		summary: 'write .githooks/pre-commit: gitleaks (secrets and PII), then these checks in order',
		details: [
			'The owner names the checks in setup. Commands run from the project root; the first failure',
			'stops the commit. Files a check rewrites (a formatter) are staged again. Sets core.hooksPath.',
			'Run it again with the full list to change the checks; never edit the hook by hand.'
		]
	},
	push: {
		usage: ['wf push set ["<cmd>" ...]'],
		summary: 'write .githooks/pre-push: these commands run only when a major is pushed',
		details: [
			'A major is a pushed commit whose subject starts with a bare integer, e.g. "3 dashboard".',
			'Other pushes run nothing. With no commands the hook is removed. Optional: a deploy, say.'
		]
	},
	env: {
		usage: ['wf env set <KEY> <value>', 'wf env keys'],
		summary: 'write a key into .env, or list its key names; values are never shown',
		details: [
			'.env holds real credentials: never read, print or edit it any other way.',
			'set adds the key or overwrites its value, and refuses until .env is in .gitignore.',
			'.env.example and .env.local are free to read and edit directly.'
		]
	},
	memory: {
		usage: ['wf memory invariants|contracts|pitfalls|anti-patterns "<entry>"'],
		summary: "add to memory.md: the project's invariants, contracts, pitfalls and anti-patterns",
		details: [
			'Invariants and anti-patterns are numbered; pitfalls are dated, so include the cause in the text.'
		]
	},
	risk: {
		usage: [
			'wf risk --item <id> --action "<exact command or change>" --why "<reason>" --level low|medium|high --surface "<what it touches>" --recover "<how to undo>"'
		],
		summary: 'log a high-risk action before it runs; any missing field means it must not run',
		details: [
			'High-risk: deleting files, branches or repos, schema migrations, force-pushes, anything hard to undo.',
			'They run only when the owner explicitly asks. Log first; run only after wf accepts the log.'
		]
	},
	learn: {
		usage: ['wf learn "<what went wrong> → <what to do instead>" [--global]'],
		summary: 'record a lesson: this project, or with --global every project',
		details: [
			'One line, at most 200 characters, with the arrow. Numbered automatically.',
			'Learnings are injected into every session; a learning that would push any affected',
			"project's session context over 9,000 characters is rejected: merge or prune first.",
			"Record a lesson the moment it is learned. A summary, never the owner's words verbatim."
		]
	},
	state: {
		usage: ['wf state setup|discuss|build'],
		summary: "switch the project's state and print what to do in it",
		details: [
			"The state is the handoff's State line; every session start injects its instructions.",
			'The owner switches states, or tells you to. Never decide on your own that a state is over;',
			'leave discuss only when the owner says so.'
		]
	},
	admin: {
		usage: ['wf admin on|off'],
		summary: "the owner's switch: while on, no wf restriction applies to this project",
		details: [
			'Run by the owner in a terminal, or from the dashboard. Refuses inside Claude Code.',
			'The model never enters, leaves or touches admin mode in any way.'
		]
	},
	hook: {
		usage: ['wf hook session-start|pre-tool-use|user-prompt-submit'],
		summary: 'Claude Code hook entry points (hook JSON on stdin)',
		details: [
			'session-start: global learnings, the current state instructions, project learnings and the handoff.',
			'pre-tool-use: denies Edit/Write on state files that wf writes (naming the wf command), project',
			'file writes in discuss, and git push in setup before the owner writes "setup done".',
			'user-prompt-submit: records "setup done" from the owner while the project is in setup.',
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
