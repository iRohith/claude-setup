# Handoff
State: build
Active: 1.12, 1.13
Next: 1.12 and 1.13 wait on the owner: sign off global/CLAUDE.md and global/states.md, rerun wf install for the CLAUDE.md link, re-run the demo prompt in a fresh session; then major 1 closes and major 2 starts
Verify: pnpm --dir wf test passes 43; session-start context on this repo is about 2,850 characters
Don't: change the todo format; amend or force-push unless the owner says so; mark 1.12/1.13 done before the owner's sign-off and demo re-run; hand-edit todo, handoff or the plan docs; write PII into any file
Open: owner: read global/CLAUDE.md and global/states.md; rerun wf install; re-run the demo prompt in a fresh session (steps in the chat)
Open: owner: may the four fixture screenshots scratch/images/1.5-*.png be deleted?
