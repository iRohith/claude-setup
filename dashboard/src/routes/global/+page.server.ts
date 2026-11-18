import { renderGlobalLearnings } from '#lib/server/projects.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({ learnings: renderGlobalLearnings() });
