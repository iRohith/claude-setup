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
- [x] 0.6 no-PII and no-secrets pre-commit gitleaks run
  Proof: commits containing the git config email or a fake API key are each rejected; `git log -p` of `init` contains neither
  - `gitleaks git --pre-commit --staged --redact --no-banner`, with its config built at runtime and passed through `GITLEAKS_CONFIG_TOML`: gitleaks' default rules, plus one rule each for git config `user.name` and `user.email`, so the PII patterns never touch a tracked file
  - the written guidance rule goes into `global/CLAUDE.md` in 5.1
  - `.githooks/pre-commit` (bash): a case-insensitive literal rule each for the git config name and email, merged with gitleaks defaults; `core.hooksPath=.githooks`
  - tested in a throwaway repo with a fake identity: the fake email and a fake `ghp_` token were each rejected; a clean commit passed
  - an earlier `local/pii.txt` list of extra patterns was removed: the owner said gitleaks is enough
  - `--verbose --redact` so a block names file, line and rule but never the value
  - the first real `init` attempt was blocked: `LICENSE:3` (the copyright line) matches the git config name; the owner allowed it, so `.gitleaksignore` holds only that fingerprint (`LICENSE:pii-1:3`, no PII in it)
- [x] 0.5 the `init` commit; push after the owner says "setup done"
  Proof: `git log origin/work` shows exactly `init`
  - `git push -u origin work`; `origin/work` holds only `init`; the repo is public, default branch `work`
  - `init` was amended with owner approval, once to carry its own state and once for the pre-push plan; each force-push is logged in `risks.md`
  - `main` gets created at `init` after the push. It is verified, and major 0 checked, in the first build commit, because `init` can't record its own branch
  - verified: `git ls-remote --heads origin` shows `main` and `work` both at `5ad00ff` (`init`)

## [~] 1 · Crude end to end: plan through `wf`, can't hand-edit state, a new session picks up
Deliverable: in a throwaway project, a Claude session adds a major and two minors with `wf`, fails to edit `docs/state/todo.md` directly, and a fresh session starts with the handoff and learnings in context; the dashboard lists the todo.

- [x] 1.1 core: parse and write `todo.md` and `handoff.md`, IDs, the start/done rules
  Proof: a test script round-trips a sample todo unchanged and rejects starting minors in two majors
  - `wf/core.ts`, one file: parse and format for `todo.md` and `handoff.md` in a strict format with one line per field; parse errors name file:line
  - rules: start only an open minor; only one major may have minors in progress; done needs in-progress; a major needs at least one minor and all of them done; implementation details only on started minors; ids are max+1, minors start at .1, duplicates rejected
  - writes go to `.tmp` then rename; the single-writer lock comes in 1.2, where the CLI writes
  - `wf/core.test.ts`: 11 `node:test` tests, including that the real `todo.md` and `handoff.md` are canonical; `pnpm --dir wf test` added to the pre-commit hook
  - `todo.md` rewritten once into the strict format: wrapped lines joined, no content changed
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
- [x] 1.2 cli: `init`, `status`, `next`, `show`, `add`, `start`, `done`, `impl`, `handoff`
  Proof: the commands run against a sample project and print the changed lines
  - `wf/cli.ts` parses arguments with `node:util` parseArgs, calls the core and prints; usage errors exit 2, rule errors exit 1 as `wf: <reason>`
  - every write prints its changed lines (an LCS line diff: `- ` removed, `+ ` added); writes hold a single-writer lock in `scratch/temp/wf.lock` and take it over from a dead process
  - core gained `activeMinors`, `nextItem` (stays in the active major; otherwise the first unfinished major), `withLock`, `initProject` (empty templates, setup state) and the registry `local/projects.json` under `WF_HOME` (default: claude-setup)
  - `wf/cli.test.ts`: 7 tests run the real CLI against a sample project in `scratch/temp/` with a temp `WF_HOME` (removed afterwards); 19 of 19 wf tests pass; also ran `wf status` and `wf show 1` on this repo
