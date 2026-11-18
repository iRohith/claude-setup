import { error } from '@sveltejs/kit';
import { viewProject } from '#lib/server/projects.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const view = viewProject(`/${params.path}`);
	if (!view) error(404, 'not a registered project');
	return view;
};
