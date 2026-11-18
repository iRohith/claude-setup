import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';

// Tests run against a fixture registry (e2e.setup.ts). SCREENSHOTS=1 runs only screenshots.e2e.ts,
// against the owner's real registry, so proof screenshots show the real dashboard.
const screenshots = Boolean(process.env.SCREENSHOTS);
const home = fileURLToPath(new URL('../scratch/temp/e2e/home', import.meta.url));
const port = 5198;
const env = process.env as Record<string, string>;

export default defineConfig({
	...(screenshots
		? { testMatch: '**/screenshots.e2e.ts' }
		: {
				testMatch: '**/*.e2e.ts',
				testIgnore: '**/screenshots.e2e.ts',
				globalSetup: './e2e.setup.ts'
			}),
	webServer: {
		command: `pnpm dev --port ${port} --strictPort`,
		port,
		env: screenshots ? env : { ...env, WF_HOME: home }
	},
	use: { baseURL: `http://localhost:${port}`, channel: 'chrome' },
	projects: [
		{ name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
		{ name: 'mobile', use: { ...devices['Pixel 7'], channel: 'chrome' } }
	]
});
