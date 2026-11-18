// The only code that reads and writes project state. Every rule lives here (spec.md section 3).
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export class WfError extends Error {}

export type Mark = ' ' | '~' | 'x';
export type State = 'setup' | 'discuss' | 'build';

export interface Minor {
	id: string;
	mark: Mark;
	title: string;
	proof: string;
	impl: string[];
}

export interface Major {
	id: string;
	mark: Mark;
	title: string;
	deliverable: string;
	minors: Minor[];
}

export interface Todo {
	majors: Major[];
}

export interface Handoff {
	state: State;
	active: string;
	next: string;
	verify: string;
	dont: string;
	open: string[];
}

const STATES: State[] = ['setup', 'discuss', 'build'];
const HANDOFF_MAX_LINES = 15;

// ---------- todo.md ----------

export function parseTodo(text: string, file = 'todo.md'): Todo {
	const lines = text.split('\n');
	const fail = (i: number, why: string): never => {
		throw new WfError(`${file}:${i + 1}: ${why}`);
	};
	if (lines[0] !== '# Todo' || lines[1] !== '') fail(0, 'expected "# Todo" then a blank line');
	const todo: Todo = { majors: [] };
	let major: Major | undefined;
	let minor: Minor | undefined;
	for (let i = 2; i < lines.length; i++) {
		const line = lines[i];
		let m: RegExpMatchArray | null;
		if (line === '') {
			minor = undefined;
		} else if ((m = line.match(/^## \[([ ~x])\] (\d+) · (.+)$/))) {
			major = { id: m[2], mark: m[1] as Mark, title: m[3], deliverable: '', minors: [] };
			const dl = lines[++i]?.match(/^Deliverable: (.+)$/);
			if (!dl) fail(i, 'expected "Deliverable: ..." under the major');
			major.deliverable = dl![1];
			todo.majors.push(major);
			minor = undefined;
		} else if ((m = line.match(/^- \[([ ~x])\] (\d+\.\d+) (.+)$/))) {
			if (!major) fail(i, 'minor before any major');
			if (!m[2].startsWith(`${major!.id}.`))
				fail(i, `minor ${m[2]} is not under major ${major!.id}`);
			const pr = lines[++i]?.match(/^ {2}Proof: (.+)$/);
			if (!pr) fail(i, 'expected "  Proof: ..." under the minor');
			minor = { id: m[2], mark: m[1] as Mark, title: m[3], proof: pr![1], impl: [] };
			major!.minors.push(minor);
		} else if ((m = line.match(/^ {2}- (.+)$/))) {
			if (!minor) fail(i, 'implementation detail outside a minor');
			minor!.impl.push(m[1]);
		} else {
			fail(i, `unrecognised line: ${line}`);
		}
	}
	checkIds(todo);
	return todo;
}

export function formatTodo(todo: Todo): string {
	const out = ['# Todo', ''];
	for (const major of todo.majors) {
		out.push(
			`## [${major.mark}] ${major.id} · ${major.title}`,
			`Deliverable: ${major.deliverable}`,
			''
		);
		for (const minor of major.minors) {
			out.push(`- [${minor.mark}] ${minor.id} ${minor.title}`, `  Proof: ${minor.proof}`);
			for (const detail of minor.impl) out.push(`  - ${detail}`);
		}
		if (major.minors.length) out.push('');
	}
	return out.join('\n');
}

function checkIds(todo: Todo): void {
	const seen = new Set<string>();
	for (const major of todo.majors) {
		for (const id of [major.id, ...major.minors.map((n) => n.id)]) {
			if (seen.has(id)) throw new WfError(`duplicate id ${id}`);
			seen.add(id);
		}
	}
}

// ---------- todo rules ----------

export function findMajor(todo: Todo, id: string): Major {
	const major = todo.majors.find((n) => n.id === id);
	if (!major) throw new WfError(`no major ${id}`);
	return major;
}

export function findMinor(todo: Todo, id: string): Minor {
	const major = findMajor(todo, id.split('.')[0]);
	const minor = major.minors.find((n) => n.id === id);
	if (!minor) throw new WfError(`no minor ${id}`);
	return minor;
}

const isMinorId = (id: string) => /^\d+\.\d+$/.test(id);
const nextNumber = (ids: string[]) =>
	Math.max(-1, ...ids.map((id) => Number(id.split('.').at(-1)))) + 1;

export function addMajor(todo: Todo, title: string, deliverable: string): Major {
	const major: Major = {
		id: String(nextNumber(todo.majors.map((n) => n.id))),
		mark: ' ',
		title: required(title, 'title'),
		deliverable: required(deliverable, 'deliverable'),
		minors: []
	};
	todo.majors.push(major);
	return major;
}

export function addMinor(todo: Todo, majorId: string, title: string, proof: string): Minor {
	const major = findMajor(todo, majorId);
	if (major.mark === 'x') throw new WfError(`major ${majorId} is done; add a new major instead`);
	const minor: Minor = {
		id: `${major.id}.${Math.max(1, nextNumber(major.minors.map((n) => n.id)))}`,
		mark: ' ',
		title: required(title, 'title'),
		proof: required(proof, 'proof'),
		impl: []
	};
	major.minors.push(minor);
	return minor;
}

export function start(todo: Todo, id: string): Minor {
	if (!isMinorId(id)) throw new WfError(`start takes a minor id (x.x), got ${id}`);
	const minor = findMinor(todo, id);
	if (minor.mark !== ' ')
		throw new WfError(`${id} is already ${minor.mark === '~' ? 'in progress' : 'done'}`);
	const majorId = id.split('.')[0];
	const busy = todo.majors.find((n) => n.id !== majorId && n.minors.some((k) => k.mark === '~'));
	if (busy)
		throw new WfError(`major ${busy.id} has minors in progress; finish them before starting ${id}`);
	minor.mark = '~';
	const major = findMajor(todo, majorId);
	if (major.mark === ' ') major.mark = '~';
	return minor;
}

export function done(todo: Todo, id: string): void {
	if (isMinorId(id)) {
		const minor = findMinor(todo, id);
		if (minor.mark !== '~') throw new WfError(`${id} is not in progress; start it first`);
		minor.mark = 'x';
		return;
	}
	const major = findMajor(todo, id);
	if (!major.minors.length) throw new WfError(`major ${id} has no minors`);
	const open = major.minors.filter((n) => n.mark !== 'x').map((n) => n.id);
	if (open.length) throw new WfError(`major ${id} has unfinished minors: ${open.join(', ')}`);
	major.mark = 'x';
}

export function impl(todo: Todo, id: string, detail: string): void {
	if (!isMinorId(id)) throw new WfError(`implementation details go on a minor (x.x), got ${id}`);
	const minor = findMinor(todo, id);
	if (minor.mark === ' ') throw new WfError(`${id} hasn't started; start it first`);
	minor.impl.push(required(detail, 'detail'));
}

function required(value: string, name: string): string {
	const v = value.trim();
	if (!v) throw new WfError(`${name} is required`);
	if (v.includes('\n')) throw new WfError(`${name} must be one line`);
	return v;
}

// ---------- handoff.md ----------

export function parseHandoff(text: string, file = 'handoff.md'): Handoff {
	const lines = text.split('\n');
	if (lines.at(-1) === '') lines.pop();
	const field = (i: number, key: string): string => {
		const m = lines[i]?.match(new RegExp(`^${key}: (.+)$`));
		if (!m) throw new WfError(`${file}:${i + 1}: expected "${key}: ..."`);
		return m[1];
	};
	if (lines[0] !== '# Handoff') throw new WfError(`${file}:1: expected "# Handoff"`);
	const state = field(1, 'State') as State;
	if (!STATES.includes(state))
		throw new WfError(`${file}:2: state must be one of ${STATES.join(', ')}`);
	const open = lines.slice(6).map((_, k) => field(6 + k, 'Open'));
	return {
		state,
		active: field(2, 'Active'),
		next: field(3, 'Next'),
		verify: field(4, 'Verify'),
		dont: field(5, "Don't"),
		open: open.length === 1 && open[0] === '—' ? [] : open
	};
}

export function formatHandoff(h: Handoff): string {
	if (!STATES.includes(h.state)) throw new WfError(`state must be one of ${STATES.join(', ')}`);
	const open = h.open.length ? h.open : ['—'];
	const lines = [
		'# Handoff',
		`State: ${h.state}`,
		`Active: ${required(h.active, 'active')}`,
		`Next: ${required(h.next, 'next')}`,
		`Verify: ${required(h.verify, 'verify')}`,
		`Don't: ${required(h.dont, "don't")}`,
		...open.map((o) => `Open: ${required(o, 'open')}`)
	];
	if (lines.length > HANDOFF_MAX_LINES)
		throw new WfError(`handoff is limited to ${HANDOFF_MAX_LINES} lines`);
	return lines.join('\n') + '\n';
}

// ---------- files ----------

export function findRoot(from: string): string {
	for (let dir = from; ; dir = dirname(dir)) {
		if (existsSync(join(dir, 'docs', 'state'))) return dir;
		if (dirname(dir) === dir)
			throw new WfError(`no docs/state/ above ${from}; run wf init in the project`);
	}
}

const statePath = (root: string, name: string) => join(root, 'docs', 'state', name);

function writeAtomic(path: string, text: string): void {
	writeFileSync(`${path}.tmp`, text);
	renameSync(`${path}.tmp`, path);
}

export const readTodo = (root: string) =>
	parseTodo(readFileSync(statePath(root, 'todo.md'), 'utf8'));
export const writeTodo = (root: string, todo: Todo) =>
	writeAtomic(statePath(root, 'todo.md'), formatTodo(todo));
export const readHandoff = (root: string) =>
	parseHandoff(readFileSync(statePath(root, 'handoff.md'), 'utf8'));
export const writeHandoff = (root: string, h: Handoff) =>
	writeAtomic(statePath(root, 'handoff.md'), formatHandoff(h));
