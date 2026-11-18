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
- [~] 1.3 hooks: SessionStart injection and the PreToolUse deny on `docs/state/**`
  Proof: transcript of a real session showing the injected context and the denied Edit with its alternative
- [~] 1.4 `wf install`: wf on PATH and hook registration (the CLAUDE.md and skills links are 5.4)
  Proof: on a clean `~/.claude` the throwaway project works with no per-project step
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

## [ ] 2 · States and admin
Deliverable: setup/discuss/build behave as spec section 2 in a real session, and admin mode lifts every restriction only when the owner flips it.

- [ ] 2.1 `wf state`, state stored per project, guidance per state in SessionStart
  Proof: switching states changes the injected guidance on the next session start
- [ ] 2.2 discuss write block; setup push block until "setup done"
  Proof: transcript showing a denied Edit in discuss and a denied push in setup, then the push allowed after "setup done"
- [ ] 2.3 admin mode: dashboard toggle, `wf admin` refused inside Claude Code, hooks pass when on
  Proof: transcript of the agent failing to turn it on; the owner turns it on and the state file edit goes through
- [ ] 2.4 the remaining hook denials from spec section 5: Edit/Write on `scratch/links/**`, and Bash running `claude -p` or `--print`
  Proof: hook tests and a real session show each one denied with its alternative

## [ ] 3 · Records
Deliverable: every record type from spec section 3 written and queried through `wf`.

- [ ] 3.1 learnings (project and global) with a size budget that keeps the whole SessionStart context under Claude Code's 10,000-character cap; injected at SessionStart
  Proof: a learning added in one session appears in the next session's context, including after `/compact`
- [ ] 3.2 steers and assumptions with `--why` and `--log`
  Proof: `wf show <id>` lists the steer that changed it
- [ ] 3.3 `wf risk` with all four fields required
  Proof: a request missing `--recover` is rejected naming the field
- [ ] 3.4 memory sections, `wf find`, `wf get`
  Proof: `wf find` hits across files; `wf get` prints one section
- [ ] 3.5 `wf env set` and `wf env keys`; `.env` read, print and direct Edit/Write denied
  Proof: `.env` gets the key; the transcript never shows a value; `cat .env` is denied
- [ ] 3.6 `wf checks set` (pre-commit) and `wf push set` (optional pre-push, majors only, for example a deploy)
  Proof: pushing a major runs the commands, and a failing one blocks the push; pushing a minor or micro runs nothing; after `wf push set` with no commands, no hook exists
- [ ] 3.7 deferred registry: `wf defer "<item>" --resolves <id>` writes the Deferred table in memory.md; an unknown id is rejected; `wf show <id>` lists the deferred entries that name it
  Proof: a deferral naming a missing id is rejected; `wf show` on the resolving id lists the entry

## [ ] 4 · Dashboard, full
Deliverable: the owner manages todos and learnings across all projects without touching a file.

- [ ] 4.1 editing: add, edit, check, with core validation errors shown inline (items sit in id order, so there is no reordering)
  Proof: screenshots of each action and of a rejected edit
- [ ] 4.2 tabs for every registered project plus Global; steers, risks, memory and docs views; state switcher
  Proof: screenshots across two projects
- [ ] 4.3 UI designed from actual use (impeccable), mobile-friendly
  Proof: desktop and phone-width screenshots reviewed by the owner
- [ ] 4.4 edit project and global learnings in the dashboard, through the same core rules and size budget
  Proof: screenshots of a learning added and an over-budget one rejected, from the real dashboard at desktop and mobile

## [ ] 5 · Guidance and skills
Deliverable: `global/CLAUDE.md` under about 80 lines, with the four skills installed as spec'd.

- [ ] 5.1 write `global/CLAUDE.md`
  Proof: the owner reads it in one sitting and signs off
- [ ] 5.2 vet and adapt ponytail, mattpocock, karpathy; impeccable on demand
  Proof: a diff of each adaptation against upstream; no hooks or binaries present
- [ ] 5.3 seed global learnings from the three failed attempts
  Proof: `wf status` shows them; under the budget
- [ ] 5.4 `wf install` also links `~/.claude/CLAUDE.md` and the vetted skills into claude-setup
  Proof: on a fresh HOME, install creates both links pointing into claude-setup; a second run changes nothing

## [ ] 6 · Real use
Deliverable: one real project taken from setup through its first major task with this setup, and the friction recorded as learnings.

- [ ] 6.1 run setup, discuss, build on a fresh project the owner picks
  Proof: that project's `docs/state/` and its commit history
