import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';

// The fixture registry the dev server reads; e2e.setup.ts fills it before the tests run.
const home = fileURLToPath(new URL('../scratch/temp/e2e/home', import.meta.url));
const port = 5198;

export default defineConfig({
	testMatch: '**/*.e2e.ts',
	globalSetup: './e2e.setup.ts',
	webServer: {
		command: `pnpm dev --port ${port} --strictPort`,
		port,
		env: { ...(process.env as Record<string, string>), WF_HOME: home }
	},
	use: { baseURL: `http://localhost:${port}`, channel: 'chrome' },
	projects: [
		{ name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
		{ name: 'mobile', use: { ...devices['Pixel 7'], channel: 'chrome' } }
	]
});
