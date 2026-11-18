import { registeredRoots, summarize } from '#lib/server/projects.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({ projects: registeredRoots().map(summarize) });
