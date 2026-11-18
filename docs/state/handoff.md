# Handoff
State: build
Active: 1.3, 1.4
Next: major 1 closes once the owner runs wf install and one real session in scratch/temp/demo (1.3, 1.4); the one-major rule holds major 2 until then
Verify: pnpm --dir wf test passes 42; pnpm --dir dashboard test passes 10; todo.md preview renders to the end
Don't: change the todo format; amend or force-push unless the owner says so; mark 1.3/1.4 done before the real-session proof; hand-edit todo, handoff or the plan docs; write PII into any file
Open: owner: run 'node ~/Projects/claude-setup/wf/cli.ts install' in a terminal, then one session in ~/Projects/claude-setup/scratch/temp/demo (steps in the chat)
Open: owner: may the four fixture screenshots scratch/images/1.5-*.png be deleted?
