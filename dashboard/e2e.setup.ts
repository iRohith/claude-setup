// Builds the e2e fixture with the real wf CLI, at a fixed path so screenshots stay stable.
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const e2e = fileURLToPath(new URL('../scratch/temp/e2e', import.meta.url));
const cli = fileURLToPath(new URL('../wf/cli.ts', import.meta.url));

export default function setup(): void {
	rmSync(e2e, { recursive: true, force: true });
	const project = join(e2e, 'notes');
	mkdirSync(project, { recursive: true });
	// As the owner in a terminal: the fixture is built by the test, not by a Claude Code session.
	const terminal = Object.fromEntries(
		Object.entries(process.env).filter(
			([k]) => k !== 'CLAUDECODE' && k !== 'CLAUDE_CODE_SESSION_ID'
		)
	);
	const wf = (...args: string[]) =>
		execFileSync(process.execPath, [cli, ...args], {
			cwd: project,
			env: { ...terminal, WF_HOME: join(e2e, 'home') }
		});
	wf('init');
	wf('add', 'major', 'Crude end to end', '--deliverable', 'a page that lists notes');
	wf('add', 'minor', '0', 'notes store', '--proof', 'a unit test saves and reloads two notes');
	wf('add', 'minor', '0', 'notes page', '--proof', 'screenshots show both notes');
	wf('start', '0.1');
	wf('impl', '0.1', 'notes kept in `notes.json`');
	wf('add', 'micro', '0.1', 'save notes as JSON');
	wf('add', 'minor', '0', 'setup', '--proof', 'done first');
	wf('start', '0.3');
	wf('impl', '0.3', 'scaffolded');
	wf('done', '0.3');
	wf('add', 'major', 'Sharing', '--deliverable', 'a note opens from a link');
}
