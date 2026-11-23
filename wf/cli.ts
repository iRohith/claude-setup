#!/usr/bin/env node
// Parses arguments, calls the core, prints plain text. No rules live here.
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import * as wf from './core.ts';
import { setChecks, setPush } from './githooks.ts';
import { HELP, commandHelp, overview } from './help.ts';
import { runHook } from './hooks.ts';
import { install } from './install.ts';

const OPTIONS = {
	help: { type: 'boolean', short: 'h' },
	global: { type: 'boolean' },
	edit: { type: 'string' },
	remove: { type: 'string' },
	why: { type: 'string' },
	affects: { type: 'string' },
	changed: { type: 'string' },
	log: { type: 'string' },
	item: { type: 'string' },
	action: { type: 'string' },
	level: { type: 'string' },
	surface: { type: 'string' },
	recover: { type: 'string' },
	resolves: { type: 'string' },
	title: { type: 'string' },
	from: { type: 'string' },
	section: { type: 'string' },
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
		if (value === undefined) throw new UsageError(`missing <${name}>`, command);
		return value;
	};

	if (!command) return console.log(overview());
	if (!(command in HELP)) throw new UsageError(`unknown command ${command}`);
	if (values.help) return console.log(commandHelp(command));

	switch (command) {
		case 'help': {
			const topic = args[0];
			if (topic && !(topic in HELP)) throw new UsageError(`no help for ${topic}`);
			return console.log(topic ? commandHelp(topic) : overview());
		}
		case 'init': {
			checkSession(wf.tryFindRoot(process.cwd()) ?? resolve(process.cwd()));
			const { root, created } = wf.initProject(process.cwd());
			const dir = join(root, 'docs', 'state');
			const state = wf.readHandoff(root).state;
			console.log(
				created
					? `created ${dir}/ in setup state and registered it`
					: `${dir}/ already exists; registered it`
			);
			console.log(`\nInstructions for the ${state} state:\n${wf.stateInstructions(state)}`);
			return;
		}
		case 'status':
			return status();
		case 'next': {
			const item = wf.nextItem(wf.readTodo(wf.findRoot(process.cwd())));
			console.log(item ? describeNext(item) : 'nothing open; only the minors in progress remain');
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
			throw new UsageError(`add takes major or minor, got ${kind}`, 'add');
		}
		case 'batch': {
			const file = arg(0, 'file');
			return editTodo((t) => wf.applyBatch(t, readFileSync(file, 'utf8'), file));
		}
		case 'edit':
			return editTodo((t) =>
				wf.editItem(t, arg(0, 'id'), {
					title: values.title,
					proof: values.proof,
					deliverable: values.deliverable
				})
			);
		case 'doc': {
			const name = arg(0, 'name');
			if (!values.from) throw new UsageError('missing --from <file>', 'doc');
			const text = readFileSync(values.from, 'utf8');
			const root = writableRoot();
			return wf.withLock(root, () => {
				const { before, after } = wf.writeDoc(root, name, text, values.section);
				printChanges(before, after);
			});
		}
		case 'start':
			return editTodo((t) => wf.start(t, arg(0, 'minor')));
		case 'done':
			return editTodo((t) => wf.done(t, arg(0, 'id')));
		case 'impl':
			return editTodo((t) => wf.impl(t, arg(0, 'minor'), arg(1, 'detail')));
		case 'handoff':
			return handoff(values.next ?? '', values.verify ?? '', values.dont ?? '', values.open ?? []);
		case 'steer':
		case 'assume': {
			if (command === 'steer' && values.log !== 'true' && values.log !== 'false')
				throw new UsageError('steer needs --log true or --log false', 'steer');
			if (values.log === 'false') {
				console.log('steer acknowledged, not logged (update the plan as it requires)');
				return;
			}
			const root = writableRoot();
			return wf.withLock(root, () => {
				const { before, after } = wf.addSteer(root, {
					kind: command === 'steer' ? 'Steer' : 'Assumption',
					summary: arg(0, 'summary'),
					why: values.why ?? '',
					affects: (values.affects ?? '').split(',').filter((s) => s.trim()),
					changed: values.changed
				});
				printChanges(before, after);
			});
		}
		case 'risk': {
			const root = writableRoot();
			return wf.withLock(root, () => {
				const { before, after } = wf.addRisk(root, {
					item: values.item,
					action: values.action,
					why: values.why,
					level: values.level,
					surface: values.surface,
					recover: values.recover
				});
				printChanges(before, after);
				console.log('\nlogged; the action may run now');
			});
		}
		case 'checks': {
			if (arg(0, 'set') !== 'set') throw new UsageError('checks takes set', 'checks');
			console.log(`wrote ${setChecks(writableRoot(), args.slice(1))}`);
			return;
		}
		case 'push': {
			if (arg(0, 'set') !== 'set') throw new UsageError('push takes set', 'push');
			const path = setPush(writableRoot(), args.slice(1));
			console.log(path ? `wrote ${path}` : 'no pre-push hook: pushes run nothing');
			return;
		}
		case 'env': {
			const root = writableRoot();
			const action = arg(0, 'set|keys');
			if (action === 'keys') {
				const keys = wf.envKeys(root);
				console.log(keys.length ? keys.join('\n') : 'no keys in .env');
				return;
			}
			if (action !== 'set') throw new UsageError(`env takes set or keys, got ${action}`, 'env');
			const key = arg(1, 'KEY');
			console.log(`${wf.envSet(root, key, arg(2, 'value'))} ${key} in .env`);
			return;
		}
		case 'memory': {
			const root = writableRoot();
			return wf.withLock(root, () => {
				const { before, after } = wf.addMemory(root, arg(0, 'section'), arg(1, 'entry'));
				printChanges(before, after);
			});
		}
		case 'defer': {
			const root = writableRoot();
			return wf.withLock(root, () => {
				const { before, after } = wf.addDeferred(root, arg(0, 'item'), values.resolves ?? '');
				printChanges(before, after);
			});
		}
		case 'find': {
			const hits = wf.findInState(wf.findRoot(process.cwd()), arg(0, 'text'));
			console.log(hits.length ? hits.join('\n') : 'no matches');
			return;
		}
		case 'get':
			console.log(wf.getState(wf.findRoot(process.cwd()), arg(0, 'file'), args[1]));
			return;
		case 'learn': {
			const root = wf.tryFindRoot(process.cwd());
			const global = values.global ?? false;
			// Global learnings belong to every project; a project's own only to its sessions.
			if (root && !global) checkSession(root);
			if (values.edit !== undefined && values.remove !== undefined)
				throw new UsageError('use --edit or --remove, not both', command);
			const number = (value: string): number => {
				if (!/^\d+$/.test(value))
					throw new UsageError(`a learning number is a positive integer, not ${value}`, command);
				return Number(value);
			};
			const write = () => {
				const { before, after } =
					values.remove !== undefined
						? wf.removeLearning(root, number(values.remove), global)
						: values.edit !== undefined
							? wf.editLearning(root, number(values.edit), arg(0, 'learning'), global)
							: wf.addLearning(root, arg(0, 'learning'), global);
				printChanges(before, after);
				const long = values.remove === undefined && wf.learningWarning(arg(0, 'learning'));
				if (long) console.error(`wf: warning: ${long}`);
				warnContext(root);
			};
			return root ? wf.withLock(root, write) : write();
		}
		case 'state': {
			const root = writableRoot();
			return wf.withLock(root, () => {
				const { before, after } = wf.setState(root, arg(0, 'setup|discuss|build'));
				printChanges(wf.formatHandoff(before), wf.formatHandoff(after));
				console.log(
					`\nInstructions for the ${after.state} state:\n${wf.stateInstructions(after.state)}`
				);
			});
		}
		case 'hook':
			process.stdout.write(runHook(arg(0, 'event'), readFileSync(0, 'utf8')));
			return;
		case 'admin': {
			if (process.env.CLAUDECODE)
				throw new wf.WfError('admin mode belongs to the owner; run wf admin in a terminal');
			const value = arg(0, 'on|off');
			if (value !== 'on' && value !== 'off')
				throw new UsageError(`admin takes on or off, got ${value}`, 'admin');
			const root = wf.findRoot(process.cwd());
			wf.setAdmin(root, value === 'on');
			console.log(`admin mode ${value} for ${root}`);
			return;
		}
		case 'install': {
			if (process.env.CLAUDECODE)
				throw new wf.WfError('install writes outside the project; the owner runs it in a terminal');
			const changes = install();
			console.log(changes.length ? changes.join('\n') : 'already installed');
			return;
		}
		default:
			throw new Error(`${command} is listed in help.ts but has no handler in cli.ts`);
	}
}

