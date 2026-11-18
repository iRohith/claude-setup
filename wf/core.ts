// The only code that reads and writes project state. Every rule lives here (spec.md section 3).
import {
	closeSync,
	existsSync,
	mkdirSync,
	openSync,
	readFileSync,
	renameSync,
	unlinkSync,
	writeFileSync,
	writeSync
} from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

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

// ---------- markdown safety ----------

// Markdown passes a bare <word> through as an HTML tag; an unclosed <title> hides the rest of the
// page. So state files store `<` outside code spans as `\<`; in memory the text is plain.
const outsideCode = (text: string, fn: (s: string) => string) =>
	text
		.split('`')
		.map((part, i) => (i % 2 ? part : fn(part)))
		.join('`');
export const escapeMd = (text: string) => outsideCode(text, (s) => s.replaceAll('<', '\\<'));
export const unescapeMd = (text: string) => outsideCode(text, (s) => s.replaceAll('\\<', '<'));

/** For each line: whether it belongs to a ``` code fence (the fence lines included). */
function fencedLines(lines: string[]): boolean[] {
	let open = false;
	return lines.map((line) => {
		if (/^\s*```/.test(line)) {
			open = !open;
			return true;
		}
		return open;
	});
}

/** A markdown heading of level 1 or 2 outside code fences: where a section starts or ends. */
const topHeadings = (lines: string[]): boolean[] => {
	const fenced = fencedLines(lines);
	return lines.map((l, i) => !fenced[i] && /^#{1,2} /.test(l));
};

/** For whole markdown documents: names the first line with a bare tag outside code. */
function checkNoBareTags(text: string, file: string): void {
	const lines = text.split('\n');
	const fenced = fencedLines(lines);
	lines.forEach((line, i) => {
		if (fenced[i]) return;
		const bare = line.replace(/`[^`]*`/g, '').match(/(?<!\\)<\/?[A-Za-z][^>]*>/);
		if (bare)
			throw new WfError(
				`${file}, line ${i + 1}: ${bare[0]} outside code renders as an HTML tag; put it in backticks or write \\${bare[0]}`
			);
	});
}

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
			major = {
				id: m[2],
				mark: m[1] as Mark,
				title: unescapeMd(m[3]),
				deliverable: '',
				minors: []
			};
			const dl = lines[++i]?.match(/^Deliverable: (.+)$/);
			if (!dl) fail(i, 'expected "Deliverable: ..." under the major');
			major.deliverable = unescapeMd(dl![1]);
			todo.majors.push(major);
			minor = undefined;
		} else if ((m = line.match(/^- \[([ ~x])\] (\d+\.\d+) (.+)$/))) {
			if (!major) fail(i, 'minor before any major');
			if (!m[2].startsWith(`${major!.id}.`))
				fail(i, `minor ${m[2]} is not under major ${major!.id}`);
			const pr = lines[++i]?.match(/^ {2}Proof: (.+)$/);
			if (!pr) fail(i, 'expected "  Proof: ..." under the minor');
			minor = {
				id: m[2],
				mark: m[1] as Mark,
				title: unescapeMd(m[3]),
				proof: unescapeMd(pr![1]),
				impl: []
			};
			major!.minors.push(minor);
		} else if ((m = line.match(/^ {2}- (.+)$/))) {
			if (!minor) fail(i, 'implementation detail outside a minor');
			minor!.impl.push(unescapeMd(m[1]));
		} else {
			fail(i, `unrecognised line: ${line}`);
		}
	}
	checkIds(todo);
	sortById(todo);
	return todo;
}

/** Position follows the id: majors by number, minors by number within their major. */
function sortById(todo: Todo): void {
	const n = (id: string) => Number(id.split('.').at(-1));
	todo.majors.sort((a, b) => n(a.id) - n(b.id));
	for (const major of todo.majors) major.minors.sort((a, b) => n(a.id) - n(b.id));
}