- [~] 1.3 hooks: SessionStart injection and the PreToolUse deny on `docs/state/**`
  Proof: transcript of a real session showing the injected context and the denied Edit with its alternative
- [~] 1.4 install.sh: links, PATH, hook registration
  Proof: on a clean `~/.claude` the throwaway project works with no per-project step
- [~] 1.5 dashboard: read-only project list and todo tab
  Proof: screenshot of the throwaway project's todo
  - dashboard reads through the core as the workspace package `wf` (`exports` → `core.ts`); `src/lib/server/projects.ts` lists the registry and summarises each project; `/` lists projects, `/projects/<abs path>` shows the todo; unregistered paths return 404
  - throwaway project `scratch/temp/demo` built with wf only (init, a major, two minors, one started, one detail); both pages render every field over curl; the screenshot waits on a browser for the Playwright MCP

## [ ] 2 · States and admin
Deliverable: setup/discuss/build behave as spec section 2 in a real session, and admin mode lifts every restriction only when the owner flips it.

- [ ] 2.1 `wf state`, state stored per project, guidance per state in SessionStart
  Proof: switching states changes the injected guidance on the next session start
- [ ] 2.2 discuss write block; setup push block until "setup done"
  Proof: transcript showing a denied Edit in discuss and a denied push in setup, then the push allowed after "setup done"
- [ ] 2.3 admin mode: dashboard toggle, `wf admin` refused inside Claude Code, hooks pass when on
  Proof: transcript of the agent failing to turn it on; the owner turns it on and the state file edit goes through

## [ ] 3 · Records
Deliverable: every record type from spec section 3 written and queried through `wf`.

- [ ] 3.1 learnings (project and global) with a size budget that keeps the whole SessionStart context under Claude Code's 10,000-character cap; injected at SessionStart
  Proof: a learning added in one session appears in the next session's context, including after `/compact`
- [ ] 3.2 steers and assumptions with `--why` and `--log`
  Proof: `wf show <id>` lists the steer that changed it
- [ ] 3.3 `wf risk` with all four fields required
  Proof: a request missing `--recover` is rejected naming the field
- [ ] 3.4 memory sections, doc sections, `wf edit`, `wf move`, `wf batch`, `wf find`, `wf get`
  Proof: a batch with one bad line changes nothing; `wf find` hits across files
- [ ] 3.5 `wf env set` and `wf env keys`; `.env` read and print denied
  Proof: `.env` gets the key; the transcript never shows a value; `cat .env` is denied
- [ ] 3.6 `wf checks set` (pre-commit) and `wf push set` (optional pre-push, majors only, for example a deploy)
  Proof: pushing a major runs the commands, and a failing one blocks the push; pushing a minor or micro runs nothing; after `wf push set` with no commands, no hook exists

## [ ] 4 · Dashboard, full
Deliverable: the owner manages todos and learnings across all projects without touching a file.

- [ ] 4.1 editing: add, edit, reorder, check, with core validation errors shown inline
  Proof: screenshots of each action and of a rejected edit
- [ ] 4.2 tabs for every registered project plus Global; steers, risks, memory and docs views; state switcher
  Proof: screenshots across two projects
- [ ] 4.3 UI designed from actual use (impeccable), mobile-friendly
  Proof: desktop and phone-width screenshots reviewed by the owner

## [ ] 5 · Guidance and skills
Deliverable: `global/CLAUDE.md` under about 80 lines, with the four skills installed as spec'd.

- [ ] 5.1 write `global/CLAUDE.md`
  Proof: the owner reads it in one sitting and signs off
- [ ] 5.2 vet and adapt ponytail, mattpocock, karpathy; impeccable on demand
  Proof: a diff of each adaptation against upstream; no hooks or binaries present
- [ ] 5.3 seed global learnings from the three failed attempts
  Proof: `wf status` shows them; under the budget

## [ ] 6 · Real use
Deliverable: one real project taken from setup through its first major task with this setup, and the friction recorded as learnings.

- [ ] 6.1 run setup, discuss, build on a fresh project the owner picks
  Proof: that project's `docs/state/` and its commit history