/** A mistake in how wf was called; `command` picks which help to show with it. */
class UsageError extends Error {
	command?: string;
	constructor(message: string, command?: string) {
		super(message);
		this.command = command;
	}
}

/** The project to write: the one here, refused when it isn't this session's own project. */
function writableRoot(): string {
	const root = wf.findRoot(process.cwd());
	checkSession(root);
	return root;
}

function checkSession(root: string): void {
	const denial = wf.sessionDenial(root);
	if (denial) throw new wf.WfError(denial);
}

function editTodo(change: (todo: wf.Todo) => unknown): void {
	const root = writableRoot();
	wf.withLock(root, () => {
		const todo = wf.readTodo(root);
		const before = wf.formatTodo(todo);
		change(todo);
		wf.writeTodo(root, todo);
		printChanges(before, wf.formatTodo(todo));
	});
}

function handoff(next: string, verify: string, dont: string, open: string[]): void {
	const root = writableRoot();
	wf.withLock(root, () => {
		const old = wf.readHandoff(root);
		const active = wf.activeMinors(wf.readTodo(root)).map((n) => n.id);
		const h = { state: old.state, active: active.join(', ') || '—', next, verify, dont, open };
		const after = wf.formatHandoff(h);
		wf.writeHandoff(root, h);
		printChanges(wf.formatHandoff(old), after);
		warnContext(root);
	});
}

