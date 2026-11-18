#!/usr/bin/env node
// Parses arguments, calls the core, prints plain text. No rules live here.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import * as wf from './core.ts';
import { runHook } from './hooks.ts';
import { install } from './install.ts';

const USAGE = `usage:
  wf init
  wf status
  wf next
  wf show <id>
  wf add major "<title>" --deliverable "<text>"
  wf add minor <major> "<title>" --proof "<text>"
  wf start <minor>
  wf done <id>
  wf impl <minor> "<detail>"
  wf handoff --next "<text>" --verify "<text>" --dont "<text>" [--open "<text>" ...]
  wf hook session-start|pre-tool-use   (Claude Code hooks; hook JSON on stdin)
  wf install                           (once per machine, by the owner, outside Claude Code)`;

const OPTIONS = {
	deliverable: { type: 'string' },
	proof: { type: 'string' },
	next: { type: 'string' },
	verify: { type: 'string' },
	dont: { type: 'string' },
	open: { type: 'string', multiple: true }
} as const;

function main(argv: string[]): void {
	const { values, positionals } = parseArgs({
		args: argv,
		options: OPTIONS,
		allowPositionals: true
	});
	const [command, ...args] = positionals;
	const arg = (i: number, name: string): string => {
		const value = args[i];
		if (value === undefined) throw new UsageError(`missing <${name}>`);
		return value;
	};

	switch (command) {
		case 'init': {
			const root = wf.initProject(process.cwd());
			console.log(`created ${join(root, 'docs', 'state')}/ in setup state and registered it`);
			return;
		}
		case 'status':
			return status();
		case 'next': {
			const item = wf.nextItem(wf.readTodo(wf.findRoot(process.cwd())));
			console.log(item ? describeNext(item) : 'nothing open; finish the minors in progress');
			return;
		}
		case 'show':
			return show(arg(0, 'id'));
		case 'add': {
			const kind = arg(0, 'major|minor');
			if (kind === 'major')
				return editTodo((t) => wf.addMajor(t, arg(1, 'title'), values.deliverable ?? ''));
			if (kind === 'minor')
				return editTodo((t) =>
					wf.addMinor(t, arg(1, 'major'), arg(2, 'title'), values.proof ?? '')
				);
			throw new UsageError(`add takes major or minor, got ${kind}`);
		}
		case 'start':
			return editTodo((t) => wf.start(t, arg(0, 'minor')));
		case 'done':
			return editTodo((t) => wf.done(t, arg(0, 'id')));
		case 'impl':
			return editTodo((t) => wf.impl(t, arg(0, 'minor'), arg(1, 'detail')));
		case 'handoff':
			return handoff(values.next ?? '', values.verify ?? '', values.dont ?? '', values.open ?? []);
		case 'hook':
			process.stdout.write(runHook(arg(0, 'event'), readFileSync(0, 'utf8')));
			return;
		case 'install': {
			if (process.env.CLAUDECODE)
				throw new wf.WfError('install writes outside the project; the owner runs it in a terminal');
			const changes = install();
			console.log(changes.length ? changes.join('\n') : 'already installed');
			return;
		}
		default:
			throw new UsageError(command ? `unknown command ${command}` : 'missing command');
	}
}

class UsageError extends Error {}

function editTodo(change: (todo: wf.Todo) => unknown): void {
	const root = wf.findRoot(process.cwd());
	wf.withLock(root, () => {
		const todo = wf.readTodo(root);
		const before = wf.formatTodo(todo);
		change(todo);
		wf.writeTodo(root, todo);
		printChanges(before, wf.formatTodo(todo));
	});
}

function handoff(next: string, verify: string, dont: string, open: string[]): void {
	const root = wf.findRoot(process.cwd());
	wf.withLock(root, () => {
		const old = wf.readHandoff(root);
		const active = wf.activeMinors(wf.readTodo(root)).map((n) => n.id);
		const h = { state: old.state, active: active.join(', ') || '—', next, verify, dont, open };
		const after = wf.formatHandoff(h);
		wf.writeHandoff(root, h);
		printChanges(wf.formatHandoff(old), after);
	});
}

function status(): void {
	const root = wf.findRoot(process.cwd());
	const todo = wf.readTodo(root);
	const active = wf.activeMinors(todo);
	const next = wf.nextItem(todo);
	console.log(`state: ${wf.readHandoff(root).state}`);
	console.log(
		`active: ${active.length ? active.map((n) => `${n.id} ${n.title}`).join('; ') : '—'}`
	);
	console.log(`next: ${next ? describeNext(next) : '—'}`);
	console.log(
		`learnings: ${wf.countLearnings(wf.projectLearningsPath(root))} project, ${wf.countLearnings(wf.globalLearningsPath())} global`
	);
}

function describeNext(item: wf.Minor | wf.Major): string {
	if (wf.isMinor(item)) return `${item.id} ${item.title}`;
	const why = item.minors.length ? 'all minors done; check it' : 'needs minors';
	return `major ${item.id} · ${item.title} (${why})`;
}

function show(id: string): void {
	const todo = wf.readTodo(wf.findRoot(process.cwd()));
	if (id.includes('.')) {
		const minor = wf.findMinor(todo, id);
		console.log(`[${minor.mark}] ${minor.id} ${minor.title}\nProof: ${minor.proof}`);
		for (const detail of minor.impl) console.log(`- ${detail}`);
		return;
	}
	const major = wf.findMajor(todo, id);
	console.log(`[${major.mark}] ${major.id} · ${major.title}\nDeliverable: ${major.deliverable}`);
	for (const minor of major.minors) console.log(`[${minor.mark}] ${minor.id} ${minor.title}`);
}

/** Prints removed lines as "- " and added lines as "+ ", using a longest-common-subsequence diff. */
function printChanges(before: string, after: string): void {
	const a = before.split('\n');
	const b = after.split('\n');
	const lcs = Array.from({ length: a.length + 1 }, () => new Uint32Array(b.length + 1));
	for (let i = a.length - 1; i >= 0; i--)
		for (let j = b.length - 1; j >= 0; j--)
			lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
	const out: string[] = [];
	let i = 0;
	let j = 0;
	while (i < a.length || j < b.length) {
		if (i < a.length && j < b.length && a[i] === b[j]) {
			i++;
			j++;
		} else if (j >= b.length || (i < a.length && lcs[i + 1][j] >= lcs[i][j + 1])) {
			out.push(`- ${a[i++]}`);
		} else {
			out.push(`+ ${b[j++]}`);
		}
	}
	console.log(out.length ? out.join('\n') : 'no change');
}

try {
	main(process.argv.slice(2));
} catch (e) {
	if (e instanceof wf.WfError) {
		console.error(`wf: ${e.message}`);
		process.exit(1);
	}
	if (e instanceof UsageError || (e as NodeJS.ErrnoException).code?.startsWith('ERR_PARSE_ARGS')) {
		console.error(`wf: ${(e as Error).message}\n${USAGE}`);
		process.exit(2);
	}
	throw e;
}
