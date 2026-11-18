// Reads registered projects through the wf core. The dashboard holds no state rules of its own.
import { existsSync, readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { marked } from 'marked';
import * as wf from 'wf';

export interface ProjectSummary {
	root: string;
	name: string;
	state?: wf.State;
	active: string[];
	next?: string;
	admin: boolean;
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

/** For the tab bar: every registered project. */
export const tabs = () => registeredRoots().map((root) => ({ root, name: basename(root) }));

export function summarize(root: string): ProjectSummary {
	const base = { root, name: basename(root), active: [], admin: wf.isAdmin(root) };
	try {
		const todo = wf.readTodo(root);
		const next = wf.nextItem(todo);
		return {
			...base,
			state: wf.readHandoff(root).state,
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
