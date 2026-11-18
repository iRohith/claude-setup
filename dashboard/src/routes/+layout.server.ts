import { tabs } from '#lib/server/projects.js';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = () => ({ tabs: tabs() });
