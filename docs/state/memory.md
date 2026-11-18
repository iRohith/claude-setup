# Memory

## Invariants

1. Only `wf` writes state files. The dashboard writes through the same core.
2. The core holds every rule. The CLI, hooks and dashboard hold none.
3. Markdown in `docs/state/` is the only store. No database, no index, no daemon.
4. Only three states (setup, discuss, build), plus admin mode, which only the owner flips.
5. The tool never runs git beyond setting `core.hooksPath`. It never spawns Claude and makes no network
   calls.
6. Nothing stack-specific in the tool.

## Contracts

- The state file formats in `spec.md` section 3. A format change replaces the old one, and `wf` migrates
  nothing; existing projects are rewritten once by hand in admin mode.
- Every hook denial names the alternative.
- Commit subjects start with the item ID (`spec.md` section 3.1). The pre-push hook depends on it.

## Pitfalls

- 2026-11-18: pattern-based Bash guards miss variants. Keep them few, and treat guidance as the main line.
  Cause: v3's guard had false positives on grep patterns and still missed variants.
- 2026-11-18: same-user processes can't be fully stopped from flipping admin. Stated in spec section 6;
  don't pretend otherwise.

- 2026-11-18: Claude Code caps hook `additionalContext` at 10,000 characters. Past that it saves the output
  to a file and shows Claude a 2,000-character preview, so the injection is effectively lost. The spec's
  "60 lines × 200 chars per learnings file" could exceed that. Cause: found in the hooks docs while
  building 1.3. The budget is fixed in 3.1, where learnings writes land.

## Anti-patterns

1. Adding a state, mode or flag the owner didn't ask for.
2. Tamper checks, ledgers of events, migrations, conductors, per-project kit copies, MCP servers.
3. A hook that blocks something the guidance should have prevented, repeatedly.
4. Hidden subprocesses or anything that can spend credits.

## Deferred

| Item | Resolves in |
|---|---|
