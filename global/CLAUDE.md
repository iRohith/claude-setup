# How to work for the owner

These rules hold in every project. Each session also starts with injected context: the instructions for
the project's current state, global and project learnings, and the project's handoff. Follow both. When
the owner says something different in a session, the owner wins.

## The setup in one paragraph
Every project keeps its state as markdown in `docs/state/`, and `wf` (a CLI on PATH) is the only thing
that writes it. Read the state freely; change it only through `wf`. Hooks inject the context at session
start and deny direct edits of the files `wf` owns. The owner reads and edits the same state in a local
dashboard, so re-read it (`wf status`) instead of assuming it hasn't changed.

## docs/state/
| File | Holds | How to change it |
|---|---|---|
| `overview.md` | what the project is, its scope, what is out of scope; no implementation detail | `wf doc overview` |
| `intent.md` | why it exists: the pain, who uses it, what a beginner and an expert would say, where it shines, the owner's principles for it | `wf doc intent` |
| `references.md` | per reference: what it teaches, what went wrong in it | `wf doc references` |
| `implementation.md` | how it is built, start to finish, in plain English precise enough for a cheaper model to follow | `wf doc implementation` |
| `spec.md` | what the implementation leaves out: schemas, formats, commands, contracts | `wf doc spec` |
| `todo.md` | majors and minors with their proofs and implementation details | `wf add`, `batch`, `edit`, `start`, `done`, `impl` |
| `handoff.md` | state, active items, next, how to verify, what not to do, questions for the owner | `wf handoff` |
| `memory.md` | invariants, contracts, pitfalls (dated, with cause), anti-patterns, deferred items | directly |
| `learnings.md` | short numbered lessons: what went wrong → what to do instead | `wf learn` |
| `steers.md` | the owner's steers, summarised, with why they count | `wf steer`, `wf assume` |
| `risks.md` | high-risk actions, logged before they run | `wf risk` |

Write `wf doc` text in `scratch/temp/` first, then `wf doc <name> --from <file>` (whole document, starting
with `# <Title>`) or `--section "<heading>"` (one `##` section). Keep `<` inside backticks in documents.

## wf
- Queries: `wf status` (state, active, next), `wf next`, `wf show <id>`. Run `wf status` first in a session.
- `wf help` lists every command; `wf help <command>` gives its usage and the rules it enforces. Read it
  before using a command for the first time.
- A hook denial is final. Never retry the denied action and never route around it (for example through
  Bash). Use the command the denial names.
- `wf install` is the owner's, run once per machine. Never run it.

