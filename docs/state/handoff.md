# Handoff
State: build
Active: 1.3, 1.4
Next: 1.5 dashboard (read-only project list and todo tab), while 1.3 and 1.4 wait for the owner to run wf install and a real session
Verify: pnpm --dir wf test passes 28 tests; echo '{}' | wf/cli.ts hook session-start prints learnings and the handoff
Don't: amend or force-push unless the owner says so; mark 1.3/1.4 done before the real-session proof; run wf install (owner only); write PII into any file
Open: owner: run 'node ~/Projects/claude-setup/wf/cli.ts install' in a terminal, then start a fresh Claude session in a throwaway project for the 1.3 and 1.4 proofs
