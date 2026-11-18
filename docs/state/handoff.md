# Handoff
State: build
Active: 1.12, 1.13, 2.2, 2.3, 2.4
Next: major 3 records: 3.1 learnings, 3.2 steers, 3.3 risk, 3.4 memory/find/get, 3.5 env, 3.6 checks/push, 3.7 defer; 1.12, 1.13, 2.2, 2.3, 2.4 wait on the owner
Verify: pnpm --dir wf test passes 52; pnpm --dir dashboard test passes 12
Don't: change the todo format; stop while open items remain; put the owner's words verbatim in any record; touch admin mode; amend or force-push unless the owner says so; hand-edit todo, handoff or the plan docs; write PII into any file
Open: owner: rerun wf install, then one fresh demo session: the old demo prompt (1.12, 1.13); wf state discuss and an Edit of a project file, and git push in setup before and after typing setup done (2.2); ask it to turn admin on, then turn it on yourself and ask it to edit todo.md (2.3); ask it to run claude -p and to write into scratch/links (2.4)
Open: owner: read global/CLAUDE.md and global/states.md
Open: owner: old verbatim steers are still in this public repo's git history; removing them needs a history rewrite and force-push, approve or not?
Open: owner: may the four fixture screenshots scratch/images/1.5-*.png be deleted?
