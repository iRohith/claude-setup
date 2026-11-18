# Handoff
State: build
Active: 1.3, 1.4
Next: major 1 waits on the owner: wf install plus a real session in scratch/temp/demo (1.3, 1.4); then the major 1 deliverable run
Verify: pnpm --dir wf test passes 28; pnpm --dir dashboard test passes 10; SCREENSHOTS=1 ITEM=<id> pnpm --dir dashboard test shoots the real dashboard
Don't: amend or force-push unless the owner says so; mark 1.3/1.4 done before the real-session proof; prove UI with fixture screenshots; run wf install (owner only); write PII into any file
Open: owner: run 'node ~/Projects/claude-setup/wf/cli.ts install' in a terminal, then start a fresh Claude session in ~/Projects/claude-setup/scratch/temp/demo for the 1.3 and 1.4 proofs
Open: owner: may the four fixture screenshots scratch/images/1.5-*.png be deleted? they show the test fixture, not the real dashboard
