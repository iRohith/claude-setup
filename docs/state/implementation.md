# Implementation

This is how claude-setup gets built, start to finish. The exact formats and commands are in `spec.md`.

## Language and layout

- **Language:** everything is TypeScript, run directly by the latest Node, which runs `.ts` files natively,
  so there is no build step for the CLI. pnpm is the package manager.
- **The core:** one file, `wf/core.ts`. It reads and writes the state files and holds every rule from
  spec section 3. It is the only code that writes state.
- **The CLI:** `wf/cli.ts` parses arguments and calls the core. Nothing else.
- **The hooks:** `wf/hooks.ts` is one entry point (`wf hook <event>`). It reads the hook JSON from stdin,
  then prints a decision or the context. It has no logic beyond spec section 5.
- **The dashboard:** `dashboard/` is SvelteKit with pure runes and shadcn-svelte. Its server routes import
  `wf/core.ts`, so the dashboard and the CLI share every rule.
- **Global files:**
  - `global/CLAUDE.md`: global guidance, short;
  - `global/learnings.md`;
  - `global/skills/`: the vetted skills.
- **`wf install`** (`wf/install.ts`, TypeScript, not shell): the owner runs it once per machine, in a
  terminal; it refuses to run inside Claude Code.
  - **What it does:** links `~/.local/bin/wf` to `wf/cli.ts` and adds the hooks to
    `~/.claude/settings.json`, idempotently and keeping the existing settings. It also links
    `~/.claude/CLAUDE.md` and the skills (added in 5.1 and 5.2).
  - **What it doesn't do:** copy anything into projects. `pnpm install` stays the owner's normal step
    after cloning.

## How the core works

1. Each state file has one parser and one writer.
   - The writer always produces the canonical format, so a write followed by a read is lossless.
   - The parser accepts only that format. Anything else is an error that names file:line.
2. A write reads the file, changes the parsed structure, checks the rules, then writes the whole file back.
   - It writes to `<file>.tmp` and then renames it, so a crash never leaves half a file.
   - Only one writer touches a file at a time: a single lock file in `scratch/temp/` is held for the
     duration of the write.
3. The project is the nearest parent folder that contains `docs/state/`. Global learnings are found
   relative to the `wf` install location.
4. Search (`wf find`) is a plain case-insensitive substring scan over the state files. There is no index;
   the files are small.

## How the hooks work

- **SessionStart** prints, in this order:
  - global learnings;
  - project learnings;
  - the handoff;
  - three to six lines of guidance for the current state.
  - The guidance text for each state lives in `global/CLAUDE.md` under a heading per state, and the hook
    prints that section.
- **PreToolUse:**
  - looks up the project's state and admin flag;
  - checks the tool name and path or command against spec section 5;
  - denies with a one-line reason and the alternative. Otherwise it stays silent.
- **UserPromptSubmit** looks for `setup done` (case-insensitive) in the owner's prompt while the project is
  in setup. If found, it writes `setupDone: true` for the project in `local/projects.json`.

## How the dashboard works

- **Projects:** lists the projects from `local/projects.json`, one tab each, plus a Global tab for global
  learnings.
- **Per project:**
  - **Todo:** add, edit, reorder, check and uncheck items, with live validation errors from the core.
  - **Learnings:** edit them.
  - **Other files:** steers, risks, memory and docs are readable, and editable section by section.
  - **Controls:** a state switcher and the admin toggle.
- **Freshness:** it re-reads the files on every request and polls every two seconds while open. There is
  no watcher and no websocket.
- **Where it runs:** on `127.0.0.1`, started by the owner with `pnpm dev` in `dashboard/`.

## How guidance is written

`global/CLAUDE.md` stays under about 80 lines. It covers:
- the principles (from `intent.md`);
- the per-state sections;
- "use `wf` for state; prefer `wf` queries over reading files";
- "a steer updates the plan first, via `wf steer`";
- "every minor needs tangible proof: a real e2e run, a screenshot or a benchmark; never weakened tests";
- "pick the item, `wf start`, finish, `wf done`; never claim work after the fact";
- "verify the proof, run the pre-commit checks, then mark done (implementation details, handoff), then
  commit, then push; never mark done because a commit is coming, and never record what happens after the
  commit";
- "risky actions go through `wf risk` first";
- "one shell command per call, long output to `scratch/temp/` then read";
- "pnpm by default";
- "type-safe languages only unless the owner allows otherwise; TypeScript over JavaScript, configs included";
- "UI work: Playwright tests plus screenshots at desktop and mobile sizes (more when the UI calls for it), committed in `scratch/images/` as `<id>-<page>-<size>.png`";
- "long-running by default: after a task, start the next; stop only at a blocker only the owner can clear";
- "missing tool, permission or answer: say exactly what's needed and get it; no workarounds; meanwhile do what doesn't depend on it";
- "latest stable versions";
- "never `claude -p`";
- "never write secrets or PII into any file, including the owner's names, usernames or email; identity
  comes from git config".

## Skills

- **ponytail:** always loaded, by `@import` from `global/CLAUDE.md`.
- **mattpocock and karpathy:** always loaded, copied into `global/skills/` and edited first, so the owner's
  rules win wherever they conflict. For example: dead code removed at every micro commit, and only code that
  is actively used now stays.
- **impeccable:** on demand, as a skill for UI work.
- **Vetting:** each skill is checked before it's added, so nothing upstream runs hidden code: no hooks, no
  binaries, no telemetry.