/** Warns, never refuses, when this project's own session context is past the size to aim for. */
function warnContext(root: string | undefined): void {
	const warning = root && wf.contextWarning(root);
	if (warning) console.error(`wf: warning: ${warning}`);
}

/** How many active items status titles, and how many steers show prints. */
const SHOWN = 5;
/** Titles in listings are cut to this; wf show <minor> prints one in full. */
const short = (title: string): string => (title.length > 80 ? `${title.slice(0, 79)}…` : title);

function status(): void {
	const root = wf.findRoot(process.cwd());
	const todo = wf.readTodo(root);
	const active = wf.activeMinors(todo);
	const next = wf.nextItem(todo);
	console.log(`state: ${wf.readHandoff(root).state}`);
	// Titles for the first few only, so the output stays small however much is in progress.
	const titled = active.slice(0, SHOWN).map((n) => `${n.id} ${short(n.title)}`);
	const more = active.slice(SHOWN).map((n) => n.id);
	if (more.length) titled.push(`also ${more.join(', ')}`);
	console.log(`active: ${titled.length ? titled.join('; ') : '—'}`);
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
	const root = wf.findRoot(process.cwd());
	const todo = wf.readTodo(root);
	if (id.includes('.')) {
		const minor = wf.findMinor(todo, id);
		console.log(`[${minor.mark}] ${minor.id} ${minor.title}\nProof: ${minor.proof}`);
		for (const detail of minor.impl) console.log(`- ${detail}`);
	} else {
		const major = wf.findMajor(todo, id);
		console.log(`[${major.mark}] ${major.id} · ${major.title}\nDeliverable: ${major.deliverable}`);
		for (const minor of major.minors)
			console.log(`[${minor.mark}] ${minor.id} ${short(minor.title)}`);
	}
	const steers = wf.steersFor(root, id);
	if (steers.length) console.log('\nSteers:');
	for (const s of steers.slice(-SHOWN))
		console.log(`- ${s.date} ${s.kind.toLowerCase()}: ${wf.unescapeMd(s.summary)}`);
	if (steers.length > SHOWN)
		console.log(`(${steers.length - SHOWN} older: wf find "<text>" or wf get steers)`);
	const deferred = wf.deferredFor(root, id);
	if (deferred.length) console.log('\nDeferred to it:');
	for (const d of deferred)
		console.log(`- ${wf.unescapeMd(d.item).replaceAll('\\|', '|')} (${d.resolves})`);
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
		const help = e instanceof UsageError && e.command ? commandHelp(e.command) : overview();
		console.error(`wf: ${(e as Error).message}\n\n${help}`);
		process.exit(2);
	}
	throw e;
}
