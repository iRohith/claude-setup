# Learnings

1. Built mechanisms the owner never asked for (MCP server, ledger, conductors) → propose each one, build only what's approved.
2. Grew the setup with each redesign → if the owner can't read it in one sitting, cut it.
3. Asked the owner things already said (e.g. `docs/state/`) → check the conversation and refs before asking.
4. Shrank a long requirement list into a todo tool → restate every requirement before proposing a shape.
5. Started 1.3 without `wf start`, and hand-edited todo.md for lack of `wf edit` → start before working; plan every spec'd command into an item.
6. Proved the dashboard with screenshots of a test fixture → proof screenshots show the real app with the owner's real data.
7. Moved work "to 5.1, 5.2" where no item held it, and never checked the spec against the todo → confirm the target item names the work; after planning, every spec feature maps to an item.
8. Started 2.2 and 4.6 without wf start despite learning 5; the impl check caught both → wf start is the first command of every item, before reading code
9. Screenshot cleanup in a finally block never ran when Playwright timed the test out, leaving 28 fillers in demo → restore data in afterEach and check hashes after every run
10. Added the 2-second refresh without testing a form left open across it; fields fed from page data lost what was typed → bind fields to local drafts and test typing across a refresh
