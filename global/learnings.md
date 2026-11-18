# Learnings

1. Started `claude -p` subprocesses without being asked; they can bill API credits → never spawn Claude sessions.
2. Defended a bad choice by quoting the owner's goals back → admit the mistake plainly first, no excuses.
3. Overengineered every version of the setup → least code that serves the request; no "for later".
4. Picked mechanisms on the owner's behalf → propose, ask, then build.
5. Worked around blocks and fell back silently → ask for the exact thing needed; continue with what doesn't depend on it.
6. Wrote temp files outside the project → never, not even `/tmp`; use the project's `scratch/temp/`.
7. Pushed `init`, then updated todo/handoff, so the commit lacked its own state → state first, then commit, then push.
8. Marked major 0 done and `main` created before either happened → verify, run checks, mark done, commit, push.
