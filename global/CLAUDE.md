# How to work for the owner

These rules hold in every project; the owner's word in a session wins over them.

## State and wf
- Each project's state is markdown in `docs/state/` (todo, handoff, steers, learnings, plan docs),
  changed only through `wf`. Run `wf status` at session start and after a compaction; `wf help <cmd>`
  before using a command. A hook denial is final: never retry or route around it.
- States: setup, discuss (planning only), build. Only the owner changes state or admin mode.
- Run wf only in the main checkout, never inside a worktree.

## Working
- Todo: majors with a deliverable, minors with a tangible proof. The first major is a crude end-to-end
  version of what was asked. New work becomes an item now; no TODOs or "later".
- Per item: `wf start` first, build with tests of real behaviour, verify the proof as the owner would
  (real run, screenshots, benchmark), checks pass, `wf done`, `wf handoff`, commit, push. Never fake or
  weaken a test; never mark done before it is verified.
- Choose work by the owner's latest stated priority, then `wf next`. Check it serves `intent.md`.
- Never idle: when an item waits on the owner, put what they must do in the handoff (`--open`) and
  start the next. While your own build, test or agent runs, do other work; wait on completion notices,
  never on open-ended polling loops.
- Something missing (tool, package, permission, answer): ask for exactly it; never work around it.

## The owner's messages
- A steer changes the plan first (todo, and intent/overview when the direction changes), then is
  recorded with `wf steer` as your own short summary. Never paste the owner's words into any record.
- Take steers literally; never invent consumers, scope or contracts. Questions, "preview", "tell me
  first" or "don't run" mean answer only, no action.
- Answer the question in the first line. Numbers are the latest, with their source; comparisons in a
  copyable markdown table. Say what was and wasn't tested.
- Propose mechanisms and architectural changes; build them only when approved. When the owner is away,
  take the most reversible choice and record it with `wf assume`; ask nothing.
- Admit mistakes plainly. Record each with `wf learn "<what went wrong> → <what to do instead>"`
  (`--global` when it holds everywhere). A rule the owner calls a guideline goes into claude-setup's
  `global/CLAUDE.md`; elsewhere record it with `wf learn --global` and tell the owner.

## Commits
- Subject `<id> <keywords>`, one item per commit, no attribution. Micro commits `x.x.x` inside a minor.
- `work` gets everything and is pushed after each minor; `main` only gets squashed commits when the
  owner says so. Never amend, force-push, rewrite history or skip hooks.
- Pre-commit checks (set with `wf checks set`) stay fast; slow, hardware and benchmark runs belong to
  the proof and run before a push.

## Code
- Code follows the ponytail and karpathy rules (always loaded alongside this file). A change replaces
  the old way fully (no shims). Remove dead code. Warnings are errors.
- Type-safe only: TypeScript over JavaScript; Python only fully typed under a strict checker in the
  checks. pnpm for Node. Config lives in env, nothing hardcoded. Latest stable versions when adding;
  never upgrade without asking.
- Python: system Python with pacman packages; never uv/pip install. Missing package: ask the owner.
  Only if pacman lacks it or it's broken: one `uv venv --system-site-packages` per project with just the
  overrides, listed in `requirements.txt`; never reinstall big system packages (pytorch).
- Web: SvelteKit (runes), shadcn-svelte, Cloudflare Workers; Modal for GPU or extra compute.
- UI: load the impeccable skill first; build with shadcn; Playwright tests; screenshots of the real app
  with real data at desktop and mobile in `scratch/images/<id>-<page>-<size>.png`.
- Performance: profile first and log readings; compare against the strongest equivalent baseline under
  the same inputs and machine state; check outputs are complete and correct before claiming a speedup.

## Safety
- Never write outside the project (not even `/tmp`); temp files in `scratch/temp/`. Tool caches are fine.
- Never read or print `.env`; use `wf env set` / `wf env keys`. No secrets or PII in files or history.
- Never start Claude sessions (`claude -p`) or hidden background processes. No sudo.
- Deletes, force-pushes, migrations and anything hard to undo: only when the owner asks, logged first
  with `wf risk`. Docker images may be deleted freely.
- Paid cloud runs: price them and say the cost before starting; confirm nothing runs after a stop.
- Heavy jobs run under a memory cap; kill only the PIDs you started, then check none are left.
- Third-party code runs in Docker; learn from it, don't copy it. Repos stay private; never delete, rename or change their visibility.
- One shell command per call (no chains, even inside `bash -c`); long output to a file in
  `scratch/temp/`, never cut with head or tail.
- `scratch/scripts/` and `scratch/images/` are committed; `scratch/temp/`, `refs/`, `links/`,
  `thirdparty/` are not. Linked projects in `scratch/links/` are read-only.
