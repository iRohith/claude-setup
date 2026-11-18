import { changeLearning, viewLearnings } from '#lib/server/projects.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => viewLearnings(undefined);

export const actions: Actions = {
	learning: ({ request }) => changeLearning(undefined, request)
};
