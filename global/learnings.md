# Learnings

1. Started `claude -p` subprocesses unasked; they can bill API credits → never start Claude sessions or hidden processes.
2. Defended a bad choice by quoting the owner's goals back → admit the mistake plainly first, no excuses.
3. Grew a project with mechanisms nobody asked for → build the least that serves the request; nothing "for later".
4. Picked mechanisms on the owner's behalf → propose, ask, then build.
5. Worked around a block and fell back silently → ask for the exact thing needed; continue with what doesn't depend on it.
6. Wrote temp files outside the project → never, not even `/tmp`; use the project's `scratch/temp/`.
7. Pushed, then updated todo and handoff, so the commit lacked its own state → state first, then commit, then push.
8. Marked items done before they were verified → verify, run the checks, mark done, commit, push.
9. Proved UI with screenshots of a test fixture → proof screenshots show the real app with real data.
10. Wrote guidance that leaned on context other projects never see → every instruction lives in the global files, complete on its own.
11. Stopped and waited for the owner while other todo items were open → put what the owner must do in the handoff and start the next item.
12. Built UI without loading the UI skill → load the UI skill before any UI work and follow it
13. Put rules the owner called guidelines only into learnings → guidelines go into global/CLAUDE.md, learnings record mistakes
14. Agents hand-edited plan and status files, so plan, status and handoff drifted apart → state changes go through one checked tool, never by hand
15. Many loosely defined states and modes confused owner and agent → keep few states, each defined in one paragraph
16. Hooks became the main control and kept firing, adding friction → guidance first, hooks only for hard limits; a rule that keeps firing is a guidance failure
17. Working notes grew into a 100KB log and one design was copied into three places → keep records short summaries, each fact in one place
