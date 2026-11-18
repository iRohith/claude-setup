# Instructions per state

## setup

The project is in setup. Goal: a clean, deployable bare app for the owner's stack and the project's
checks, before the idea is even discussed. Full write access to the project.
1. If `docs/state/` doesn't exist, run `wf init` (it also registers a project the owner scaffolded by
   hand). Run `wf status`.
2. Ask the owner for anything not named yet: the stack, the pre-commit checks, and any commands to run
   when a major is pushed (a deploy, say). Don't guess them.
3. `git init -b work`, then `gh repo create <folder name> --private --source . --remote origin`. Don't
   push yet.
4. Scaffold natively for the named stack (`pnpm dlx sv create`, `cargo init`, …) until the bare app runs
   and deploys. Nothing stack-specific comes from wf.
5. `.gitignore`: `.env`, `.env.local`, `scratch/temp/`, `scratch/refs/`, `scratch/links/`,
   `scratch/thirdparty/`, plus the stack's own build output.
6. `.githooks/pre-commit` (a script) and `git config core.hooksPath .githooks`.
   - **First, secrets and PII:** run
     `gitleaks git --pre-commit --staged --redact --no-banner --verbose`. Pass it a config through the
     `GITLEAKS_CONFIG_TOML` environment variable, built at runtime. The config is `[extend] useDefault =
     true`, plus one case-insensitive literal rule each for `git config user.name` and `user.email`. That
     way the values never land in a file.
   - **Then the owner's checks,** with warnings as errors.
   - **Prove the hook works:** commit a deliberate failure and confirm it's rejected.
   - **Push commands:** if the owner named any, `.githooks/pre-push` runs them only when a pushed commit's
     subject starts with a bare integer (a major).
7. References the owner points to go in `scratch/refs/`, collaborating projects as links in
   `scratch/links/`, other clones in `scratch/thirdparty/`.
8. One commit only: `init`, amended as setup goes. No push until the owner writes "setup done". Then: update
   the state first, push `init` to `work`, create `main` at `init` and push it.
9. Stay in setup until the owner switches the state, usually to discuss.

## discuss

The project is in discuss: planning only. Nothing in the project changes except the state, through wf
(and the `docs/state/` files that have no wf command yet).
1. The owner explains the scope. Read the references in `scratch/refs/` first and infer the idea and the
   lessons, so the owner doesn't have to re-explain. Ask what matters now, most important first, and
   suggest your own answers for the owner to correct or approve.
2. Write the plan documents as the discussion settles, each through `wf doc` (text written in
   `scratch/temp/` first): overview, intent, references, implementation, spec. Their contents are listed
   in CLAUDE.md.
3. Write the todo with `wf batch <file>` (see `wf help batch`): majors with inspectable deliverables,
   minors with tangible proofs. The first major is a crude end-to-end version of what the owner actually
   asked for. Arrange the work so independent parts can run in parallel.
4. Record steers in `steers.md`, invariants and anti-patterns in `memory.md`, lessons in `learnings.md`.
5. Keep `wf handoff` current, with open questions for the owner as `--open`.
6. Stay in discuss until the owner says to leave it. The owner can bring the project back here at any
   time.

## build

The project is in build: implement the todo. Full write access to the project.
1. `wf next`, or the item the owner steers to. One major at a time; several of its minors may run together.
2. For each minor, follow "Working an item" in CLAUDE.md: start, build, prove, check, record, commit,
   push. Micro commits for change boundaries along the way.
3. A steer during build updates the plan first (todo and plan documents, `steers.md`), then the code.
4. When every minor of a major is done and its deliverable is verified, `wf done <major>`. Squash to
   `main` only when the owner says so.
5. Keep going to the next item without stopping. Stop only at a blocker only the owner can clear, and say
   exactly what is needed.
