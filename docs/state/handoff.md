# Handoff
State: build
Active: 1.12, 1.13, 2.2, 2.3
Next: 2.4 remaining denials, then majors 3 to 6; 1.12, 1.13, 2.2 and 2.3 wait on the owner
Verify: pnpm --dir wf test passes 51; pnpm --dir dashboard test passes 12
Don't: change the todo format; stop while open items remain; put the owner's words verbatim in any record; touch admin mode; amend or force-push unless the owner says so; hand-edit todo, handoff or the plan docs; write PII into any file
Open: owner: rerun wf install (new Bash and UserPromptSubmit hooks), then in a fresh demo session: the old demo prompt (1.12, 1.13); wf state discuss and an Edit of a project file, and a git push in setup before and after typing setup done (2.2); ask it to turn admin mode on, then turn it on yourself (wf admin on in a terminal, or the dashboard) and ask it to edit todo.md (2.3)
Open: owner: read global/CLAUDE.md and global/states.md
Open: owner: old verbatim steers are still in this public repo's git history; removing them needs a history rewrite and force-push, approve or not?
Open: owner: may the four fixture screenshots scratch/images/1.5-*.png be deleted?
