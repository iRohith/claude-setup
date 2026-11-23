import { error, fail } from '@sveltejs/kit';
import * as wf from 'wf';
import {
	DOCS,
	VIEWS,
	changeLearning,
	changeSection,
	viewLearnings,
	viewProject,
	viewSections,
	type View
} from '#lib/server/projects.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params, url }) => {
	const root = `/${params.path}`;
	const project = viewProject(root);
	if (!project) error(404, 'not a registered project');
	const view = (VIEWS as readonly string[]).includes(url.searchParams.get('view') ?? '')
		? (url.searchParams.get('view') as View)
		: 'todo';
	const doc = (DOCS as readonly string[]).includes(url.searchParams.get('doc') ?? '')
		? (url.searchParams.get('doc') as string)
		: DOCS[0];
	// The todo and the learnings are edited as lists; every other view is a file edited by section.
	const ok = !project.summary.error;
	const learnings = ok && view === 'learnings' ? viewLearnings(root) : undefined;
	const sections =
		ok && view !== 'todo' && view !== 'learnings'
			? viewSections(root, `${view === 'docs' ? doc : view}.md`)
			: undefined;
	return { ...project, view, views: VIEWS, doc, docs: DOCS, learnings, sections };
};

/** The registered root this request is about, or a 404. */
function rootOf(path: string): string {
	const root = `/${path}`;
	if (!viewProject(root)) error(404, 'not a registered project');
	return root;
}

const field = (form: FormData, name: string) => String(form.get(name) ?? '');

/**
 * Applies one todo change through the core, under the same lock the CLI uses. A rule the change
 * breaks comes back as a form error, shown next to the item.
 */
async function change(
	path: string,
	request: Request,
	apply: (todo: wf.Todo, form: FormData) => void
) {
	const root = rootOf(path);
	const form = await request.formData();
	try {
		wf.withLock(root, () => {
			const todo = wf.readTodo(root);
			apply(todo, form);
			wf.writeTodo(root, todo);
		});
	} catch (e) {
		// A form names where its error shows with `item`; otherwise it shows at the item it changes.
		if (e instanceof wf.WfError)
			return fail(400, { error: e.message, item: field(form, 'item') || field(form, 'id') });
		throw e;
	}
}

export const actions: Actions = {
	/** The owner's admin switch for this project. */
	admin: async ({ params, request }) => {
		const root = rootOf(params.path);
		wf.setAdmin(root, (await request.formData()).get('on') === 'true');
	},
	/** The owner's state switch: setup, discuss or build. */
	state: async ({ params, request }) => {
		const root = rootOf(params.path);
		const form = await request.formData();
		try {
			wf.withLock(root, () => wf.setState(root, field(form, 'state')));
		} catch (e) {
			if (e instanceof wf.WfError) return fail(400, { error: e.message, item: 'state' });
			throw e;
		}
	},
	addMajor: ({ params, request }) =>
		change(params.path, request, (t, f) =>
			wf.addMajor(t, field(f, 'title'), field(f, 'deliverable'))
		),
	addMinor: ({ params, request }) =>
		change(params.path, request, (t, f) =>
			wf.addMinor(t, field(f, 'id'), field(f, 'title'), field(f, 'proof'))
		),
	edit: ({ params, request }) =>
		change(params.path, request, (t, f) => {
			const id = field(f, 'id');
			wf.editItem(t, id, {
				title: field(f, 'title'),
				...(id.includes('.')
					? { proof: field(f, 'proof') }
					: { deliverable: field(f, 'deliverable') })
			});
		}),
	/** Checking an open minor starts it first, so the core's order holds. */
	check: ({ params, request }) =>
		change(params.path, request, (t, f) => {
			const id = field(f, 'id');
			if (id.includes('.') && wf.findItem(t, id).mark === ' ') wf.start(t, id);
			wf.done(t, id);
		}),
	start: ({ params, request }) =>
		change(params.path, request, (t, f) => wf.start(t, field(f, 'id'))),
	reopen: ({ params, request }) =>
		change(params.path, request, (t, f) => wf.reopen(t, field(f, 'id'))),
	learning: ({ params, request }) => changeLearning(rootOf(params.path), request),
	section: ({ params, request }) => changeSection(rootOf(params.path), request)
};
