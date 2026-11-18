// The only code that reads and writes project state. Every rule lives here (spec.md section 3).
import {
	closeSync,
	existsSync,
	mkdirSync,
	openSync,
	readdirSync,
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

/**
 * The owner's undo, from the dashboard: a minor goes back to open, a major back to in progress when
 * it has started minors and to open otherwise.
 */
export function reopen(todo: Todo, id: string): void {
	if (isMinorId(id)) {
		const minor = findMinor(todo, id);
		if (minor.mark === ' ') throw new WfError(`${id} is already open`);
		minor.mark = ' ';
		const major = findMajor(todo, id.split('.')[0]);
		if (major.mark === 'x') major.mark = '~';
		if (!major.minors.some((n) => n.mark !== ' ')) major.mark = ' ';
		return;
	}
	const major = findMajor(todo, id);
	if (major.mark !== 'x') throw new WfError(`major ${id} isn't done`);
	major.mark = major.minors.some((n) => n.mark !== ' ') ? '~' : ' ';
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
	'learnings.md': 'wf learn',
	'steers.md': 'wf steer or wf assume',
	'risks.md': 'wf risk',
	'memory.md': 'wf memory',
	...Object.fromEntries(DOC_NAMES.map((d) => [`${d}.md`, `wf doc ${d}`]))
};

/** The wf command to use instead, when `path` is a state file only wf may write. */
export function wfAlternative(path: string): string | undefined {
	const file = resolve(path);
	if (file === resolve(globalLearningsPath())) return 'wf learn --global';
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

/** The project's state is the handoff's State line. Returns the handoff before and after. */
export function setState(root: string, state: string): { before: Handoff; after: Handoff } {
	if (!STATES.includes(state as State))
		throw new WfError(`state must be one of ${STATES.join(', ')}, got ${state}`);
	const before = readHandoff(root);
	const after = { ...before, state: state as State };
	writeHandoff(root, after);
	return { before, after };
}

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

export function tryFindRoot(from: string): string | undefined {
	try {
		return findRoot(from);
	} catch {
		return undefined;
	}
}

// ---------- steers ----------

export interface Steer {
	date: string;
	affects: string[];
	kind: 'Steer' | 'Assumption';
	summary: string;
	why: string;
	changed?: string;
}

/** Reads steers.md: "## <date> · affects <ids>", then "Steer:"/"Assumption:", "Why:", optional "Changed:". */
export function parseSteers(text: string): Steer[] {
	const steers: Steer[] = [];
	for (const block of text.split(/^(?=## )/m).slice(1)) {
		const lines = block.trim().split('\n');
		const head = lines[0].match(/^## (\S+) · affects (.+)$/);
		const body = lines[1]?.match(/^(Steer|Assumption): (.+)$/);
		const why = lines[2]?.match(/^Why: (.+)$/);
		if (!head || !body || !why) throw new WfError(`steers.md: malformed entry: ${lines[0]}`);
		const changed = lines[3]?.match(/^Changed: (.+)$/)?.[1];
		steers.push({
			date: head[1],
			affects: head[2].split(/,\s*/),
			kind: body[1] as Steer['kind'],
			summary: body[2],
			why: why[1],
			...(changed && { changed })
		});
	}
	return steers;
}

/** Appends a steer or assumption. Its ids must exist ("all" is allowed); steers say what changed. */
export function addSteer(root: string, s: Omit<Steer, 'date'>): { before: string; after: string } {
	const todo = readTodo(root);
	const affects = s.affects.map((id) => required(id, 'affects'));
	if (!affects.length) throw new WfError('affects is required: the ids this changes, or all');
	for (const id of affects) {
		if (id === 'all') continue;
		if (isMinorId(id)) findMinor(todo, id);
		else findMajor(todo, id);
	}
	if (s.kind === 'Steer' && !s.changed?.trim())
		throw new WfError('a steer changes the plan first; say what changed with --changed');
	const path = statePath(root, 'steers.md');
	const before = existsSync(path) ? readFileSync(path, 'utf8') : '# Steers\n';
	parseSteers(before);
	const date = new Date().toLocaleDateString('sv');
	const entry = [
		`## ${date} · affects ${affects.join(', ')}`,
		`${s.kind}: ${escapeMd(required(s.summary, 'summary'))}`,
		`Why: ${escapeMd(required(s.why, 'why'))}`,
		...(s.changed?.trim() ? [`Changed: ${escapeMd(required(s.changed, 'changed'))}`] : [])
	];
	const after = `${before.replace(/\n+$/, '')}\n\n${entry.join('\n')}\n`;
	writeAtomic(path, after);
	return { before, after };
}

/** The steers that name an item, or its major. */
export function steersFor(root: string, id: string): Steer[] {
	const path = statePath(root, 'steers.md');
	if (!existsSync(path)) return [];
	const major = id.split('.')[0];
	return parseSteers(readFileSync(path, 'utf8')).filter(
		(s) => s.affects.includes(id) || s.affects.includes(major)
	);
}

// ---------- risks ----------

export interface Risk {
	item: string;
	action: string;
	why: string;
	level: string;
	surface: string;
	recover: string;
}

const RISK_LEVELS = ['low', 'medium', 'high'];

/**
 * Logs a high-risk action before it runs. Every field is required; a request missing any of them is
 * rejected, naming each one, and the action must not run.
 */
export function addRisk(root: string, r: Partial<Risk>): { before: string; after: string } {
	const fields: (keyof Risk)[] = ['item', 'action', 'why', 'level', 'surface', 'recover'];
	const missing = fields.filter((f) => !r[f]?.trim());
	if (missing.length)
		throw new WfError(
			`missing ${missing.map((f) => `--${f}`).join(', ')}; the action must not run until every field is given`
		);
	const risk = r as Risk;
	if (!RISK_LEVELS.includes(risk.level))
		throw new WfError(`--level is one of ${RISK_LEVELS.join(', ')}, got ${risk.level}`);
	const todo = readTodo(root);
	if (isMinorId(risk.item)) findMinor(todo, risk.item);
	else findMajor(todo, risk.item);
	const path = statePath(root, 'risks.md');
	const before = existsSync(path) ? readFileSync(path, 'utf8') : '# Risks\n';
	const date = new Date().toLocaleDateString('sv');
	const entry = [
		`## ${date} · ${risk.item} · ${risk.level}`,
		`Action: ${escapeMd(required(risk.action, 'action'))}`,
		`Why: ${escapeMd(required(risk.why, 'why'))}`,
		`Surface: ${escapeMd(required(risk.surface, 'surface'))}`,
		`Recover: ${escapeMd(required(risk.recover, 'recover'))}`
	];
	const after = `${before.replace(/\n+$/, '')}\n\n${entry.join('\n')}\n`;
	writeAtomic(path, after);
	return { before, after };
}

// ---------- .env ----------

const envPath = (root: string) => join(root, '.env');

function envLines(root: string): string[] {
	const path = envPath(root);
	return existsSync(path) ? readFileSync(path, 'utf8').replace(/\n+$/, '').split('\n') : [];
}

/** Adds or overwrites one key in .env. Values are never returned, printed or read back. */
export function envSet(root: string, key: string, value: string): 'added' | 'updated' {
	if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) throw new WfError(`not a valid env key: ${key}`);
	if (value.includes('\n')) throw new WfError('an env value is one line');
	const gitignore = join(root, '.gitignore');
	const ignored =
		existsSync(gitignore) &&
		readFileSync(gitignore, 'utf8')
			.split('\n')
			.some((l) => l.trim() === '.env');
	if (!ignored) throw new WfError('.env is not listed in .gitignore; add it there first');
	const quoted = /[\s#"'=]/.test(value) ? JSON.stringify(value) : value;
	const lines = envLines(root).filter((l) => l !== '');
	const at = lines.findIndex((l) => l.startsWith(`${key}=`));
	if (at === -1) lines.push(`${key}=${quoted}`);
	else lines[at] = `${key}=${quoted}`;
	writeAtomic(envPath(root), lines.join('\n') + '\n');
	return at === -1 ? 'added' : 'updated';
}

/** The key names in .env, nothing else. */
export const envKeys = (root: string): string[] =>
	envLines(root).flatMap((l) => l.match(/^([A-Za-z_][A-Za-z0-9_]*)=/)?.slice(1) ?? []);

/** .env itself (not .env.example or .env.local) is never read, printed or edited directly. */
export function envDenial(
	file: string | undefined,
	command: string | undefined
): string | undefined {
	const touches =
		(file !== undefined && basename(resolve(file)) === '.env') ||
		(command !== undefined &&
			!/\b(wf|cli\.ts)\s+env\b/.test(command) &&
			/(^|[\s'"=/<>:])\.env(?![\w.-])/.test(command));
	if (!touches) return undefined;
	return '.env holds the real credentials: never read, print or edit it (a fixed rule; retrying will be denied again). Use wf env set <KEY> <value> and wf env keys; .env.example and .env.local are free to use.';
}

// ---------- memory, find, get ----------

const MEMORY_SECTIONS: Record<string, string> = {
	invariants: 'Invariants',
	contracts: 'Contracts',
	pitfalls: 'Pitfalls',
	'anti-patterns': 'Anti-patterns'
};

/** Line range [start, end) of a "## <title>" section, the heading line excluded; fences respected. */
function sectionRange(lines: string[], title: string): [number, number] | undefined {
	const heads = topHeadings(lines);
	const start = lines.findIndex((l, k) => heads[k] && l === `## ${title}`);
	if (start === -1) return undefined;
	const end = heads.findIndex((h, k) => k > start && h);
	return [start + 1, end === -1 ? lines.length : end];
}

/**
 * Appends to a memory.md section in its fixed shape: invariants and anti-patterns numbered,
 * pitfalls dated, contracts as bullets.
 */
export function addMemory(
	root: string,
	section: string,
	text: string
): { before: string; after: string } {
	const title = MEMORY_SECTIONS[section];
	if (!title)
		throw new WfError(
			`memory section is one of ${Object.keys(MEMORY_SECTIONS).join(', ')}, got ${section}`
		);
	const entry = escapeMd(required(text, 'entry'));
	const path = statePath(root, 'memory.md');
	const before = readFileSync(path, 'utf8');
	const lines = before.replace(/\n+$/, '').split('\n');
	const range = sectionRange(lines, title);
	if (!range) throw new WfError(`memory.md has no "## ${title}" section`);
	const start = range[0];
	let end = range[1];
	while (end > start && lines[end - 1].trim() === '') end--;
	const numbered = title === 'Invariants' || title === 'Anti-patterns';
	const count = lines.slice(start, end).filter((l) => /^\d+\. /.test(l)).length;
	const line = numbered
		? `${count + 1}. ${entry}`
		: title === 'Pitfalls'
			? `- ${new Date().toLocaleDateString('sv')}: ${entry}`
			: `- ${entry}`;
	const insert = end === start ? ['', line] : [line];
	lines.splice(end, 0, ...insert);
	const after = lines.join('\n') + '\n';
	writeAtomic(path, after);
	return { before, after };
}

export interface Deferred {
	item: string;
	resolves: string;
}

const DEFERRED_ROW = /^\| (.+) \| (\d+(?:\.\d+)?) \|$/;

function deferredRows(root: string): Deferred[] {
	const lines = readFileSync(statePath(root, 'memory.md'), 'utf8').split('\n');
	const range = sectionRange(lines, 'Deferred');
	if (!range) return [];
	return lines.slice(...range).flatMap((l) => {
		const m = l.match(DEFERRED_ROW);
		return m ? [{ item: m[1], resolves: m[2] }] : [];
	});
}

/** Adds a row to memory.md's Deferred table; the item that resolves it must exist. */
export function addDeferred(
	root: string,
	text: string,
	resolves: string
): { before: string; after: string } {
	const item = escapeMd(required(text, 'item')).replaceAll('|', '\\|');
	const todo = readTodo(root);
	if (isMinorId(resolves)) findMinor(todo, resolves);
	else findMajor(todo, required(resolves, '--resolves'));
	const path = statePath(root, 'memory.md');
	const before = readFileSync(path, 'utf8');
	const lines = before.replace(/\n+$/, '').split('\n');
	const range = sectionRange(lines, 'Deferred');
	if (!range) throw new WfError('memory.md has no "## Deferred" section');
	const [start, end] = range;
	const last = lines.slice(start, end).findLastIndex((l) => l.startsWith('|'));
	if (last === -1)
		throw new WfError('memory.md\'s Deferred section has no "| Item | Resolves in |" table');
	lines.splice(start + last + 1, 0, `| ${item} | ${resolves} |`);
	const after = lines.join('\n') + '\n';
	writeAtomic(path, after);
	return { before, after };
}

/** Deferred items resolved by an item, or (for a major) by any of its minors. */
export const deferredFor = (root: string, id: string): Deferred[] =>
	deferredRows(root).filter((d) => d.resolves === id || d.resolves.split('.')[0] === id);

// ---------- section editing (the dashboard) ----------

/** Reads risks.md: "## <date> · <item> · <level>", then Action, Why, Surface and Recover. */
export function parseRisks(text: string): (Risk & { date: string })[] {
	return text
		.split(/^(?=## )/m)
		.slice(1)
		.map((block) => {
			const lines = block.trim().split('\n');
			const head = lines[0].match(/^## (\S+) · (\S+) · (\S+)$/);
			const field = (i: number, name: string) =>
				lines[i]?.match(new RegExp(`^${name}: (.+)$`))?.[1];
			const [action, why, surface, recover] = ['Action', 'Why', 'Surface', 'Recover'].map((n, i) =>
				field(i + 1, n)
			);
			if (!head || !action || !why || !surface || !recover || lines.length !== 5)
				throw new WfError(
					`risks.md: malformed entry: ${lines[0]} (a heading, then Action, Why, Surface, Recover)`
				);
			if (!RISK_LEVELS.includes(head[3]))
				throw new WfError(`risks.md: ${lines[0]}: level is one of ${RISK_LEVELS.join(', ')}`);
			return { date: head[1], item: head[2], level: head[3], action, why, surface, recover };
		});
}

/** memory.md keeps the sections wf memory and wf defer write to, and the Deferred table. */
function checkMemory(text: string): void {
	const lines = text.split('\n');
	for (const title of [...Object.values(MEMORY_SECTIONS), 'Deferred'])
		if (!sectionRange(lines, title)) throw new WfError(`memory.md needs its "## ${title}" section`);
	const [start, end] = sectionRange(lines, 'Deferred')!;
	if (!lines.slice(start, end).some((l) => l.startsWith('| Item | Resolves in |')))
		throw new WfError('memory.md\'s Deferred section keeps its "| Item | Resolves in |" table');
}

/** The files whose sections the dashboard edits, with the rule the whole file must still pass. */
const SECTION_RULES: Record<string, (text: string) => void> = {
	'steers.md': (text) => void parseSteers(text),
	'risks.md': (text) => void parseRisks(text),
	'memory.md': checkMemory,
	...Object.fromEntries(DOC_NAMES.map((d) => [`${d}.md`, () => {}]))
};
export const SECTION_FILES = Object.keys(SECTION_RULES);

export interface Section {
	heading: string;
	/** The section as written: its "## " line, then its body. */
	text: string;
}

/** A file's lines, its "## " section starts, and where each section ends; fences respected. */
function sectionSpans(path: string): { lines: string[]; spans: [number, number][] } {
	const lines = readFileSync(path, 'utf8').replace(/\n+$/, '').split('\n');
	const heads = topHeadings(lines);
	const starts = lines.flatMap((l, i) => (heads[i] && l.startsWith('## ') ? [i] : []));
	const spans = starts.map((start): [number, number] => {
		const end = heads.findIndex((h, k) => k > start && h);
		return [start, end === -1 ? lines.length : end];
	});
	return { lines, spans };
}

function sectionFile(root: string, file: string): string {
	if (!SECTION_RULES[file])
		throw new WfError(`${file} isn't edited by section; one of ${SECTION_FILES.join(', ')}`);
	const path = statePath(root, file);
	if (!existsSync(path)) throw new WfError(`no docs/state/${file}`);
	return path;
}

/** What comes before the first section (the title and any intro), and each "## " section. */
export function readSections(
	root: string,
	file: string
): { preamble: string; sections: Section[] } {
	const { lines, spans } = sectionSpans(sectionFile(root, file));
	const preamble = lines
		.slice(0, spans[0]?.[0] ?? lines.length)
		.join('\n')
		.trim();
	const sections = spans.map(([start, end]) => ({
		heading: lines[start].slice(3),
		text: lines.slice(start, end).join('\n').trimEnd()
	}));
	return { preamble, sections };
}

/**
 * Replaces section `index` (0-based) with `text`, which starts with its "## " line. Only that
 * section's lines change; the whole file must still pass its own rules, or nothing is written.
 */
export function writeSection(
	root: string,
	file: string,
	index: number,
	text: string
): { before: string; after: string } {
	const path = sectionFile(root, file);
	const before = readFileSync(path, 'utf8');
	const { lines, spans } = sectionSpans(path);
	if (!Number.isInteger(index) || index < 0 || index >= spans.length)
		throw new WfError(`${file} has no section ${index + 1}; it has ${spans.length}`);
	const block = text.replace(/\r/g, '').trim().split('\n');
	if (!block[0].startsWith('## '))
		throw new WfError('a section starts with its "## <heading>" line');
	if (topHeadings(block).slice(1).includes(true))
		throw new WfError('a section has one "## " heading; use "### " inside it');
	checkNoBareTags(block.join('\n'), file);
	const [start, end] = spans[index];
	lines.splice(start, end - start, ...block, ...(end < lines.length ? [''] : []));
	const after = lines.join('\n') + '\n';
	SECTION_RULES[file](after);
	writeAtomic(path, after);
	return { before, after };
}

/** Case-insensitive search across every docs/state/ file: "file:line: text". */
export function findInState(root: string, text: string): string[] {
	const needle = required(text, 'search text').toLowerCase();
	const dir = join(root, 'docs', 'state');
	return readdirSync(dir)
		.filter((f) => f.endsWith('.md'))
		.sort()
		.flatMap((f) =>
			readFileSync(join(dir, f), 'utf8')
				.split('\n')
				.flatMap((l, i) => (l.toLowerCase().includes(needle) ? [`${f}:${i + 1}: ${l}`] : []))
		);
}

/** One docs/state/ file, or one "## <section>" of it. */
export function getState(root: string, name: string, section?: string): string {
	const file = name.endsWith('.md') ? name : `${name}.md`;
	const path = statePath(root, file);
	if (!existsSync(path)) throw new WfError(`no docs/state/${file}`);
	const text = readFileSync(path, 'utf8');
	if (section === undefined) return text.replace(/\n+$/, '');
	const lines = text.split('\n');
	const range = sectionRange(lines, section);
	if (!range) throw new WfError(`${file} has no "## ${section}" section`);
	return [`## ${section}`, ...lines.slice(...range)].join('\n').replace(/\n+$/, '');
}

// ---------- session context and learnings ----------

/** Claude Code caps hook context at 10,000 characters; keep headroom below it. */
export const CONTEXT_BUDGET = 9000;
const LEARNING_MAX = 200;

/**
 * What session start injects: global learnings always; inside a wf project also admin mode when
 * on, the instructions for its current state, its learnings and its handoff.
 */
export function sessionContext(root: string | undefined): string {
	const parts = [section('Global learnings (from wf)', globalLearningsPath())];
	if (root) {
		const state = readHandoff(root).state;
		if (isAdmin(root))
			parts.push(
				'Admin mode is on for this project (set by the owner): no wf restriction applies until the owner turns it off.'
			);
		parts.push(
			`Instructions for the ${state} state (from wf):\n${stateInstructions(state)}`,
			section(`Project learnings for ${root} (from wf)`, projectLearningsPath(root)),
			section('Project handoff (from wf)', statePath(root, 'handoff.md'))
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

/** A learnings file: `# Learnings`, then lessons numbered 1..n, one per line. */
export function parseLearnings(text: string, file: string): string[] {
	const lines = text.split('\n');
	if (lines[0] !== '# Learnings') throw new WfError(`${file}:1: expected "# Learnings"`);
	const lessons: string[] = [];
	lines.slice(1).forEach((line, i) => {
		if (!line.trim()) return;
		const m = line.match(/^(\d+)\. (.+)$/);
		if (!m || Number(m[1]) !== lessons.length + 1)
			throw new WfError(`${file}:${i + 2}: expected "${lessons.length + 1}. <learning>": ${line}`);
		lessons.push(m[2]);
	});
	return lessons;
}

export const formatLearnings = (lessons: string[]): string =>
	lessons.length
		? `# Learnings\n\n${lessons.map((l, i) => `${i + 1}. ${l}`).join('\n')}\n`
		: '# Learnings\n';

function learningsPath(root: string | undefined, global: boolean): string {
	if (!global && !root) throw new WfError('no project here; use --global for every project');
	return global ? globalLearningsPath() : projectLearningsPath(root!);
}

/** The project's learnings, or (global) every project's, in order. */
export function readLearnings(root: string | undefined, global: boolean): string[] {
	const path = learningsPath(root, global);
	return existsSync(path) ? parseLearnings(readFileSync(path, 'utf8'), path) : [];
}

function checkLearning(text: string): string {
	const line = required(text, 'learning');
	if (!line.includes('→'))
		throw new WfError('a learning reads "what went wrong → what to do instead"');
	if (line.length > LEARNING_MAX)
		throw new WfError(
			`a learning is at most ${LEARNING_MAX} characters; this one is ${line.length}`
		);
	return line;
}

/** The index of learning n, or an error naming how many there are. */
function learningIndex(lessons: string[], n: number): number {
	if (!Number.isInteger(n) || n < 1 || n > lessons.length)
		throw new WfError(
			`no learning ${n}; there ${lessons.length === 1 ? 'is 1' : `are ${lessons.length}`}`
		);
	return n - 1;
}

/**
 * Applies one change to a learnings file. With `budget`, the change is rolled back, and refused, when
 * any affected project's session context would pass the budget; a global file affects every project.
 */
function changeLearnings(
	root: string | undefined,
	global: boolean,
	change: (lessons: string[]) => void,
	budget: boolean
): { path: string; before: string; after: string } {
	const path = learningsPath(root, global);
	const before = existsSync(path) ? readFileSync(path, 'utf8') : '# Learnings\n';
	const lessons = parseLearnings(before, path);
	change(lessons);
	const after = formatLearnings(lessons);
	mkdirSync(dirname(path), { recursive: true });
	writeAtomic(path, after);
	if (!budget) return { path, before, after };
	const roots = global
		? [...new Set([...Object.keys(readRegistry()), ...(root ? [root] : [])])]
		: [root!];
	const over = roots
		.filter((r) => existsSync(statePath(r, 'handoff.md')))
		.map((r) => ({ r, size: sessionContext(r).length }))
		.find((x) => x.size > CONTEXT_BUDGET);
	if (over) {
		writeAtomic(path, before);
		throw new WfError(
			`this learning would bring ${over.r}'s session context to ${over.size} characters, over the ${CONTEXT_BUDGET} budget; merge or prune learnings first`
		);
	}
	return { path, before, after };
}

/** Appends a learning, "what went wrong → what to do instead", within the budget. */
export function addLearning(root: string | undefined, text: string, global: boolean) {
	const line = checkLearning(text);
	return changeLearnings(root, global, (lessons) => lessons.push(line), true);
}

/** Rewrites learning n in place, under the same rules and budget as adding one. */
export function editLearning(root: string | undefined, n: number, text: string, global: boolean) {
	const line = checkLearning(text);
	return changeLearnings(
		root,
		global,
		(lessons) => (lessons[learningIndex(lessons, n)] = line),
		true
	);
}

/** Removes learning n; the rest are renumbered. This is how a merge or a prune is done. */
export function removeLearning(root: string | undefined, n: number, global: boolean) {
	return changeLearnings(
		root,
		global,
		(lessons) => lessons.splice(learningIndex(lessons, n), 1),
		false
	);
}

const registryPath = () => join(wfHome(), 'local', 'projects.json');

/** Machine-local facts about a registered project. */
export interface ProjectEntry {
	/** The owner wrote "setup done" while the project was in setup; pushing is allowed from then on. */
	setupDone?: boolean;
	/** Owner-only: while on, no wf restriction applies to this project. */
	admin?: boolean;
}

export const isAdmin = (root: string) => readRegistry()[root]?.admin === true;

/** Only the owner calls this: the CLI refuses inside Claude Code and the hooks guard the store. */
export function setAdmin(root: string, on: boolean): void {
	if (!(root in readRegistry())) throw new WfError(`${root} isn't a registered project`);
	updateRegistry(root, (entry) => (entry.admin = on));
}

/**
 * Denies any agent attempt to touch admin mode: the registry file, `wf admin`, or the dashboard's
 * admin action. Pattern checks can't catch every variant; the guidance forbids trying.
 */
export function adminDenial(
	file: string | undefined,
	command: string | undefined
): string | undefined {
	const touchesStore =
		(file !== undefined && resolve(file) === registryPath()) ||
		(command !== undefined &&
			(command.includes('projects.json') ||
				/\b(wf|cli\.ts)\s+admin\b/.test(command) ||
				command.includes('?/admin')));
	if (!touchesStore) return undefined;
	return 'Admin mode belongs to the owner alone; the model never enters, leaves or touches it (a fixed rule; retrying will be denied again).';
}

export function readRegistry(): Record<string, ProjectEntry> {
	const path = registryPath();
	return existsSync(path)
		? (JSON.parse(readFileSync(path, 'utf8')) as Record<string, ProjectEntry>)
		: {};
}

function updateRegistry(root: string, change: (entry: ProjectEntry) => void): void {
	const registry = readRegistry();
	change((registry[root] ??= {}));
	mkdirSync(dirname(registryPath()), { recursive: true });
	writeAtomic(registryPath(), JSON.stringify(registry, null, '\t') + '\n');
}

const register = (root: string) => updateRegistry(root, () => {});

// ---------- state rules for hooks ----------

/** True when the owner's prompt says "setup done" and the project is in setup; records it. */
export function recordSetupDone(root: string, prompt: string): boolean {
	if (readHandoff(root).state !== 'setup' || !/\bsetup done\b/i.test(prompt)) return false;
	updateRegistry(root, (entry) => (entry.setupDone = true));
	return true;
}

/** In discuss, only state and scratch/temp/ may be written: planning goes through wf. */
export function discussDenial(root: string, file: string): string | undefined {
	if (readHandoff(root).state !== 'discuss') return undefined;
	const path = resolve(file);
	const allowed = [join(root, 'docs', 'state'), join(root, 'scratch', 'temp')];
	if (!path.startsWith(root + '/') || allowed.some((dir) => path.startsWith(dir + '/')))
		return undefined;
	return `The project is in discuss, so project files stay unchanged (a fixed rule; retrying will be denied again). Plan through wf: write text in scratch/temp/, then wf doc or wf batch. The owner switches to build.`;
}

/** Linked projects are read-only: nothing writes into another project. */
export function linksDenial(root: string, file: string): string | undefined {
	if (!resolve(file).startsWith(join(root, 'scratch', 'links') + '/')) return undefined;
	return 'scratch/links/ holds other projects, read-only: never write into another project (a fixed rule; retrying will be denied again). Anything needed from it goes to the owner.';
}

/** Headless Claude sessions can bill API credits; they are never started. */
export function claudeDenial(command: string): string | undefined {
	if (!/\bclaude\b[^\n]*\s(-p|--print)\b/.test(command)) return undefined;
	return 'Starting Claude sessions (claude -p, --print) is never allowed: they can spend API credits (a fixed rule; retrying will be denied again).';
}

/** In setup, no push until the owner has written "setup done". */
export function pushDenial(root: string, command: string): string | undefined {
	if (readHandoff(root).state !== 'setup' || !/\bgit\b[^\n]*\bpush\b/.test(command))
		return undefined;
	if (readRegistry()[root]?.setupDone) return undefined;
	return `The project is in setup and the owner hasn't written "setup done" yet, so pushing is blocked (a fixed rule; retrying will be denied again). Amend the init commit and wait for "setup done".`;
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
