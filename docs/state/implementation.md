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
  - `global/CLAUDE.md`: global guidance, complete on its own;
  - `global/states.md`: the per-state steps injected at session start;
  - `global/learnings.md`;
  - `global/rules/`: the vetted always-on rules (ponytail, karpathy);
  - `global/skills/`: the vetted skills (tdd, diagnosing-bugs, codebase-design);
  - `global/THIRD-PARTY.md`: where each adapted file came from and what changed.
- **`wf install`** (`wf/install.ts`, TypeScript, not shell): the owner runs it once per machine, in a
  terminal; it refuses to run inside Claude Code.
  - **What it does:** links `~/.local/bin/wf` to `wf/cli.ts` and adds the hooks to
    `~/.claude/settings.json`, idempotently and keeping the existing settings. It also links
    `~/.claude/CLAUDE.md`, each file of `global/rules/` into `~/.claude/rules/` and each skill folder of
    `global/skills/` into `~/.claude/skills/` (5.4), never replacing a file it didn't link.
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
  - the instructions for the project's current state, the `## <state>` section of
    `global/states.md`;
  - project learnings;
  - the handoff.
- **PreToolUse:**
  - looks up the project's state and admin flag;
  - checks the tool name and path or command against spec section 5;
  - denies with a one-line reason that says the rule is fixed and names the alternative. Otherwise it
    stays silent.
- **UserPromptSubmit** looks for `setup done` (case-insensitive) in the owner's prompt while the project is
  in setup. If found, it writes `setupDone: true` for the project in `local/projects.json`.

## How the dashboard works

- **Projects:** lists the projects from `local/projects.json`, one tab each, plus a Global tab for global
  learnings.
- **Per project:**
  - **Todo:** add, edit, check and uncheck items, with live validation errors from the core; items sit in
    id order, so nothing reorders.
  - **Learnings:** add, edit and remove them, project and global, through the same core functions as
    `wf learn` (the arrow, 200 characters, the context budget); a refusal shows next to the learning.
  - **Other files:** steers, risks, memory and docs are readable, and editable section by section.
  - **Controls:** a state switcher and the admin toggle.
- **Freshness:** it re-reads the files on every request and polls every two seconds while open. There is
  no watcher and no websocket.
- **Where it runs:** on `127.0.0.1`, started by the owner with `pnpm dev` in `dashboard/`.

## How guidance is written

The guidance exists from a project's first moment, before any work.
- **`global/CLAUDE.md`** holds the owner's rules for every project, in under about 80 lines: project
  state, working an item, the owner's messages, friction, code and safety. `wf install` links it as
  `~/.claude/CLAUDE.md`, so Claude Code loads it natively in every session, outside the 10,000-character
  hook cap. It names only `wf` commands that exist.
- **`global/states.md`** holds one `## <state>` section for each of setup, discuss and build: what to do
  in that state. The session-start hook injects the current state's section, and `wf init` prints the
  setup section.
- Both ship with `wf`; they are read from the code's own folder, not from `WF_HOME`.

## Skills

- **ponytail and karpathy:** always loaded. Adapted copies live in `global/rules/ponytail.md` and
  `global/rules/karpathy.md`; `wf install` links each into `~/.claude/rules/`, which Claude Code loads in
  every session like `CLAUDE.md`. Only their rules text is taken; ponytail's hooks, statusline, commands,
  levels and plugin manifests are left out.
- **mattpocock:** `tdd`, `diagnosing-bugs` and `codebase-design` only, copied into `global/skills/<name>/`
  as skills (their `SKILL.md` and reference files, no scripts); `wf install` links each into
  `~/.claude/skills/`. His tracker flows, GLOSSARY and ADR skills are left out: wf's todo and
  `docs/state/` cover them.
- **Adaptation:** every copy is edited so the owner's rules win where they conflict. For example: dead code
  is removed at every micro commit, open items go to `wf defer` instead of "later" comments, and an
  unanswered question goes into the handoff instead of stopping the work.
- **impeccable:** on demand, as the UI skill in `global/skills/impeccable/`, adapted code-led: its router,
  design references and three reviewer briefs, with no launcher, detector, decision page, catalog rolls or
  comp pipeline. A new look is three directions the owner picks from; the direction contract is a section
  of the project's `implementation.md`.
- **Vetting:** each skill is checked before it's added, so nothing upstream runs hidden code: no hooks, no
  binaries, no telemetry. `global/THIRD-PARTY.md` names each upstream repo, the commit it was taken from,
  its MIT licence, and what was changed.

## How the dashboard looks

Direction for the dashboard, set with the UI skill (impeccable, Operate mode, code-led). The world lends type,
palette, density and one signature move; layout and controls stay standard shadcn-svelte.

- **Scene:** the owner at a desk through long sessions, glancing between the Claude Code terminal and the
  dashboard on a second screen, often in the evening. Dark, matching the terminal and editor around it.
- **Palette:** ink-navy ground, a deeper layer for the sidebar, raised panels a step lighter. Iris accent for
  primary actions and selection only. State colours carry meaning: amber in progress, jade done, coral errors,
  muted slate open. Secondary text is tinted from the ground, never flat grey.
- **Type:** Geist, one family, fixed rem scale (ratio about 1.15). Geist Mono only for data: ids, paths, hashes.
- **Signature move:** a major's progress drawn as a segmented track, one segment per minor in its state colour,
  shown on each major and on each project in the sidebar. It is the data itself, not decoration.
- **Shell:** sidebar with projects (state, active-major track) and Global; it becomes a sheet on mobile. Project
  header: name, path, state switch, admin control. View tabs: Todo, Steers, Risks, Memory, Learnings, Docs.
- **Todo:** majors as sections with id, title, state, track and actions; minors as rows with a done checkbox,
  Start, and an expandable body for proof, implementation details and editing. Finished majors fold.
- **Browser surfaces:** selection, caret, focus rings, scrollbars and tabular numerals themed from the palette.
- **Icons:** Lucide, one stroke weight. No glyph or emoji icons, no gradient text, no glow halos.