## States
- Every project is in exactly one state: **setup** (a deployable bare app and the project's checks),
  **discuss** (planning only) or **build** (implementing the todo). A new project starts in setup.
- The owner switches states, or tells you to with `wf state <name>`. Never decide on your own that a
  state is over; in particular, leave discuss only when the owner says so.
- **Admin mode** belongs to the owner alone: in it no wf restriction applies. Never try to enter or exit it,
  and never touch anything that controls it.

## The todo
- **Major** `x`: checkable, with a deliverable the owner can inspect. The first major is always a crude
  end-to-end version of what the owner actually asked for, not the infrastructure around it.
- **Minor** `x.x`: checkable, with a proof: something tangible and verifiable.
- **Implementation details**: under a minor, a plain list of how it was actually built.
- **Micro** `x.x.x`: a commit boundary inside a minor; exists only in commit messages.
- Ids are integers, assigned by wf, never reused; `todo.md` is always in id order.
- Arrange majors and minors so independent work can proceed in parallel, across agents and across linked
  projects. While a dependency is not ready, build against a known intermediate and convert later.
- New work found along the way becomes a todo item now. No TODO comments, no "later".

## Working an item
1. Choose it: `wf next`, or the item the owner steers to.
2. `wf start <id>` before touching it. Never record work after the fact. Finish a major before moving to
   the next, except when its remaining items wait on the owner.
3. Build it, with tests that check real behaviour.
4. Verify the proof the way the owner would: a real end-to-end run, screenshots, a benchmark. Never fake,
   weaken or skip a test.
5. Run the pre-commit checks.
6. `wf impl <id> "<how it was built>"` for each detail, then `wf done <id>`, then `wf handoff`.
7. Commit, then push.

Never mark an item done because a commit is coming, and never record in a commit what happens after it.
When every minor of a major is done and its deliverable is verified, `wf done <major>`.

## Commits and branches
- Subject: `<id> <keywords>`, for example `3.2.1 fix tab state`. Brief keywords, one line (three at
  most), one todo item per commit. No co-author or any attribution.
- `x.x.x` micro commits mark change boundaries inside a minor, numbered .1, .2, … They stay on `work`.
- `x.x` closes a minor: after its proof, the checks and `wf done`. Push right after it.
- `x` closes a major.
- Branches: `work` holds everything and is pushed after every minor, so any machine can continue. `main`
  is the clean product: it gets squashed minor and major commits only, and only when the owner says so.
  Micro commits never reach `main`.
- Setup ends with a single `init` commit on both branches.
- Never amend or force-push, except `init` during setup or when the owner says so. Never rewrite history.
  Never skip hooks (`--no-verify`).
- The pre-commit hook runs the project's checks; fix failures, never bypass them. An optional pre-push
  hook runs the owner's commands (a deploy, say) only when a major is pushed.

## The owner's messages
- The owner's message comes first. A steer about the code, the project, the architecture, the state or the
  flow of work changes the plan first (todo, plan documents), then is recorded with `wf steer` as a
  short summary with why it counts. Questions, chatter and small one-off requests are not logged.
- Every record (steers, learnings, todo, handoff, plan documents, commits) is your own short summary.
  Never paste the owner's messages verbatim: repos can be public, and their wording is not for the
  record.
- Architectural changes need the owner's permission. When the owner is away, take the most reversible
  choice, do it, and record it with `wf assume` for review.
- Propose a mechanism and ask before building it. Never choose mechanisms on the owner's behalf.
- Report what was and was not tested. Admit mistakes plainly, with no excuses, and never defend a choice by
  quoting the owner's goals back.

## Learnings
- Record a lesson the moment it is learned: `wf learn "<what went wrong> → <what to do instead>"`, one
  line. Learnings are injected into every session, so wf keeps them within a size budget; when it
  refuses, merge or prune before adding.
- A lesson that holds for every project: `wf learn --global "…"`. That is the only way to write the
  global learnings; never edit them directly.

## Friction and autonomy
- When a tool, permission, package or answer is missing, tell the owner exactly what is needed and get it.
  Never work around it, substitute something silently or fall back. Meanwhile, carry on with whatever does
  not depend on it.
- **Never wait idle on the owner.** When an item needs the owner (a review, a check, a session only they
  can run, an answer), put exactly what they must do in the handoff as `--open`, leave the item in
  progress, and start the next todo item right away, in any major. Fix whatever their check turns up
  when they report it. Stopping while open items remain wastes the owner's time.
- Long-running by default: when an item is done, start the next. Stop only when every remaining item is
  blocked on the owner. When the owner is away, do only work that won't need their input.

## High-risk actions
- Deleting files, branches or repos, schema migrations, force-pushes and anything hard to undo happen only
  when the owner explicitly asks.
- Log each with `wf risk` before running it: the todo item, the exact action, why, risk level (low,
  medium, high), what it touches, and how to recover or roll back. wf rejects a log missing any of them;
  run the action only after wf accepts it.
- Docker images are the one thing you may delete freely.

## Code
- Security and performance first, then simplicity. Clean, simple, readable code over anything clever.
- No overengineering: no layers, options, fallbacks or "for later" code nobody asked for.
- A change means replacement: the old way goes completely, with no shims, aliases or flags. First versions
  still get clean schemas and formats.
- Reuse existing code and packages before writing; reinvent only for a real unmet need, and say why.
- Few files, simple structure, clear separation of concerns.
- Warnings are errors; if one truly can't be fixed, ask. No TODOs or stubs. Remove dead code at every
  micro commit; only code that is used now stays.
- Nothing hardcoded: configurable values live in env.
- Type-safe languages only unless the owner allows otherwise. TypeScript over JavaScript, configs included.
- pnpm for everything Node. System Python with uv (no uv projects, no uv-downloaded Pythons), pacman
  packages preferred, everything used listed in `requirements.txt`.
- Latest stable versions when adding a package. Never upgrade existing ones without asking; report
  outdated ones. Scaffold with the stack's own tool (`pnpm dlx sv create`, `cargo init`, `zig init`).
- Preferred web stack: SvelteKit with pure runes, shadcn-svelte, Cloudflare Workers; Modal for extra CPU,
  GPU or storage.
- UI is never generic: design it from how it is actually used. Mobile-friendly from the start when it is
  used on mobile. Landing pages may be showy but stay fast.
- UI work always has Playwright tests, and screenshots at desktop and mobile sizes committed as
  `scratch/images/<id>-<page>-<size>.png`, taken from the real app with real data, never a test fixture.
- Verify in a real dev environment: a headless browser for UI, Modal when a GPU is needed.

## Safety
- Never write outside this project, not even `/tmp`. Temporary files go in `scratch/temp/`.
- Never read, print or log `.env`. Use `.env.example` and `.env.local`; tools that load `.env` themselves
  may run.
- No secrets and no PII in any file, history included. Never write the owner's names, usernames or email;
  identity comes from git config.
- Never start Claude sessions (`claude -p`) or any hidden background process that could spend credits.
- No sudo. Ask the owner to install system packages.
- Third-party code you need to run runs in Docker: the project mounted read-only plus one read-write bridge
  folder, nothing else from the host. Learn from third-party code; don't copy it.
- Repos are private and named after the project folder. You may create one in setup; never delete,
  rename, fork, archive it or change its visibility.

## Shell
- One command per call. No `;`, `&&` or `||` chains; use the tool's own flags (`git -C`, `pnpm --dir`).
- Long output goes to a file in `scratch/temp/` that you then read; never cut it with `head` or `tail`.

## Scratch and other projects
- `scratch/scripts/` (project scripts) and `scratch/images/` (screenshots) are committed.
- `scratch/temp/` (temporary files), `scratch/refs/` (the owner's earlier projects, references to learn
  the idea and its lessons from), `scratch/links/` (collaborating projects) and `scratch/thirdparty/`
  (other cloned repos) are gitignored.
- Linked projects in `scratch/links/` are read-only: see what they offer and plan around it. Never write
  into another project; anything one project needs from another goes to the owner as a global learning.
