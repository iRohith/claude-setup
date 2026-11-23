# Todo

## [x] 0 · Setup
Deliverable: a fresh public `claude-setup` repo (public for this repo only; project repos stay private) with `work` and `main`, one `init` commit pushed after "setup done", and no PII or secrets anywhere in it.

- [x] 0.1 git init with a `work` branch; create a fresh public GitHub repo named after the folder
  Proof: `gh repo view` shows it public; `git branch` shows `work`
  - `git init -b work`; `gh repo create claude-setup --public --source . --remote origin`, nothing pushed
- [x] 0.2 `.gitignore` for the scratch layout and env files
  Proof: `git status --ignored` shows temp/refs/links/thirdparty ignored, scripts tracked, `.env.example` tracked
  - ignores `.env`, `.env.local`, `scratch/{temp,refs,links,thirdparty}/`, `local/`, `node_modules/`, `/.claude/`
- [x] 0.3 pnpm workspace scaffold for `wf/` and `dashboard/` (`pnpm dlx sv create`), latest stable versions
  Proof: `pnpm dev` in `dashboard/` serves the default page
  - `pnpm-workspace.yaml` lists `dashboard` and `wf`
  - `pnpm dlx sv@latest create dashboard --template minimal --types ts --add tailwindcss="plugins:none"` (sv 1.4.0: kit 3, svelte 5.57, vite 8, tailwind 4.3, typescript 6)
  - `wf/package.json` from `pnpm init`, trimmed to name, private, MIT, module; Node 26 runs `.ts` natively
  - dev server on :5199 returned 200 with "Welcome to SvelteKit"
- [x] 0.4 checks the owner names in setup, written into `.githooks/pre-commit`
  Proof: a commit with a deliberate lint error is rejected
  - `sv add prettier eslint` in `dashboard/`
  - warnings are errors: `check` runs svelte-check with `--fail-on-warnings`; `lint` runs eslint with `--max-warnings 0`
  - hook order: gitleaks → `pnpm format` (then the staged files are staged again) → `lint` → `check` → `build`
  - an unused variable in `+page.svelte` was rejected by eslint, then reverted
  - `wf` has no tests yet; its test command joins the hook in 1.1
  - `sv add sveltekit-adapter="adapter:node"`: adapter-auto warned that it found no deployment target; the dashboard runs locally, so node is the fit and the warning is gone
- [x] 0.5 the `init` commit; push after the owner says "setup done"
  Proof: `git log origin/work` shows exactly `init`
  - `git push -u origin work`; `origin/work` holds only `init`; the repo is public, default branch `work`
  - `init` was amended with owner approval, once to carry its own state and once for the pre-push plan; each force-push is logged in `risks.md`
  - `main` gets created at `init` after the push. It is verified, and major 0 checked, in the first build commit, because `init` can't record its own branch
  - verified: `git ls-remote --heads origin` shows `main` and `work` both at `5ad00ff` (`init`)
- [x] 0.6 no-PII and no-secrets pre-commit gitleaks run
  Proof: commits containing the git config email or a fake API key are each rejected; `git log -p` of `init` contains neither
  - `gitleaks git --pre-commit --staged --redact --no-banner`, with its config built at runtime and passed through `GITLEAKS_CONFIG_TOML`: gitleaks' default rules, plus one rule each for git config `user.name` and `user.email`, so the PII patterns never touch a tracked file
  - the written guidance rule goes into `global/CLAUDE.md` in 5.1
  - `.githooks/pre-commit` (bash): a case-insensitive literal rule each for the git config name and email, merged with gitleaks defaults; `core.hooksPath=.githooks`
  - tested in a throwaway repo with a fake identity: the fake email and a fake `ghp_` token were each rejected; a clean commit passed
  - an earlier `local/pii.txt` list of extra patterns was removed: the owner said gitleaks is enough
  - `--verbose --redact` so a block names file, line and rule but never the value
  - the first real `init` attempt was blocked: `LICENSE:3` (the copyright line) matches the git config name; the owner allowed it, so `.gitleaksignore` holds only that fingerprint (`LICENSE:pii-1:3`, no PII in it)

## [~] 1 · Crude end to end: plan through `wf`, can't hand-edit state, a new session picks up
Deliverable: in a throwaway project, a Claude session adds a major and two minors with `wf`, fails to edit `docs/state/todo.md` directly, and a fresh session starts with the handoff and learnings in context; the dashboard lists the todo.

- [x] 1.1 core: parse and write `todo.md` and `handoff.md`, IDs, the start/done rules
  Proof: a test script round-trips a sample todo unchanged and rejects starting minors in two majors
  - `wf/core.ts`, one file: parse and format for `todo.md` and `handoff.md` in a strict format with one line per field; parse errors name file:line
  - rules: start only an open minor; only one major may have minors in progress; done needs in-progress; a major needs at least one minor and all of them done; implementation details only on started minors; ids are max+1, minors start at .1, duplicates rejected
  - writes go to `.tmp` then rename; the single-writer lock comes in 1.2, where the CLI writes
  - `wf/core.test.ts`: 11 `node:test` tests, including that the real `todo.md` and `handoff.md` are canonical; `pnpm --dir wf test` added to the pre-commit hook
  - `todo.md` rewritten once into the strict format: wrapped lines joined, no content changed
