# Handoff
State: build
Active: 1.3, 1.4, 1.5
Next: major 1 waits on the owner: wf install plus a real session (1.3, 1.4) and a browser for the Playwright MCP (1.5); then the major 1 deliverable run
Verify: pnpm --dir wf test passes 28 tests; pnpm --dir dashboard dev serves / and /projects/<root>
Don't: amend or force-push unless the owner says so; mark 1.3/1.4/1.5 done before their proofs; run wf install (owner only); write PII into any file
Open: owner: run 'node ~/Projects/claude-setup/wf/cli.ts install' in a terminal, then start a fresh Claude session in scratch/temp/demo for the 1.3 and 1.4 proofs
Open: owner: Playwright MCP needs a browser: 'sudo pacman -S chromium', then re-add the MCP with --browser chromium --executable-path /usr/bin/chromium (it runs via bunx today; pnpm dlx instead?)
