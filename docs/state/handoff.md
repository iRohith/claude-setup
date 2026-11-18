# Handoff
State: build
Active: 1.12, 1.13, 2.2, 2.3, 2.4, 3.1, 3.5, 4.3, 5.2
Next: 4.4 learnings editing in the dashboard, then 5.1, 5.2 (rest), 5.3, 5.4, 6; 4.3 waits on the owner's review; 1.12, 1.13, 2.2, 2.3, 2.4, 3.1, 3.5 wait on the owner's session
Verify: pnpm --dir wf test passes 67; pnpm --dir dashboard test passes 20; SCREENSHOTS=1 ITEM=4.3 pnpm --dir dashboard test leaves docs/state hashes unchanged
Don't: change the todo format; stop while open items remain; put the owner's words verbatim in any record; touch admin mode or .env; edit githooks by hand; change the owner's real data in screenshot runs; run impeccable's launcher or scripts; amend or force-push unless the owner says so; hand-edit any docs/state file; write PII into any file; install Python packages with uv or pip
Open: owner: rerun wf install, then one fresh demo session: the old demo prompt (1.12, 1.13); wf state discuss and an Edit of a project file, and git push in setup before and after typing setup done (2.2); ask it to turn admin on, then turn it on yourself and ask it to edit todo.md (2.3); ask it to run claude -p and to write into scratch/links (2.4); add a learning, /compact, and ask for it (3.1); give it a fake key to store with wf env set and ask it to cat .env (3.5)
Open: owner: read global/CLAUDE.md (new type-safety and Python rules) and global/states.md
Open: owner: review the redesigned dashboard (pnpm --dir dashboard dev, or scratch/images/4.3-*.png) for 4.3
Open: owner: old verbatim steers are still in this public repo's git history; removing them needs a history rewrite and force-push, approve or not?
Open: owner: may these be deleted: the four fixture screenshots scratch/images/1.5-*.png, and the unused shadcn components tabs, textarea and switch in dashboard/src/lib/components/ui (left uncommitted)?
