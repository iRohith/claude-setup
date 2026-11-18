// Writes a project's git hooks: pre-commit (secrets and PII, then the owner's checks) and the
// optional pre-push (the owner's commands, only when a major is pushed). Plain bash, so the hooks
// work for anyone who clones the project, with or without wf.
import { execFileSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { WfError } from './core.ts';

const GITLEAKS = String.raw`# Secrets and PII first: gitleaks' default rules plus one rule each for the git config name and
# email, built at runtime so the values never land in a file.
rules=""
n=0
add_rule() {
  local value=$1
  [[ -z $value || $value == *"'''"* ]] && return
  local escaped
  escaped=$(printf '%s' "$value" | sed -E 's/[][\.^$*+?(){}|\\/]/\\&/g')
  n=$((n + 1))
  rules+=$'\n'"[[rules]]"$'\n'"id = 'pii-$n'"$'\n'"description = 'personal identifier'"$'\n'"regex = '''(?i)$escaped'''"$'\n'
}
add_rule "$(git config user.name || true)"
add_rule "$(git config user.email || true)"
GITLEAKS_CONFIG_TOML=$'[extend]\nuseDefault = true\n'"$rules" \
  gitleaks git --pre-commit --staged --redact --no-banner --no-color --verbose \
    --gitleaks-ignore-path "$root/.gitleaksignore" "$root"`;

function commands(cmds: string[]): string[] {
	if (!cmds.length) throw new WfError('name at least one command');
	return cmds.map((c) => {
		const cmd = c.trim();
		if (!cmd || cmd.includes('\n')) throw new WfError('each command is one non-empty line');
		return cmd;
	});
}

function writeHook(root: string, name: string, body: string): string {
	const dir = join(root, '.githooks');
	mkdirSync(dir, { recursive: true });
	const path = join(dir, name);
	writeFileSync(path, body);
	chmodSync(path, 0o755);
	execFileSync('git', ['-C', root, 'config', 'core.hooksPath', '.githooks']);
	return path;
}

/** pre-commit: gitleaks, then the checks in order from the project root, then restage. */
export function setChecks(root: string, cmds: string[]): string {
	const lines = commands(cmds);
	return writeHook(
		root,
		'pre-commit',
		`#!/usr/bin/env bash
# Written by wf checks set; change it with that command, not by hand.
set -euo pipefail
root=$(git rev-parse --show-toplevel)
cd "$root"

${GITLEAKS}

# The project's checks, in order, warnings as errors. Files they rewrite are staged again.
mkdir -p scratch/temp
git diff --cached --name-only -z --diff-filter=ACMR > scratch/temp/staged.lst
${lines.join('\n')}
xargs -0 -r git add -- < scratch/temp/staged.lst
`
	);
}

/** pre-push: the commands run only when a pushed commit's subject starts with a bare integer. */
export function setPush(root: string, cmds: string[]): string | undefined {
	const path = join(root, '.githooks', 'pre-push');
	if (!cmds.length) {
		if (existsSync(path)) rmSync(path);
		return undefined;
	}
	const lines = commands(cmds);
	return writeHook(
		root,
		'pre-push',
		`#!/usr/bin/env bash
# Written by wf push set; change it with that command, not by hand.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
zero=0000000000000000000000000000000000000000
major=false
while read -r local_ref local_sha remote_ref remote_sha; do
  [[ $local_sha == "$zero" ]] && continue
  if [[ $remote_sha == "$zero" ]]; then
    subjects=$(git log --format=%s "$local_sha" --not --remotes)
  else
    subjects=$(git log --format=%s "$remote_sha..$local_sha")
  fi
  if grep -Eq '^[0-9]+ ' <<< "$subjects"; then major=true; fi
done
$major || exit 0

# A major is being pushed: the owner's commands, in order.
${lines.join('\n')}
`
	);
}
