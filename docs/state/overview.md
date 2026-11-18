# Overview

claude-setup makes Claude Code work the owner's way on any project, on any machine.

It is three things:

1. **`wf`, a CLI** that is the only way the agent changes project state. It is also how the agent asks
   about state: what's next, what an item is, how something was done, what was learned. It checks every
   write, so the state can't drift or contradict itself.
2. **A dashboard**: one local Svelte page across all projects, with a tab per project. The owner uses it to
   read and edit todos, plans and learnings, switch states and toggle admin mode.
3. **Global guidance**: one short set of rules, the vetted skills, and the few hooks that hold the hard
   limits.

## Scope

- Project state lives in `<project>/docs/state/` as plain markdown, readable on GitHub and in a diff.
- Every project is always in one of three states: **setup**, **discuss** or **build**. Admin mode is a
  separate switch that only the owner can flip.
- Learnings exist at two levels. Project learnings live in `docs/state/learnings.md`. Global learnings live
  in this repo at `global/learnings.md`. Both are always in context.
- The tool does not handle git. Commits, pushes and merges to `main` are done by prompting. The tool only
  writes the githooks the owner names during setup.
- The tool knows nothing about any stack. Scaffolding is done in setup, natively, from what the owner says.

## Out of scope

- Approvals or questions in the dashboard. Those are Claude Code prompts and are never stored.
- Cross-project requests. Linked projects are read-only awareness.
- Headless or background sessions (`claude -p`), daemons, databases, telemetry, LLM calls.
- Branches per task. There is only `work` and `main`.
