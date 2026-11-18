// Reads registered projects through the wf core. The dashboard holds no state rules of its own.
import { basename } from 'node:path';
import * as wf from 'wf';

export interface ProjectSummary {
	root: string;
	name: string;
	state?: wf.State;
	active: string[];
	next?: string;
	error?: string;
}

export interface ProjectView {
	summary: ProjectSummary;
	todo?: wf.Todo;
}

export const registeredRoots = (): string[] => Object.keys(wf.readRegistry()).sort();

export function summarize(root: string): ProjectSummary {
	const base = { root, name: basename(root), active: [] };
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
