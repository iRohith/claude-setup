import { saveSettings, viewSettings } from '#lib/server/projects.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => viewSettings();

export const actions: Actions = {
	settings: ({ request }) => saveSettings(request)
};
