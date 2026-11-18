# Handoff
State: build
Active: 1.3, 1.4, 1.10
Next: 1.10 waits on the render proof (owner's preview reaching 6.1, or markdown-it allowed as a dev dependency); 1.3/1.4 wait on wf install and a real session
Verify: pnpm --dir wf test passes 42; pnpm --dir dashboard test passes 10; todo.md reads in id order
Don't: amend or force-push unless the owner says so; mark 1.3/1.4/1.10 done before their proofs; hand-edit todo, handoff or the five plan docs (use wf); write PII into any file
Open: owner: run 'node ~/Projects/claude-setup/wf/cli.ts install' in a terminal, then start a fresh Claude session in ~/Projects/claude-setup/scratch/temp/demo for the 1.3 and 1.4 proofs
Open: owner: does the todo.md preview now reach 6.1? or allow markdown-it as a wf dev dependency for a permanent render test (1.10)
Open: owner: wrap long lines and shorten implementation details to how-it-is-built lines? (readability)
Open: owner: may the four fixture screenshots scratch/images/1.5-*.png be deleted?