- [x] 1.2 cli: `init`, `status`, `next`, `show`, `add`, `start`, `done`, `impl`, `handoff`
  Proof: the commands run against a sample project and print the changed lines
  - `wf/cli.ts` parses arguments with `node:util` parseArgs, calls the core and prints; usage errors exit 2, rule errors exit 1 as `wf: <reason>`
  - every write prints its changed lines (an LCS line diff: `- ` removed, `+ ` added); writes hold a single-writer lock in `scratch/temp/wf.lock` and take it over from a dead process
  - core gained `activeMinors`, `nextItem` (stays in the active major; otherwise the first unfinished major), `withLock`, `initProject` (empty templates, setup state) and the registry `local/projects.json` under `WF_HOME` (default: claude-setup)
  - `wf/cli.test.ts`: 7 tests run the real CLI against a sample project in `scratch/temp/` with a temp `WF_HOME` (removed afterwards); 19 of 19 wf tests pass; also ran `wf status` and `wf show 1` on this repo
- [x] 1.3 hooks: SessionStart injection and the PreToolUse deny on `docs/state/**`
  Proof: transcript of a real session showing the injected context and the denied Edit with its alternative
  - `wf hook session-start` injects global learnings, project learnings and the handoff; `wf hook pre-tool-use` denies Edit/MultiEdit/Write/NotebookEdit on wf-owned state files, naming the wf command
  - proof: two owner-run sessions in scratch/temp/demo; the first started with the context, added a major and two minors via wf, and had its Edit of todo.md denied twice; the second answered the handoff and learnings from context alone
- [x] 1.4 `wf install`: wf on PATH and hook registration (the CLAUDE.md link is 1.12, the skills links 5.4)
  Proof: on a clean `~/.claude` the throwaway project works with no per-project step
  - `wf/install.ts`: links ~/.local/bin/wf to cli.ts and adds both hooks to ~/.claude/settings.json, keeping existing settings; idempotent; refuses inside Claude Code
  - proof: the owner ran it once; the demo project then worked with no per-project step; the owner's ~/.claude already had settings, so the clean-HOME case is covered by install.test.ts
- [x] 1.5 dashboard: read-only project list and todo tab
  Proof: screenshot of the throwaway project's todo
  - dashboard reads through the core as the workspace package `wf` (`exports` → `core.ts`); `src/lib/server/projects.ts` lists the registry and summarises each project; `/` lists projects, `/projects/<abs path>` shows the todo; unregistered paths return 404
  - throwaway project `scratch/temp/demo` built with wf only (init, a major, two minors, one started, one detail); both pages render every field over curl; the screenshot waits on a browser for the Playwright MCP
  - Playwright via `sv add playwright` on the system Chrome (`channel: 'chrome'`, no browser downloads); `e2e.setup.ts` builds a fixed fixture project with the wf CLI in `scratch/temp/e2e` and the dev server reads it through `WF_HOME`
  - 3 e2e tests at desktop (1440×900) and mobile (Pixel 7): project list, todo page, 404; in the pre-commit hook; `SCREENSHOTS=1` writes `scratch/images/1.5-{projects,todo}-{desktop,mobile}.png`
  - reviewing the screenshots found the ◐ glyph rendering as a clipped half-shape and the path wrapping mid-line on mobile; replaced with open / in progress / done badges and put the path on its own line
  - correction: the committed screenshots showed the e2e fixture project, not the real dashboard or the throwaway project the proof names; the real-dashboard screenshots are 1.7
- [x] 1.6 `wf/` type-checked, linted and formatted like the dashboard; every JS config converted to TS
  Proof: a type error and a lint error in `wf/` are each rejected at commit; no `.js` files remain outside `node_modules` and build output
  - `wf/` dev deps at the latest versions: typescript, @types/node, prettier, eslint, @eslint/js, typescript-eslint
  - `wf/tsconfig.json`: strict, nodenext, `noEmit`, `allowImportingTsExtensions`, `erasableSyntaxOnly` (Node runs the files as they are)
  - `wf/prettier.config.ts` uses the dashboard's style without the svelte plugins; `wf/eslint.config.ts` uses js + typescript-eslint recommended
  - scripts `check` (`tsc --noEmit`), `lint` (prettier check plus eslint with `--max-warnings 0`), `format`, `test`
  - dashboard `eslint.config.js` and `prettier.config.js` renamed with `git mv` to `.ts`, the prettier config typed, `tsconfig.json` include updated
  - hook: format both, restage, then dashboard lint, check, build, then wf lint, check, test
  - probes: a `string` assigned to a `number` was rejected by tsc (TS2322); an unused const was rejected by eslint; both removed
  - `git ls-files '*.js' '*.cjs' '*.mjs'` lists nothing
- [x] 1.7 screenshots of the real dashboard: the owner's registry and projects, with claude-setup itself registered
  Proof: scratch/images shows / and every registered project's page at desktop and mobile, taken from pnpm dev with the default registry
  - `wf init` in a project that already has docs/state/ now checks it parses and registers it; registered claude-setup itself
  - `SCREENSHOTS=1 ITEM=<id> pnpm --dir dashboard test` runs only `screenshots.e2e.ts` against the real registry (no `WF_HOME` override): `/` and every registered project, at desktop and mobile, failing on any non-OK page; the fixture tests no longer take screenshots
  - real data showed raw backticks and a wall of finished work: `#lib/Inline.svelte` renders code spans; finished majors and finished minors' details fold; fixture tests cover both; a hydration race in one test fixed with networkidle, then 3 clean runs
