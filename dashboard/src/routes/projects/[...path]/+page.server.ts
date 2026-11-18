import { error } from '@sveltejs/kit';
import * as wf from 'wf';
import { viewProject } from '#lib/server/projects.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const view = viewProject(`/${params.path}`);
	if (!view) error(404, 'not a registered project');
	return view;
};

export const actions: Actions = {
	/** The owner's admin switch for this project. */
	admin: async ({ params, request }) => {
		const root = `/${params.path}`;
		if (!viewProject(root)) error(404, 'not a registered project');
		wf.setAdmin(root, (await request.formData()).get('on') === 'true');
	}
};
