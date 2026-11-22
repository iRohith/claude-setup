# Learnings

1. Grew the setup with each redesign, again in 5.6 (+40 rule lines) while it was already the bottleneck → fix problems by cutting; if the owner can't read it in one sitting, cut it
2. Asked the owner things already said (e.g. `docs/state/`) → check the conversation and refs before asking.
3. Shrank a long requirement list into a todo tool → restate every requirement before proposing a shape.
4. Moved work "to 5.1, 5.2" where no item held it, and never checked the spec against the todo → confirm the target item names the work; after planning, every spec feature maps to an item.
5. Screenshot cleanup in a finally block never ran when Playwright timed the test out, leaving 28 fillers in demo → restore data in afterEach and check hashes after every run
6. Added the 2-second refresh without testing a form left open across it; fields fed from page data lost what was typed → bind fields to local drafts and test typing across a refresh
7. Wrote the claude -p denial as a loose regex; all 15 of its denials in cuda-kernels were false (.claude/ paths, other tools' -p) → test each deny pattern against lookalikes
8. Earlier setups failed on hand-edited state, loose states, hooks as the main control, rules leaning on unseen context → one checked tool, few states, hooks for hard limits, self-contained rules