- [x] 1.8 `wf help`, `wf --help` and `wf <command> --help`: usage plus the rules each command enforces
  Proof: help for every command prints its usage and rules; a bare `wf` prints the overview; tests cover each command's help
  - `wf/help.ts` is the one list of commands: usage, a summary and the rules each enforces; the CLI rejects anything not listed, and a listed command without a handler fails loudly
  - bare `wf`, `wf help`, `--help` and `-h` print the overview; `wf help <cmd>` and `wf <cmd> --help` print usage and rules; usage mistakes exit 2 with that command's help; 4 tests in `help.test.ts` cover every command; 32 of 32 wf tests pass
- [x] 1.9 bulk planning: `wf batch <file>` adds majors and minors (with proofs) all or nothing, `wf edit` changes a title, proof or deliverable, `wf doc` writes overview, intent, references, implementation or spec, whole or one section
  Proof: a batch file writes a whole initial todo in one call; a batch with one bad entry changes nothing; `wf doc implementation --from <file>` replaces the plan and a direct Edit of it is denied
  - core `applyBatch`: the todo.md shape without ids (`## <title>` + Deliverable, `## <id>`, `- <title>` + Proof), applied to a copy and swapped in only when every entry passes; errors name file:line
  - core `editItem` (proofs on minors, deliverables on majors) and `writeDoc` (whole document from "# \<Title>", or one "## \<section>" replaced in place or appended; no #/## inside a section body)
  - the deny list is now a map from file to its command: todo.md, handoff.md and the five plan documents; a denial names the exact command (e.g. `wf doc spec`); 39 of 39 wf tests pass
  - used on this repo: `wf edit` moved edit/batch/doc out of 3.4 and fixed 1.4's stale install.sh title; `wf doc spec --section` rewrote spec section 4 to match what's built
- [x] 1.10 state text is markdown-safe: `<` outside code spans is written as `\<` in todo.md and handoff.md and read back as `<`; `wf doc` rejects a bare `<tag>` outside code
  Proof: todo.md renders to the last item in a markdown renderer; a detail containing a bare \<Title> round-trips; wf doc names the line of a bare tag
  - core `escapeMd`/`unescapeMd`: `<` outside code spans is `\<` on disk and `<` in memory, for every todo and handoff field; `writeDoc` rejects a bare tag outside inline code and fenced blocks, naming its line
  - verified by the owner: the todo.md preview renders to 6.1 after the `<Title>` on the 1.9 line was escaped
- [x] 1.11 the CLI keeps todo.md in id order: majors by number, minors by number within their major; position follows the id, so there is no `wf move`
  Proof: a todo with items out of order is written back sorted; this repo's todo.md reads 0.1 to 0.6 and 1.1 to 1.11 in order
  - `parseTodo` sorts majors by number and minors by number within their major, so every write puts items in id order; ids already come from max + 1, so nothing else decides position
  - `wf move` removed from 3.4, 4.1 and spec section 4; `wf help add` states the id-order rule
- [~] 1.12 global instructions from the first session: `global/CLAUDE.md` (how to work, the owner's rules), linked as `~/.claude/CLAUDE.md` by `wf install`
  Proof: the owner reads `global/CLAUDE.md` and signs off; after `wf install`, `~/.claude/CLAUDE.md` points to it
  - `global/CLAUDE.md` (73 lines): project state, working an item, the owner's messages, friction, code, safety, scratch; names only existing wf commands; `wf install` links it as `~/.claude/CLAUDE.md` and never replaces an existing file
  - rewritten to stand alone for downstream projects: the docs/state files and how each changes, wf use, states and admin, the todo shape, working an item, commits and branches, steers, learnings, friction, high-risk actions, code, safety, shell, scratch and linked projects; global learnings reworded as general lessons
- [~] 1.13 instructions for the current state injected at every session start, `wf init` printing the setup instructions, and denials that say the rule is final
  Proof: the owner's demo prompt re-run in a fresh session: one Edit attempt, the denial accepted, `wf edit` used instead, no chained commands
  - `global/states.md` has a section per state; core `stateInstructions` reads it from wf's own folder; session start injects the current state's section; `wf init` prints it; denials say the rule is fixed and a retry will be denied again
  - states.md gives each state numbered steps: setup (init, repo, native scaffold, gitignore, gitleaks plus the owner's checks, majors-only pre-push, refs and links, the init and main rule), discuss (references first, plan documents via wf doc, todo via wf batch), build
- [x] 1.14 micros as checkable todo items: x.x.x lines with a checkbox under their minor, added with wf add micro, started and done like minors; a minor can't be done while a micro is open; guidance and dashboard follow
  Proof: wf test covers add, start and done of a micro, the round trip of todo.md with micros, and done refusing a minor with an open micro; the dashboard shows micros with their checkboxes; the real todo.md still parses
  - [x] 1.14.1 screenshots of micros on the real dashboard, then the commit
  - Micros are todo items: { id x.x.x, mark, title } under their minor, written after its proof and before its details as '  - [ ] x.x.x title'; wf add micro \<minor>, wf start and wf done take micro ids, starting a micro starts its minor and major, a minor can't be done with an open micro, wf edit changes a micro's title, wf show lists a minor's micros; steers, risks and deferred rows accept micro ids; the dashboard lists micros under the proof with done checkboxes; CLAUDE.md: every change gets a micro, no edit before its item is started, commits only for whole minors and majors

## [~] 2 · States and admin
Deliverable: setup/discuss/build behave as spec section 2 in a real session, and admin mode lifts every restriction only when the owner flips it.

- [x] 2.1 `wf state` switches setup, discuss and build, stored per project (the per-state instructions come from 1.13)
  Proof: `wf state discuss` changes the handoff state and the next session starts with the discuss instructions
  - core `setState` rewrites the handoff's State line; `wf state <name>` prints the change and the new state's instructions; the next session starts with them (hook test)
- [~] 2.2 discuss write block; setup push block until "setup done"
  Proof: transcript showing a denied Edit in discuss and a denied push in setup, then the push allowed after "setup done"
  - core `discussDenial` (in discuss only docs/state/ and scratch/temp/ are writable), `pushDenial` (no git push in setup until setupDone), `recordSetupDone` (owner prompt containing "setup done" while in setup); registry entries typed as `ProjectEntry`
  - hooks: PreToolUse now also sees Bash; new `user-prompt-submit` hook; `wf install` registers it and updates the matcher of a hook it already owns
- [~] 2.3 admin mode: dashboard toggle, `wf admin` refused inside Claude Code, hooks pass when on
  Proof: transcript of the agent failing to turn it on; the owner turns it on and the state file edit goes through
  - registry flag `admin`; core `setAdmin`, `isAdmin`, `adminDenial` (registry file, `wf admin`/`cli.ts admin`, `projects.json`, the dashboard `?/admin` action); in admin mode the pre-tool-use hook denies nothing and session start says admin is on
  - `wf admin on|off` refuses inside Claude Code; dashboard project page has the toggle (a form action) with an e2e test at both sizes; e2e runs on one worker since the fixture registry is shared; real-dashboard screenshots `scratch/images/2.3-*`
- [~] 2.4 the remaining hook denials from spec section 5: Edit/Write on scratch/links/** and on any other registered project, wf writes to any project but the session's own, and Bash running claude -p or --print
  Proof: hook tests and a real session show each one denied with its alternative
  - core `linksDenial` (Edit/Write under scratch/links/) and `claudeDenial` (Bash `claude` with `-p` or `--print`, inside or outside a project); wired into the pre-tool-use hook after the admin check
  - Sessions are tied to projects: every hook records the session id with its start directory (session start always, other hooks only when unseen), in wf's local store, guarded like the registry; inside Claude Code every writing wf command refuses any project but the session's own (global learnings stay shared), and Edit/Write into another registered project is denied; verified live: env -C into the demo project was refused

## [~] 3 · Records
Deliverable: every record type from spec section 3 written and queried through `wf`.

- [~] 3.1 learnings (project and global) injected at SessionStart; past a size target wf warns with each part's size, never refuses, and only about the project it runs in
  Proof: a learning added in one session appears in the next session's context, including after `/compact`
  - `wf learn "<wrong> → <instead>" [--global]`: core `addLearning` numbers the line, needs the arrow, at most 200 characters, and rolls back if any affected project's session context would pass 9,000 characters (a global learning affects every registered project)
  - session-context assembly moved from hooks.ts into core (`sessionContext`, `tryFindRoot`) so the budget check and the hook share it; project and global learnings joined the deny map, naming `wf learn` and `wf learn --global`
  - Budget refusals removed from learn (add, edit) and handoff, including the check that ran a global learning against every registered project; contextWarning prints a stderr warning with global learnings, project learnings and handoff sizes when the current project passes 4,000 characters; the dashboard meter keeps the target as a gauge
- [x] 3.2 steers and assumptions with `--why` and `--log`
  Proof: `wf show <id>` lists the steer that changed it
  - core `parseSteers`, `addSteer` (ids must exist or be all; steers need --changed; summaries escaped), `steersFor` (an item or its major); `wf steer ... --log true|false` (false records nothing), `wf assume`; `wf show` lists an item's steers; steers.md joined the deny map
- [x] 3.3 `wf risk` with all four fields required
  Proof: a request missing `--recover` is rejected naming the field
  - core `addRisk`: item, action, why, level, surface and recover all required, every missing one named; level is low, medium or high; item must exist; `wf risk` prints the entry and that the action may run; risks.md joined the deny map
- [x] 3.4 memory sections, `wf find`, `wf get`
  Proof: `wf find` hits across files; `wf get` prints one section
  - core `addMemory` (sections keep their shape: invariants and anti-patterns numbered, pitfalls dated, contracts bulleted), `findInState` (case-insensitive, file:line), `getState` (a file or one fence-aware section); memory.md joined the deny map
- [~] 3.5 `wf env set` and `wf env keys`; `.env` read, print and direct Edit/Write denied
  Proof: `.env` gets the key; the transcript never shows a value; `cat .env` is denied
  - core `envSet` (valid key, one-line value, quoted when needed, refuses until .gitignore lists .env), `envKeys` (names only), `envDenial` (Read/Edit/Write of .env and Bash naming .env, but not .env.example, .env.local or wf env); the PreToolUse matcher now includes Read
- [x] 3.6 `wf checks set` (pre-commit) and `wf push set` (optional pre-push, majors only, for example a deploy)
  Proof: pushing a major runs the commands, and a failing one blocks the push; pushing a minor or micro runs nothing; after `wf push set` with no commands, no hook exists
  - `wf/githooks.ts` writes plain-bash hooks that need no wf at commit time: pre-commit (gitleaks with the git config name and email, then the checks in order from the root, then restage what was staged) and pre-push (runs only if a pushed commit's subject starts with a bare integer); both set core.hooksPath
  - tested against a real throwaway repo and bare remote: failing check stops a commit, a rewrite is committed, the fake email is blocked, a minor push runs nothing, a major push runs the commands, a failing one blocks the push, no commands removes the hook; this repo's own hook regenerated with wf checks set
- [x] 3.7 deferred registry: `wf defer "<item>" --resolves <id>` writes the Deferred table in memory.md; an unknown id is rejected; `wf show <id>` lists the deferred entries that name it
  Proof: a deferral naming a missing id is rejected; `wf show` on the resolving id lists the entry
  - core `addDeferred` appends "| item | id |" to memory.md's Deferred table (pipes escaped, the resolving id must exist) and `deferredFor` reads it; `wf show` lists what is deferred to an item or its minors

## [~] 4 · Dashboard, full
Deliverable: the owner manages todos and learnings across all projects without touching a file.

- [x] 4.1 editing: add, edit, check, with core validation errors shown inline (items sit in id order, so there is no reordering)
  Proof: screenshots of each action and of a rejected edit
  - project page form actions (addMajor, addMinor, edit, check, start, reopen) apply core functions under the CLI's lock; a broken rule comes back as an inline error next to its item; checking an open minor starts it first; core `reopen` is the owner's undo
  - proof: an e2e test at both sizes adds a major and minor, gets the inline proof error, starts, checks, reopens and renames; real-dashboard screenshots `scratch/images/4.1-*` show the controls and a rejected edit without changing real data (todo hashes equal before and after)
- [x] 4.2 tabs for every registered project plus Global; steers, risks, memory and docs views; state switcher
  Proof: screenshots across two projects
  - a tab bar in the layout (All, one tab per registered project, Global); project views Todo, Steers, Risks, Memory, Learnings, Docs via ?view= links, the five plan docs via ?doc=, rendered with marked; a state switcher form action through core setState; /global shows the global learnings
  - proof: e2e at both sizes covers tabs, every view, doc switching and the state switch (waiting for the action's response); real-dashboard screenshots `scratch/images/4.2-*` across claude-setup, demo and a third registered project; the look is replaced in 4.3
- [~] 4.3 redesign the dashboard with the UI skill (impeccable) loaded: shadcn-svelte components, a beautiful dark theme, designed from how the owner actually uses it, mobile-friendly
  Proof: real-dashboard screenshots at desktop and mobile of every page and view, reviewed against the skill's checklist and by the owner
  - shadcn-svelte 1.8.1, nova preset, components.json with #lib aliases; bits-ui, cn, tw-animate-css and shadcn-svelte/tailwind.css (its data-state variants); init's CSS step written by hand because its prompt needs a TTY
  - layout.css: dark-only tokens (ink-navy ground, deeper sidebar, raised cards, iris primary, amber/jade/slate/coral state colours), Geist and Geist Mono from fontsource, themed selection, caret, scrollbars, tabular numerals; .md prose on the same tokens
  - AppSidebar: shadcn Sidebar listing each project with its state and current-major Track, Global at the foot, a sheet on mobile that closes after navigation; projects.ts tabs() and currentMajor()
  - Track.svelte draws a major's minors as segments in state colours with a spoken label; MarkBadge shows item states; Inline code on the theme
  - project page: shadcn Select state switch, admin Alert, link view tabs; majors as card sections with fold, status, track, actions and inline edit; minors with a done checkbox (check or reopen), id column, proof, folding details, inline edit; a form's item field places its error
  - home: one bordered list of project rows with state, active, next and track; dashed empty states that teach, on every list; favicon drawn as a three-segment track
  - e2e locators moved to regions, checkboxes and the shadcn select, the sidebar opened on mobile; screenshots add the mobile sidebar once its animation settles; eslint lets shadcn primitives take already-resolved hrefs
  - fixes found while proving 4.4: body overflow-wrap anywhere so long unbroken text wraps instead of widening the phone layout; the done-checkbox form refs are $state so the bind is reactive; view tabs transition text colour only, so the old tab's underline doesn't linger
- [x] 4.4 edit project and global learnings in the dashboard, through the same core rules and size budget
  Proof: wf learn --edit and --remove keep the rules and renumber; screenshots from the real dashboard at desktop and mobile of a learning added, edited and removed, and an over-budget one rejected
  - core: parseLearnings (strict, numbered 1..n, names the bad line) and formatLearnings; addLearning, editLearning and removeLearning share one changeLearnings writer; add and edit check the arrow, 200 characters and the budget with rollback; remove renumbers and is always allowed
  - cli: wf learn --edit \<n> and --remove \<n> (with --global), refusing both together or a non-integer n; help says how to merge and prune; global/CLAUDE.md names both for over-budget refusals
  - dashboard: Learnings.svelte on the project Learnings view and the Global page: a budget meter (shadcn Progress) for the fullest affected project, the list as wrong → instead, inline edit with Save, Cancel, Remove, an add form with a live count and arrow hint; one learning action through changeLearning, its form action keeping ?view=learnings
  - tests: wf 69 (parser round-trips both real files; edit, remove, renumbering and the budget through the CLI); dashboard e2e 24 (project and global learnings); screenshots change only the throwaway project under scratch/temp, fill it to the budget through the core, and restore it in afterEach with a byte check
- [x] 4.5 the dashboard refreshes while open, re-reading state every two seconds
  Proof: a wf command run in a terminal shows up on the open dashboard within two seconds, in a Playwright test against the fixture
  - +layout.svelte: an $effect interval calls invalidateAll every 2000 ms (REFRESH_MS, the spec's freshness rule) while the tab is visible, re-running the layout and page loads; component state such as open edit forms survives a refresh
  - e2e: the real wf CLI adds a major in the fixture project while the page stays open; the region appears within 3 s with no reload; the full suite passed 26 of 26 three runs in a row
  - fix found in 4.6: a refresh reset every field fed from page data, losing typed text; todo, learning and section fields now bind to local drafts copied when an editor opens, and refresh-probe.e2e.ts types into each kind of field across a refresh
  - refresh scheduling: the next refresh is set only after invalidateAll finishes (setTimeout chain, not setInterval), found when a busy machine made refreshes pile up and stall pages
- [x] 4.6 steers, risks, memory and the plan docs editable section by section in the dashboard, through wf's own writers
  Proof: screenshots from the real dashboard at desktop and mobile of a section edited and a malformed edit rejected; the file changes only by that section
  - started late: the work ran before wf start 4.6, which the impl check caught at the end; recorded as learning 10
  - core: readSections and writeSection address a file's ## sections by position (steer headings repeat); a replacement starts with its ## line, has no other top heading or bare tag, and only its lines are spliced; the whole file then passes its own rule or nothing is written
  - rules: steers through parseSteers, risks through a new strict parseRisks (heading, Action, Why, Surface, Recover, level low|medium|high), memory keeps its five sections and the Deferred table, docs need only the section rules
  - dashboard: Sections.svelte replaces the rendered-file views for steers, risks, memory and docs: each section rendered (line breaks kept for steers and risks) with an Edit button that opens its markdown in a shadcn Textarea; one section action through changeSection; renderState removed
  - tests: wf 71 (every section of the real steers, risks, memory, implementation and spec written back leaves them byte-identical; an edit changes only its lines; each file's rule refuses a broken edit); dashboard e2e 36; screenshots refuse a malformed steer on this repo with its hash unchanged and edit the throwaway's memory, restored in afterEach
- [x] 4.7 dashboard built and served at boot by a systemd user service on port 47913, bound to localhost
  Proof: systemctl --user is-enabled and is-active report enabled and active; curl on 127.0.0.1:47913 returns the real projects; the learnings meter shows a real size from the build
  - dashboard/wf-dashboard.service runs node on dashboard/build with PORT=47913 and HOST=127.0.0.1, path through %h; enabled with systemctl --user enable --now on the repo file, and loginctl enable-linger so it starts at boot; verified: enabled, active, listening on 127.0.0.1:47913 only, real projects listed, learnings meter 3,979
  - wf core finds its checkout by walking up to global/states.md instead of a fixed ../ from its file, so the bundled build reads states.md and the registry without WF_HOME (the meter read 0 before); scaffold README replaced with the dashboard's own
  - Served at http://wf.localhost through the owner's Caddy; ORIGIN=http://wf.localhost in the unit, since adapter-node assumes https without it and refused every form save as cross-site (403); verified by adding and removing a learning on the demo project through the alias, file hash unchanged after
- [x] 4.8 settings page: the owner sets each limit's value and mode (refuse, warn or off) for the session context size, learning length and handoff lines, plus listing sizes; stored in a machine-local config file that agents can't touch
  Proof: Playwright tests change a limit to refuse and see wf refuse, then to warn and see a warning; an agent Edit, Bash or curl at the config is denied; screenshots of the real page at desktop and mobile; a save through http://wf.localhost works
  - Owner-only: wf has no command for settings; the hooks deny agents an Edit or Write of the file, any shell command naming it, and the dashboard's settings action, alongside admin mode and the session store
  - Dashboard /settings (sidebar link beside Global): limits and listings as two panels of rows, each with its default, number inputs on local drafts that survive the refresh, a mode select, Save disabled until something changes, Discard changes; Playwright sets a limit to refuse and sees wf refuse, then warn and sees wf write; screenshots scratch/images/4.8-settings*.png from the real page at desktop and mobile
  - Settings in wf core: three limits (context characters, learning characters, handoff lines), each a value and a mode refuse, warn or off, plus listed items and title characters; defaults 4,000 warn, 200 warn, 15 refuse, 5, 80; stored machine-local in local/wf-settings.json, read on every command, validated field by field; a refused write is rolled back; removals are never refused; the context limit checks only the project wf runs in; the store guards skip a bare wf call whose text merely names a store
  - Limits reworked on the owner's steer: each has a warn and a refuse threshold instead of a value and a mode, -1 turns either off, refuse must sit above warn; listings take -1 for no cap; defaults warn 4,000, warn 200, refuse 15 lines; the page shows both thresholds per limit; a settings file wf can't read shows the defaults with the reason on the page, and saving replaces it; the learnings meter shows the warn limit, else the refuse limit, else no meter
  - Every limit now follows the owner's settings everywhere: the dashboard's learning counter (add and edit) shows the warn and refuse limits, amber past warn and red past refuse, and a dashboard save shows wf's warnings; a settings file wf can't read never stops work: every command warns and the defaults apply until the owner saves; no hardcoded limit is left (grep of wf, dashboard, guidance and help)

## [~] 5 · Guidance and skills
Deliverable: global/CLAUDE.md complete and readable in one sitting, importing the adapted ponytail and karpathy rules; tdd, diagnosing-bugs and codebase-design installed as adapted skills

- [ ] 5.1 fold the vetted skills' always-on parts into `global/CLAUDE.md` (with 5.2), keeping it short
  Proof: the owner reads the updated `global/CLAUDE.md` in one sitting and signs off
- [x] 5.2 vet and adapt ponytail and karpathy (always-on rules) and mattpocock's tdd, diagnosing-bugs and codebase-design (skills)
  Proof: a diff of each adaptation against upstream; no hooks or binaries present
  - impeccable vetted earlier: only SKILL.src.md and reference/*.md are usable; scripts/ (a launcher that downloads a binary and pings impeccable.style), agents/ and hermes-plugin/ are excluded; installing it as a skill moved to 5.5
  - cloned shallow into scratch/thirdparty (refs had been emptied): ponytail 96608e0, andrej-karpathy-skills 2c60614, mattpocock/skills 5863806; vetted: karpathy is markdown only; ponytail ships JS hooks, a statusline, commands and many plugin manifests; mattpocock ships shell scripts; only markdown is taken
  - global/rules/ponytail.md and karpathy.md (always-on, to be linked into ~/.claude/rules/ by 5.4) and global/skills/{tdd,diagnosing-bugs,codebase-design}/, copied verbatim then edited so the owner's rules win; global/THIRD-PARTY.md has each upstream, commit, what was left out, what changed, and the MIT texts
  - proof: diff -ru of each copy against its upstream path shows only the listed changes; every file under global/ is mode 644 markdown, with no hooks, scripts or binaries
- [x] 5.3 seed global learnings from the three failed attempts
  Proof: `wf status` shows them; under the budget
  - global learnings 14 to 17 from intent.md's lessons and references.md's failures: hand-editing drift, too many loose states, hooks as the main control, logs that grew and facts copied in three places; the rest (claude -p, unasked mechanisms, honesty, friction) were already 1 to 5
  - project learnings 3 and 4 removed as duplicates of global 15 and 16 (wf learn --remove), and learning 8's citation renumbered; wf status shows 17 global and 10 project, and the fullest session context is 7,015 of 9,000
- [x] 5.4 wf install also links global/rules/ files into ~/.claude/rules/ and global/skills/ folders into ~/.claude/skills/ (the CLAUDE.md link is 1.12)
  Proof: on a fresh HOME, install links the skills into claude-setup; a second run changes nothing
  - install.ts linkEach: every entry of global/rules/ is linked into ~/.claude/rules/ and every folder of global/skills/ into ~/.claude/skills/, by the same name, through the existing linkTo, so a file the owner made there is never replaced
  - proof: install.test.ts on a fresh HOME links both rules and all three skills beside the owner's own rule and skill, a second run prints 'already installed', and a same-named skill of the owner's is refused untouched; wf help install names the links
- [~] 5.5 impeccable installed as a code-led skill in global/skills/impeccable: router and design references kept; launcher, detector, decision page, catalog rolls and the comp-led pipeline left out; a new look is three directions the owner picks from
  Proof: a diff against upstream with no launcher call left; in a fresh session /impeccable loads and a UI task follows its craft floor; Apache-2.0 notice and changes in THIRD-PARTY.md
  - global/skills/impeccable: SKILL.md and 35 references copied from upstream d41d986, placeholders filled for Claude Code, Codex blocks dropped; Setup reads PRODUCT.md, DESIGN.md and the direction contract directly; live, generate, pin, hooks, doctor and foundations removed
  - new-work and new-work-world rewritten code-led: the agent's ranked directions (lead, one alternate, the category standard) and a new surface's structures go to the owner via AskUserQuestion, with wf assume when away; the direction contract is a 'How \<surface> looks' section via wf doc; comp-led steps, seeds and the detector pass removed
  - critique runs one isolated design assessment with screenshots; snapshots and audit reports are plain .impeccable files that routing, polish and the trend line read; animate captures with Playwright; finish reviewer, documenter and motion reviewer are briefs for fresh general-purpose subagents
  - Apache-2.0: LICENSE and NOTICE.md copied unchanged, each of the 34 changed files carries a change notice, THIRD-PARTY.md lists what was taken, left out and changed; a sweep finds no launcher verb, placeholder or dead link left; install.test.ts expects the impeccable skill link
- [x] 5.6 tune the global guidance and wf from a review of cuda-kernels: what worked, where it failed, what the owner kept repeating
  Proof: a findings note in scratch/temp mapping each recurring problem to the guidance or wf change made for it; the changes committed; wf test passes
  - Three read-only agents reviewed cuda-kernels (owner messages, docs/state, tool-level transcript mining); findings mapped to changes in scratch/temp/5.6-findings.md
  - global/CLAUDE.md: work chosen by the owner's latest order after re-reading intent; steers taken literally; direction changes rewrite intent/overview first; answer-only requests; sourced, latest-only reports; idle on own jobs banned; bounded waits; new Subagents and Measurements sections; fast pre-commit checks; cloud, memory-cap and process-kill rules; one venv; wf only in the main checkout; few items in progress; impl details hold no status
  - global/states.md: discuss reads the references' core files and summarises the intent back for confirmation; a build steer rewrites the plan documents that no longer hold
  - wf: claudeDenial matches claude only as a command word with -p/--print before the next separator, and a bare wf call (quoted literals stripped, no shell operators) always passes; the budget refusal names each context part's size; wf handoff keeps the same budget (writeHandoffInBudget); help for learn, handoff and checks updated
  - Global learnings 18 to 21 removed with wf learn --remove --global: each is now a guideline in global/CLAUDE.md

## [ ] 6 · Real use
Deliverable: one real project taken from setup through its first major task with this setup, and the friction recorded as learnings.

- [ ] 6.1 run setup, discuss, build on a fresh project the owner picks
  Proof: that project's `docs/state/` and its commit history

## [x] 7 · cut the setup to what pays for its context
Deliverable: a session fits a 100k-token model: always-loaded rules (CLAUDE.md, ponytail, karpathy) about 2,700 tokens, the context re-injected after each compaction under 4,000 characters with the intent and current item in it, and no routine wf read growing with the project

- [x] 7.1 global/CLAUDE.md cut to the hard limits and the recurring corrections, with ponytail and karpathy folded into a few lines
  Proof: wc -c global/CLAUDE.md under 6,000; a list in scratch/temp mapping every removed rule to why it can go (inferable, enforced by wf, or duplicate)
  - global/CLAUDE.md rewritten from 19,010 to 5,200 bytes: hard limits, the owner's recurring corrections (intent, literal steers, answer-only, sourced reports, never idle, fair measurements) and one line each of ponytail and karpathy; what left and why is in scratch/temp/7.1-removed.md
- [x] 7.2 injected context cut to a 4,000-character brief: short state instructions, learnings pruned of what CLAUDE.md says, and a first-action line: wf status, wf get intent, restate the intent and current item
  Proof: sessionContext for each registered project printed per part, all under 4,000; wf test passes
  - CONTEXT_BUDGET 9,000 to 4,000; a first-action part (wf status, wf get intent, restate intent and current item) injected at every session start and compaction; states.md cut to a short paragraph per state; global learnings 16 to 1 and project learnings 11 to 8, keeping only what CLAUDE.md doesn't say; handoff shortened; sizes now demo 1,283, claude-setup 2,861, DSAPatterns 2,477, cuda-kernels 5,605 (its own learnings and handoff need pruning in its own session)
- [x] 7.3 routine wf reads bounded: wf status titles five active items, listings cut titles to 80 characters, wf show prints the five newest steers
  Proof: on a copy of cuda-kernels' state, wf status under 1,000 characters (from 7,642) and wf show 12 under 4,000 (from 6,021); wf test passes
  - wf status titles the first five active items (titles cut to 80 characters) and lists the rest by id; wf show on a major cuts minor titles to 80 and prints only the five newest steers with a count of older ones; on a copy of cuda-kernels' state status went 7,642 to 788 characters and show 12 6,021 to 3,509; archiving finished majors dropped: cuda had one done major of 15, so it would not have helped
- [x] 7.4 impeccable slimmed for small models: a short core SKILL.md, references loaded only by the step that needs them
  Proof: SKILL.md under 4,000 characters; a new-surface path loads under 20,000 characters in all, down from about 45,000; no reference link left dangling
  - An agent cut SKILL.md 10,570 to 3,519 and the new-surface path (SKILL, new-work, new-work-world, craft-floor, the largest mode file) 45,375 to 19,573 characters: rule-id comments, rationale, restating examples and comp-pipeline remnants removed; adaptation decisions, contract blocks, craft-floor checks and change notices kept; every linked file checked to exist; THIRD-PARTY.md notes the cut
- [x] 7.5 ponytail and karpathy kept as always-loaded rules: the owner needs them for coding ethics; the removal is withdrawn
  Proof: global/rules/ponytail.md and karpathy.md unchanged and still linked by wf install; no removal pending in the handoff
  - Removal withdrawn on the owner's steer: global/rules/ponytail.md and karpathy.md stay and wf install still links them; CLAUDE.md's Code section now points to them instead of repeating ponytail
