# Handoff
State: build
Active: 1.12, 1.13
Next: 1.12 and 1.13 wait on the owner: read global/CLAUDE.md and global/states.md, then re-run the demo prompt in a fresh session in scratch/temp/demo; then major 1 closes and major 2 starts
Verify: pnpm --dir wf test passes 43; the demo session-start context is about 3,460 characters; ~/.claude/CLAUDE.md links to global/CLAUDE.md
Don't: change the todo format; amend or force-push unless the owner says so; mark 1.12/1.13 done before the owner's sign-off and demo re-run; hand-edit todo, handoff or the plan docs; write PII into any file
Open: owner: read global/CLAUDE.md and global/states.md; re-run the demo prompt in a fresh session in scratch/temp/demo
Open: owner: may the four fixture screenshots scratch/images/1.5-*.png be deleted?
