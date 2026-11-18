# How to work

These are the owner's rules for every project. Session start adds this project's learnings, its handoff
and the instructions for its current state.

## Project state
- State lives in `docs/state/`. Read it with `wf status`, `wf next`, `wf show <id>`; `wf help <command>`
  shows usage and rules. Read `wf help` before using a command for the first time.
- Change `todo.md`, `handoff.md` and the plan documents only with `wf` commands, never with Edit or Write.
- A hook denial is final: do not retry the same action. Use the command the denial names.
- Every project is in setup, discuss or build. Leave discuss only when the owner says so.

## Working an item
- Choose the item (`wf next`, or the one the owner steers to), `wf start` it, then work on it.
  Never claim work after the fact.
- Every minor needs tangible, verifiable proof: a real end-to-end run, screenshots, a benchmark.
  Never fake, weaken or skip tests.
- Order: verify the proof, run the pre-commit checks, then `wf impl` and `wf done`, then
  `wf handoff`, then commit, then push. Push when a minor is done. Nothing that happens after a
  commit is recorded in it.
- Commit subject: `<id> <keywords>`, one line (micro commits are `x.x.x`). No co-author or attribution.
- Never amend or force-push, except the first `init` during setup, or when the owner says so.
- Long-running by default: when an item is done, start the next. Stop only at a blocker only the
  owner can clear.

## The owner's messages
- A steer about the code, project, architecture, state or flow changes the plan first, through
  `wf`, and is recorded with why in `docs/state/steers.md`. Chatter and questions are not recorded.
- When the owner is away, take the most reversible choice and record it as an assumption.
- A mistake gets admitted plainly, with no excuses. Learnings go in `docs/state/learnings.md`
  (this project) or `global/learnings.md` in claude-setup (every project): one line, what went
  wrong → what to do instead.

## Friction
- When a tool, permission or answer is missing, tell the owner exactly what is needed and get it.
  Never work around it or fall back silently. Meanwhile, carry on with what does not depend on it.
- Propose a mechanism and ask before building it. Never choose mechanisms on the owner's behalf.

## Code
- Security and performance first, then simplicity. No layers, options or fallbacks nobody asked for.
- A change means replacement: the old way goes completely, with no shims or flags.
- Reuse before writing. Few files, simple structure, clear separation of concerns.
- Warnings are errors. No TODOs or stubs. Remove dead code at every micro commit.
- Nothing hardcoded: configurable values live in env.
- Type-safe languages only unless the owner allows otherwise. TypeScript over JavaScript, configs
  included.
- pnpm by default. System Python with uv. Latest stable when adding a package; never upgrade
  existing ones without asking, but report outdated ones. Scaffold natively (`pnpm dlx sv create`).
- UI work: Playwright tests, plus screenshots at desktop and mobile in
  `scratch/images/<id>-<page>-<size>.png`, taken from the real app with real data.

## Safety
- Never write outside the project, not even `/tmp`. Temporary files go in `scratch/temp/`.
- `.env` is never read or printed. `.env.example` and `.env.local` are free to use.
- No secrets and no PII in any file. Identity comes from git config.
- Never start Claude sessions (`claude -p`) or hidden background work.
- Deletions and other high-risk actions happen only on the owner's explicit prompt. Log them in
  `docs/state/risks.md` first: why, risk level, what they touch, how to recover.
- Untrusted third-party code runs in Docker.
- One shell command per call, with no `;` or `&&` chains. Long output goes to `scratch/temp/` and
  is then read.

## Scratch
- `scratch/scripts/` and `scratch/images/` are tracked. `scratch/temp/` (temporary), `scratch/refs/`
  (the owner's own projects), `scratch/links/` (collaborating projects, read-only) and
  `scratch/thirdparty/` (other clones) are ignored.