export function formatTodo(todo: Todo): string {
	const out = ['# Todo', ''];
	for (const major of todo.majors) {
		out.push(
			`## [${major.mark}] ${major.id} · ${escapeMd(major.title)}`,
			`Deliverable: ${escapeMd(major.deliverable)}`,
			''
		);
		for (const minor of major.minors) {
			out.push(
				`- [${minor.mark}] ${minor.id} ${escapeMd(minor.title)}`,
				`  Proof: ${escapeMd(minor.proof)}`
			);
			for (const detail of minor.impl) out.push(`  - ${escapeMd(detail)}`);
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
	minor.mark = '~';
	const major = findMajor(todo, id.split('.')[0]);
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

export interface ItemChanges {
	title?: string;
	proof?: string;
	deliverable?: string;
}

/** Changes the text of an item. Proofs belong to minors, deliverables to majors. */
export function editItem(todo: Todo, id: string, changes: ItemChanges): void {
	if (
		changes.title === undefined &&
		changes.proof === undefined &&
		changes.deliverable === undefined
	)
		throw new WfError('nothing to change; pass --title, --proof or --deliverable');
	if (isMinorId(id)) {
		if (changes.deliverable !== undefined)
			throw new WfError(`${id} is a minor; minors have a proof, not a deliverable`);
		const minor = findMinor(todo, id);
		if (changes.title !== undefined) minor.title = required(changes.title, 'title');
		if (changes.proof !== undefined) minor.proof = required(changes.proof, 'proof');
		return;
	}
	if (changes.proof !== undefined)
		throw new WfError(`${id} is a major; majors have a deliverable, not a proof`);
	const major = findMajor(todo, id);
	if (changes.title !== undefined) major.title = required(changes.title, 'title');
	if (changes.deliverable !== undefined)
		major.deliverable = required(changes.deliverable, 'deliverable');
}

/**
 * Applies a batch file, in the todo.md shape without ids or marks, all or nothing:
 *   ## <title>            a new major; the next line must be "Deliverable: ..."
 *   ## <id>               an existing major, to add minors to
 *   - <title>             a new minor under the header above; the next line must be "  Proof: ..."
 * Blank lines are ignored. Errors name the batch file's line and nothing is written.
 */
export function applyBatch(todo: Todo, text: string, file = 'batch'): string[] {
	const lines = text.split('\n');
	const work: Todo = structuredClone(todo);
	const added: string[] = [];
	let major: Major | undefined;
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const at = (fn: () => void) => {
			try {
				fn();
			} catch (e) {
				if (e instanceof WfError) throw new WfError(`${file}:${i + 1}: ${e.message}`);
				throw e;
			}
		};
		let m: RegExpMatchArray | null;
		if (line.trim() === '') continue;
		if ((m = line.match(/^## (\d+)$/))) {
			const id = m[1];
			at(() => {
				major = findMajor(work, id);
				if (major.mark === 'x') throw new WfError(`major ${id} is done; add a new major instead`);
			});
		} else if ((m = line.match(/^## (.+)$/))) {
			const title = m[1];
			const dl = lines[i + 1]?.match(/^Deliverable: (.+)$/);
			if (!dl) throw new WfError(`${file}:${i + 2}: expected "Deliverable: ..." under the major`);
			at(() => {
				major = addMajor(work, title, dl[1]);
				added.push(major.id);
			});
			i++;
		} else if ((m = line.match(/^- (.+)$/))) {
			const title = m[1];
			const pr = lines[i + 1]?.match(/^ {2}Proof: (.+)$/);
			if (!pr) throw new WfError(`${file}:${i + 2}: expected "  Proof: ..." under the minor`);
			if (!major)
				throw new WfError(`${file}:${i + 1}: a minor needs a "## " major header above it`);
			const parent = major;
			at(() => added.push(addMinor(work, parent.id, title, pr[1]).id));
			i++;
		} else {
			throw new WfError(`${file}:${i + 1}: unrecognised line: ${line}`);
		}
	}
	if (!added.length) throw new WfError(`${file}: nothing to add`);
	todo.majors = work.majors;
	return added;
}

// ---------- todo queries ----------

export const activeMinors = (todo: Todo): Minor[] =>
	todo.majors.flatMap((n) => n.minors.filter((k) => k.mark === '~'));

/**
 * The first open minor, in id order, of the first unfinished major that has one; otherwise the first
 * unfinished major with no minors or with every minor done (it needs minors, or checking). Minors
 * still in progress elsewhere (waiting on the owner, say) never hold up the next item.
 */
export function nextItem(todo: Todo): Minor | Major | undefined {
	const unfinished = todo.majors.filter((n) => n.mark !== 'x');
	for (const major of unfinished) {
		const open = major.minors.find((k) => k.mark === ' ');
		if (open) return open;
	}
	return unfinished.find((n) => n.minors.every((k) => k.mark === 'x'));
}

export const isMinor = (item: Minor | Major): item is Minor => isMinorId(item.id);

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
		return unescapeMd(m[1]);
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
		`Active: ${escapeMd(required(h.active, 'active'))}`,
		`Next: ${escapeMd(required(h.next, 'next'))}`,
		`Verify: ${escapeMd(required(h.verify, 'verify'))}`,
		`Don't: ${escapeMd(required(h.dont, "don't"))}`,
		...open.map((o) => `Open: ${escapeMd(required(o, 'open'))}`)
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

export function writeAtomic(path: string, text: string): void {
	writeFileSync(`${path}.tmp`, text);
	renameSync(`${path}.tmp`, path);
}

export const DOC_NAMES = ['overview', 'intent', 'references', 'implementation', 'spec'] as const;
export type DocName = (typeof DOC_NAMES)[number];

/**
 * State files only wf may write, each with the command that writes it. A file joins when wf gains
 * that command, so a denial can always name the alternative.
 */
const WF_OWNED: Record<string, string> = {
	'todo.md': 'wf add, edit, batch, start, done or impl',
	'handoff.md': 'wf handoff',
	...Object.fromEntries(DOC_NAMES.map((d) => [`${d}.md`, `wf doc ${d}`]))
};

/** The wf command to use instead, when `path` is a state file only wf may write. */
export function wfAlternative(path: string): string | undefined {
	const file = resolve(path);
	const dir = dirname(file);
	if (basename(dir) !== 'state' || basename(dirname(dir)) !== 'docs') return undefined;
	return WF_OWNED[basename(file)];
}

/**
 * Writes one of the plan documents: the whole file (text must start with "# "), or the body of one
 * "## <section>" (replaced in place, or appended when new). Returns the text before and after.
 */
export function writeDoc(
	root: string,
	name: string,
	text: string,
	section?: string
): { before: string; after: string } {
	if (!(DOC_NAMES as readonly string[]).includes(name))
		throw new WfError(`no document ${name}; one of ${DOC_NAMES.join(', ')}`);
	const path = statePath(root, `${name}.md`);
	const before = existsSync(path) ? readFileSync(path, 'utf8') : '';
	const body = text.trim();
	if (!body) throw new WfError('the document text is empty');
	checkNoBareTags(body, `the ${name} text`);
	let after: string;
	if (section === undefined) {
		if (!body.startsWith('# ')) throw new WfError('a whole document starts with "# <Title>"');
		after = body + '\n';
	} else {
		const heading = `## ${required(section, 'section')}`;
		if (topHeadings(body.split('\n')).includes(true))
			throw new WfError(
				'a section body has no "# " or "## " headings outside code fences; use "### " inside it'
			);
		const lines = before.replace(/\n+$/, '').split('\n');
		const heads = topHeadings(lines);
		const start = lines.findIndex((l, k) => heads[k] && l === heading);
		const block = [heading, '', body];
		if (start === -1) {
			lines.push('', ...block);
		} else {
			let end = heads.findIndex((h, k) => k > start && h);
			if (end === -1) end = lines.length;
			const tail = end < lines.length ? [''] : [];
			lines.splice(start, end - start, ...block, ...tail);
		}
		after = lines.join('\n') + '\n';
	}
	writeAtomic(path, after);
	return { before, after };
}

/** One writer at a time per project. A lock left by a dead process is taken over. */
export function withLock<T>(root: string, fn: () => T): T {
	const dir = join(root, 'scratch', 'temp');
	mkdirSync(dir, { recursive: true });
	const path = join(dir, 'wf.lock');
	let fd: number;
	try {
		fd = openSync(path, 'wx');
	} catch (e) {
		if ((e as NodeJS.ErrnoException).code !== 'EEXIST') throw e;
		const pid = Number(readFileSync(path, 'utf8'));
		if (alive(pid)) throw new WfError(`state is being written by process ${pid}; retry`);
		fd = openSync(path, 'w');
	}
	try {
		writeSync(fd, String(process.pid));
		closeSync(fd);
		return fn();
	} finally {
		unlinkSync(path);
	}
}

function alive(pid: number): boolean {
	if (!Number.isInteger(pid) || pid <= 0) return false;
	try {
		process.kill(pid, 0);
		return true;
	} catch (e) {
		return (e as NodeJS.ErrnoException).code === 'EPERM';
	}
}

export const readTodo = (root: string) =>
	parseTodo(readFileSync(statePath(root, 'todo.md'), 'utf8'));
export const writeTodo = (root: string, todo: Todo) =>
	writeAtomic(statePath(root, 'todo.md'), formatTodo(todo));
export const readHandoff = (root: string) =>
	parseHandoff(readFileSync(statePath(root, 'handoff.md'), 'utf8'));
export const writeHandoff = (root: string, h: Handoff) =>
	writeAtomic(statePath(root, 'handoff.md'), formatHandoff(h));

export const countLearnings = (path: string): number =>
	existsSync(path)
		? readFileSync(path, 'utf8')
				.split('\n')
				.filter((l) => /^\d+\. /.test(l)).length
		: 0;

// ---------- projects ----------

/** claude-setup itself: global learnings and the machine-local project registry live here. */
export const wfHome = (): string =>
	process.env.WF_HOME ?? fileURLToPath(new URL('..', import.meta.url));

export const globalLearningsPath = () => join(wfHome(), 'global', 'learnings.md');

/** Instructions ship with wf itself, unlike the data under WF_HOME. */
export const globalFile = (name: string) =>
	fileURLToPath(new URL(`../global/${name}`, import.meta.url));

/** The "## <state>" section of global/states.md: what to do in that state. */
export function stateInstructions(state: State): string {
	const path = globalFile('states.md');
	const lines = readFileSync(path, 'utf8').split('\n');
	const start = lines.indexOf(`## ${state}`);
	if (start === -1) throw new WfError(`${path} has no "## ${state}" section`);
	let end = lines.findIndex((l, k) => k > start && l.startsWith('## '));
	if (end === -1) end = lines.length;
	return lines
		.slice(start + 1, end)
		.join('\n')
		.trim();
}
export const projectLearningsPath = (root: string) => statePath(root, 'learnings.md');

const registryPath = () => join(wfHome(), 'local', 'projects.json');

export function readRegistry(): Record<string, object> {
	const path = registryPath();
	return existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as Record<string, object>) : {};
}

function register(root: string): void {
	const registry = readRegistry();
	registry[root] ??= {};
	mkdirSync(dirname(registryPath()), { recursive: true });
	writeAtomic(registryPath(), JSON.stringify(registry, null, '\t') + '\n');
}

const TEMPLATES: Record<string, string> = {
	'overview.md': '# Overview\n',
	'intent.md': '# Intent\n',
	'references.md': '# References\n',
	'implementation.md': '# Implementation\n',
	'spec.md': '# Spec\n',
	'todo.md': '# Todo\n',
	'memory.md':
		'# Memory\n\n## Invariants\n\n## Contracts\n\n## Pitfalls\n\n## Anti-patterns\n\n## Deferred\n\n| Item | Resolves in |\n|---|---|\n',
	'learnings.md': '# Learnings\n',
	'steers.md': '# Steers\n',
	'risks.md': '# Risks\n'
};

/**
 * Creates docs/state/ from empty templates in setup state and registers the project. A project that
 * already has docs/state/ is only registered, after its todo and handoff parse.
 */
export function initProject(dir: string): { root: string; created: boolean } {
	const root = resolve(dir);
	const stateDir = join(root, 'docs', 'state');
	if (existsSync(stateDir)) {
		readTodo(root);
		readHandoff(root);
		register(root);
		return { root, created: false };
	}
	mkdirSync(stateDir, { recursive: true });
	for (const [name, text] of Object.entries(TEMPLATES)) writeFileSync(join(stateDir, name), text);
	writeHandoff(root, {
		state: 'setup',
		active: '—',
		next: 'the owner names the stack, the checks and any pre-push commands',
		verify: '—',
		dont: 'commit anything but `init`; push before the owner says "setup done"',
		open: []
	});
	register(root);
	return { root, created: true };
}
