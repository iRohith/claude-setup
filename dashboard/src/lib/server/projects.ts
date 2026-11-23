// Reads registered projects through the wf core. The dashboard holds no state rules of its own.
import { basename } from 'node:path';
import { fail } from '@sveltejs/kit';
import { marked } from 'marked';
import * as wf from 'wf';

/** A major's progress: one mark per minor, drawn as the segmented track. */
export interface Track {
	id: string;
	title: string;
	marks: wf.Mark[];
}

/** What the sidebar shows for each project. */
export interface ProjectTab {
	root: string;
	name: string;
	state?: wf.State;
	admin: boolean;
	current?: Track;
}

export interface ProjectSummary extends ProjectTab {
	active: string[];
	next?: string;
	error?: string;
}

export interface ProjectView {
	summary: ProjectSummary;
	todo?: wf.Todo;
}

/** The project page's views: the todo, then each state record, then the plan documents. */
export const VIEWS = ['todo', 'steers', 'risks', 'memory', 'learnings', 'docs'] as const;
export type View = (typeof VIEWS)[number];
export const DOCS = wf.DOC_NAMES;

export const registeredRoots = (): string[] => Object.keys(wf.readRegistry()).sort();

/** The major a project is on: the first unfinished one, else the last. */
function currentMajor(todo: wf.Todo): Track | undefined {
	const major = todo.majors.find((m) => m.mark !== 'x') ?? todo.majors.at(-1);
	return major && { id: major.id, title: major.title, marks: major.minors.map((n) => n.mark) };
}

/** For the sidebar: every registered project, with its state and current major. */
export const tabs = (): ProjectTab[] =>
	registeredRoots().map((root) => {
		const tab = { root, name: basename(root), admin: wf.isAdmin(root) };
		try {
			return {
				...tab,
				state: wf.readHandoff(root).state,
				current: currentMajor(wf.readTodo(root))
			};
		} catch {
			return tab;
		}
	});

export function summarize(root: string): ProjectSummary {
	const base = { root, name: basename(root), active: [], admin: wf.isAdmin(root) };
	try {
		const todo = wf.readTodo(root);
		const next = wf.nextItem(todo);
		return {
			...base,
			state: wf.readHandoff(root).state,
			current: currentMajor(todo),
			active: wf.activeMinors(todo).map((n) => `${n.id} ${n.title}`),
			next: next && `${next.id} ${next.title}`
		};
	} catch (e) {
		return { ...base, error: e instanceof Error ? e.message : String(e) };
	}
}

/** Undefined when the root isn't registered, so the route can answer 404. */
export function viewProject(root: string): ProjectView | undefined {
	if (!registeredRoots().includes(root)) return undefined;
	const summary = summarize(root);
	return { summary, todo: summary.error ? undefined : wf.readTodo(root) };
}

/** A state file as rendered sections, each with its markdown for editing. */
export interface SectionsView {
	file: string;
	preamble: string;
	sections: { heading: string; text: string; html: string }[];
}

/** Steers and risks hold one field per line, so their line breaks are kept; docs are wrapped prose. */
const LINE_FILES = ['steers.md', 'risks.md'];

export function viewSections(root: string, file: string): SectionsView {
	const { preamble, sections } = wf.readSections(root, file);
	const breaks = LINE_FILES.includes(file);
	const render = (markdown: string) => marked.parse(markdown, { async: false, breaks });
	return {
		file,
		preamble: render(preamble),
		sections: sections.map((s) => ({
			heading: marked.parseInline(s.heading, { async: false }),
			text: s.text,
			html: render(s.text.split('\n').slice(1).join('\n'))
		}))
	};
}

/** One section edit from a dashboard form, through the core; a refusal comes back for its section. */
export async function changeSection(root: string, request: Request) {
	const form = await request.formData();
	const index = Number(form.get('index'));
	try {
		wf.withLock(root, () =>
			wf.writeSection(root, String(form.get('file') ?? ''), index, String(form.get('text') ?? ''))
		);
	} catch (e) {
		if (e instanceof wf.WfError) return fail(400, { error: e.message, item: `section-${index}` });
		throw e;
	}
}

/**
 * Learnings to edit, with the fullest project's session context and the limit the meter shows: the
 * owner's warn limit, else the refuse limit, else none.
 */
export interface LearningsView {
	lessons: string[];
	context: number;
	budget: number | undefined;
	/** The owner's limits on one learning, which the form's counter follows. */
	limit: wf.Limit;
}

/** The context limit the meter shows. */
function meterLimit(): number | undefined {
	const limit = wf.readSettings().contextChars;
	const target = limit.warn !== wf.OFF ? limit.warn : limit.refuse;
	return target === wf.OFF ? undefined : target;
}

/** A project's learnings (root) or the global ones; global learnings reach every registered project. */
export function viewLearnings(root: string | undefined): LearningsView {
	const roots = root ? [root] : registeredRoots();
	const sizes = roots.flatMap((r) => {
		try {
			return [wf.sessionContext(r).length];
		} catch {
			return [];
		}
	});
	return {
		lessons: wf.readLearnings(root, !root),
		context: Math.max(0, ...sizes),
		budget: meterLimit(),
		limit: wf.readSettings().learningChars
	};
}

/**
 * One learnings change from a dashboard form: add, edit or remove, through the same core functions
 * as `wf learn`. A refusal comes back as a form error for the row it concerns.
 */
export async function changeLearning(root: string | undefined, request: Request) {
	const form = await request.formData();
	const op = String(form.get('op') ?? '');
	const n = Number(form.get('n'));
	const text = String(form.get('text') ?? '');
	const global = !root;
	const item = op === 'add' ? 'learning-new' : `learning-${n}`;
	const apply = () => {
		if (op === 'add') return wf.addLearning(root, text, global);
		if (op === 'edit') return wf.editLearning(root, n, text, global);
		if (op === 'remove') return wf.removeLearning(root, n, global);
		throw new wf.WfError(`unknown learnings change: ${op}`);
	};
	try {
		// The owner's limits apply here as in `wf learn`: refused past refuse, warned past warn.
		const { warnings } = root ? wf.withLock(root, apply) : apply();
		return { warnings, item };
	} catch (e) {
		if (e instanceof wf.WfError) return fail(400, { error: e.message, item });
		throw e;
	}
}

/**
 * The owner's settings, with the defaults to show beside them. A file wf can't read shows the
 * defaults and the reason, so saving the page replaces it.
 */
export function viewSettings(): {
	settings: wf.Settings;
	defaults: wf.Settings;
	unreadable?: string;
} {
	return {
		settings: wf.readSettings(),
		defaults: wf.DEFAULT_SETTINGS,
		unreadable: wf.settingsProblem()
	};
}

/** Saves the owner's settings from the form; a bad value is refused with the file kept. */
export async function saveSettings(request: Request) {
	const form = await request.formData();
	const num = (name: string) => Number(form.get(name));
	const limit = (key: (typeof wf.LIMITS)[number]): wf.Limit => ({
		warn: num(`${key}.warn`),
		refuse: num(`${key}.refuse`)
	});
	try {
		wf.writeSettings({
			contextChars: limit('contextChars'),
			learningChars: limit('learningChars'),
			handoffLines: limit('handoffLines'),
			listedItems: num('listedItems'),
			titleChars: num('titleChars')
		});
	} catch (e) {
		if (e instanceof wf.WfError) return fail(400, { error: e.message });
		throw e;
	}
	return { saved: true };
}
