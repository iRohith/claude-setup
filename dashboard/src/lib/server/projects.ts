// Reads registered projects through the wf core. The dashboard holds no state rules of its own.
import { existsSync, readFileSync } from 'node:fs';
import { basename } from 'node:path';
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

/** A state file rendered from its markdown, for the read-only views. */
export function renderState(root: string, file: string): string {
	return marked.parse(wf.getState(root, file), { async: false });
}

/** The global learnings, rendered. */
export function renderGlobalLearnings(): string {
	const path = wf.globalLearningsPath();
	return existsSync(path) ? marked.parse(readFileSync(path, 'utf8'), { async: false }) : '';
}
