# Handoff
State: build
Active: 1.3, 1.4
Next: major 1 waits on the owner: wf install plus a real session in scratch/temp/demo (1.3, 1.4); then check major 1 and start major 2
Verify: pnpm --dir wf test passes 39; pnpm --dir dashboard test passes 10; wf help lists every command
Don't: amend or force-push unless the owner says so; mark 1.3/1.4 done before the real-session proof; hand-edit todo, handoff or the five plan docs (use wf); prove UI with fixture screenshots; write PII into any file
Open: owner: run 'node ~/Projects/claude-setup/wf/cli.ts install' in a terminal, then start a fresh Claude session in ~/Projects/claude-setup/scratch/temp/demo for the 1.3 and 1.4 proofs
Open: owner: may the four fixture screenshots scratch/images/1.5-*.png be deleted? they show the test fixture, not the real dashboard
