# Learnings

1. Notes grew into a 100KB log and one design was copied three times → short summaries, each fact in one place
2. Acted on guesses ('append' as a new commit, an assumed stack) → re-read the request; confirm an ambiguous reading first
3. Wrote intent as a feature list → ground it in users, deployment and the owner's ranked priorities
4. Put ref findings and general lessons in project learnings → general lessons go global; findings stay in refs
5. git add -A committed .claude/worktrees; a worktree cd did not persist → ignore .claude/worktrees/, use absolute paths
6. Pushed while tests still ran → wait for the test result before every push
7. Committed and pushed micro commits and small edits (md tweaks, state-only changes) one by one, cluttering history → commit and push only whole minors and majors
8. Edited files before a todo item was in progress (claude-setup's 4.7 code came before its wf start) → before the first edit of any change, however small, add its item and wf start it; never edit outside an in-progress item
