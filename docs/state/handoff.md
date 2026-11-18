# Handoff
State: build
Active: 1.3, 1.4
Next: 1.9 bulk planning: wf batch, wf edit, wf doc; then 1.3/1.4 wait on the owner's wf install and real session
Verify: pnpm --dir wf test passes 32; pnpm --dir dashboard test passes 10; wf help lists every command
Don't: amend or force-push unless the owner says so; mark 1.3/1.4 done before the real-session proof; prove UI with fixture screenshots; run wf install (owner only); write PII into any file
Open: owner: run 'node ~/Projects/claude-setup/wf/cli.ts install' in a terminal, then start a fresh Claude session in ~/Projects/claude-setup/scratch/temp/demo for the 1.3 and 1.4 proofs
Open: owner: may the four fixture screenshots scratch/images/1.5-*.png be deleted? they show the test fixture, not the real dashboard
