# Spec

The exact formats and commands. `implementation.md` says how they get built.

## 1. Locations

| Path | What | In git |
|---|---|---|
| `<project>/docs/state/*.md` | project state (section 3) | yes |
| `<project>/.githooks/pre-commit` | the checks the owner named in setup, written by `wf checks` | yes |
| `<project>/.githooks/pre-push` | optional: commands the owner names to run when a major is pushed (for example, a deploy), written by `wf push`; absent when there are none | yes |
| `<project>/scratch/scripts/` | project scripts | yes |
| `<project>/scratch/images/` | UI screenshots at each size, `<id>-<page>-<size>.png`, written by the Playwright tests | yes |
| `<project>/scratch/{temp,refs,links,thirdparty}/` | logs and temp output; refs to the owner's own projects; links to collaborating projects; other cloned repos | no |
| `claude-setup/global/learnings.md` | global learnings | yes |
| `claude-setup/global/CLAUDE.md` | global guidance, linked to `~/.claude/CLAUDE.md` | yes |
| `claude-setup/global/rules/` | vetted, adapted always-on rules, each linked into `~/.claude/rules/` | yes |
| `claude-setup/global/skills/` | vetted, adapted skills, each linked into `~/.claude/skills/` | yes |
| `claude-setup/global/THIRD-PARTY.md` | each adapted file's upstream, commit, licence and changes | yes |
| `claude-setup/local/projects.json` | registered projects and their admin flag, machine-local | no |
claude-setup's repo is public. Every project repo is private.

## 2. States

- **setup** is the default when a project is registered, and only one commit is allowed during it:
  `init`.
  - **Writes:** full project write access.
  - **Commit:** all setup changes go into that one `init` commit, amended locally as setup continues.
  - **Push:** blocked until the owner's own prompt contains the words `setup done`. Then `init` is pushed
    to `work`, and `main` is created at the same commit and pushed, so both branches start from `init`.
  - **Amend and force-push** are allowed only for this first `init` commit, while still in setup. Anywhere
    else, only when the owner explicitly says so.
  - **Work:** scaffold natively for the stack the owner names until the bare app deploys; `.gitignore`;
    the checks; any pre-push commands; refs and links.
- **discuss** is the planning state.
  - **Writes:** no project file writes. All planning goes through `wf`: overview, intent, references,
    implementation, spec and todos.
  - **Exit:** the agent leaves discuss only when the owner says so. This is a prompt boundary, not
    enforced.
- **build** has full write access.
  - **Commits and pushes:** a micro commit at each change boundary. Push when a minor item is checked.
- **Commit order, in every state:**
  1. Verify the item's proof.
  2. Run the pre-commit checks.
  3. Update state through `wf`: mark the item done, add the implementation details, rewrite the handoff.
  4. Commit.
  5. Push.

  An item is never marked done just because a commit is coming. Nothing that happens after the commit (the
  push, a branch created afterwards) is recorded as done in it. This applies to `init` too, so every
  commit carries its own verified state.
  - **Deletions and other high-risk actions:** only on the owner's explicit prompt, logged first with
    `wf risk`.
- **Switching:** the owner or the agent switches with `wf state <name>`, and the owner can also switch in
  the dashboard. The agent switches only when the owner asks.
- **Admin mode** is separate from the three states and only the owner can turn it on or off.
  - **Turning it on or off:** in the dashboard, or with `wf admin on|off` in the owner's own terminal.
  - **What it disables:** every hook and `wf` restriction: read-only state, discuss write block, setup
    push block, `.env` rules.
  - **What still applies:** Claude Code's own auto mode still guards risks.

## 3. Project state files (`docs/state/`)

The agent may read them. It never edits them directly; `wf` writes them. The owner edits them through the
dashboard, or by hand in admin mode. `wf` refuses to write if a file no longer parses, and names the line.

| File | Content | In context |
|---|---|---|
| `overview.md` | what it is, scope, out of scope | on demand |
| `intent.md` | why, pain, users, beginner/expert, where it shines, principles | on demand |
| `references.md` | per reference: what it teaches, what went wrong | on demand |
| `implementation.md` | how it's built, start to finish, plain English | on demand |
| `spec.md` | formats, schemas, commands | on demand |
| `todo.md` | majors, minors, implementation details | on demand (active items injected) |
| `memory.md` | invariants, contracts, pitfalls, anti-patterns, deferred registry | on demand |
| `learnings.md` | short numbered lessons | **always** |
| `steers.md` | logged steers and assumptions | on demand |
| `risks.md` | logged high-risk actions | on demand |
| `handoff.md` | state, active items, next, what not to do | **always** |

### 3.1 IDs

- **Major:** `x`.
- **Minor:** `x.x`.
- **Micro:** `x.x.x`, which appears only in commit messages.
- **Rules:** integers only, assigned by `wf` as max+1. IDs are never reused.
- **Commit subject:** `<id> <keywords>`, for example `3 dashboard`, `3.2 tabs` or `3.2.1 fix tab state`.
  The pre-push hook relies on this to recognise a major.

### 3.2 `todo.md`

```
# Todo

## [ ] 1 · <title>
Deliverable: <what the owner can inspect>

- [ ] 1.1 <title>
  Proof: <the tangible, verifiable thing that shows it works>
  - <implementation detail: how it was actually built>
- [~] 1.2 <title>
  Proof: ...
```

**Marks:**
- `[ ]` open;
- `[~]` in progress;
- `[x]` done.

**Rules `wf` enforces:**
- `todo.md` is always in id order.
- `wf start` only on an open minor. Minors in any number of majors may be in progress. Finishing a major
  before moving on is guidance, so an item waiting on the owner never stalls the work.
- `wf done` only on an in-progress item.
- A major can be checked only when all its minors are checked.
- Implementation details are added only to an in-progress or done minor.

### 3.3 `learnings.md` (and `global/learnings.md`)

```
# Learnings

1. <what went wrong> → <what to do instead>
```

- **Size:** one line each, at most 200 characters.
- **Order:** numbered 1..n and cited by number. Removing one renumbers the rest, so the list never has gaps.
- **Rules:** adding and editing apply the same checks: one line, the arrow, at most 200 characters.
- **Budget:** adding or editing is refused when it would bring any affected project's session-start
  context over 9,000 characters (Claude Code caps hook context at 10,000), and asks for a merge or a prune
  instead. A global learning affects every registered project. Removing is always allowed.
- **Writers:** `wf learn` and the dashboard, through the same core functions.

### 3.4 `steers.md`

```
## <date> · affects <ids>
Steer: <short summary of what the owner wants>
Why: <why it counts as a steer>
Changed: <what in the plan changed>
```

Always a summary, never the owner's message verbatim. Assumptions use the same shape with `Assumption:`
in place of `Steer:`. They are taken only when the owner is away, and they choose the most reversible
option.

### 3.5 `risks.md`

```
## <date> · <item id> · <risk: low|medium|high>
Action: <the exact command or change>
Why: <reason>
Surface: <what it touches>
Recover: <how to undo or roll back>
```

### 3.6 `memory.md`

The sections are fixed: `## Invariants`, `## Contracts`, `## Pitfalls`, `## Anti-patterns`, `## Deferred`.
- **Invariants** and **anti-patterns** are numbered lists.
- **Pitfalls** are dated entries with their cause.
- **Deferred** is a table with columns item | resolves in `<id>`. Every deferred item must name an
  existing todo id.

### 3.7 `handoff.md`

```
# Handoff
State: <setup|discuss|build>
Active: <ids or —>
Next: <one line>
Verify: <command and expected result>
Don't: <short list>
Open: <questions waiting for the owner, or —>
```

- **Size:** at most 15 lines.
- **Update:** rewritten with `wf handoff` at the end of each minor item, and whenever work stops.

## 4. `wf` commands

The agent runs `wf` as one command per call. Every write prints the changed lines; reads print plain text.
`wf help` lists every command; `wf help <command>` (or `wf <command> --help`) prints its usage and the
rules it enforces. `wf/help.ts` is the one list of commands.

**Queries**
- `wf status`: the state, active items, the next open item, and the learnings count.
- `wf next`: the first open minor in the active major, otherwise the first open major.
- `wf show <id>`: the item, its proof and implementation details, plus the steers and deferred entries that
  name it.
- `wf find <text>`: case-insensitive search across all state files, printed as file:line plus the line.
- `wf get <file> [section]`: print one state file or one section of it.

**Todos**: `todo.md` is always in id order (majors by number, minors by number within their major), so
position follows the id and nothing reorders items.
- `wf add major "<title>" --deliverable "<text>"`
- `wf add minor <major> "<title>" --proof "<text>"`
- `wf batch <file>`: add many majors and minors at once, all or nothing. The file (written in
  `scratch/temp/` first) is the `todo.md` shape without ids or marks:
  - `## <title>` then `Deliverable: <text>`: a new major;
  - `## <id>`: an existing major, to add minors to;
  - `- <title>` then `  Proof: <text>`: a minor under the header above.

  Any error names the batch file's line and nothing is written.
- `wf edit <id> [--title ...] [--proof ...] [--deliverable ...]`: proofs belong to minors, deliverables to
  majors.
- `wf start <id>` and `wf done <id>`
- `wf impl <id> "<detail>"`

**Records**
- `wf steer "<owner words>" --why "<reason>" --log true|false --changed "<text>"`: with `--log false` the
  plan is updated but no entry is written.
- `wf assume "<assumption>" --why "<reason>" --changed "<text>"`
- `wf learn "<line>"` (project) or `wf learn --global "<line>"`: add one.
  - `wf learn --edit <n> "<line>" [--global]`: rewrite learning n in place.
  - `wf learn --remove <n> [--global]`: remove learning n and renumber the rest; this is how a merge or a
    prune is done.
- `wf memory <section> "<entry>"`
- `wf doc <name> [--section "<heading>"] --from <file>`: write overview, intent, references,
  implementation or spec.
  - **Whole document:** the file starts with `# <Title>`.
  - **One section:** the file is the body of `## <heading>`, with no `#` or `##` headings inside (`###` is
    fine). It replaces that section, or is appended if the section is new.
- `wf risk --action "..." --why "..." --level low|medium|high --surface "..." --recover "..."`: rejects the
  request and names every missing field. The action may run only after it succeeds.
- `wf handoff --next "..." --verify "..." --dont "..." [--open "..." ...]`

**State**
- `wf init`: in a new project, create `docs/state/` from empty templates, register it and set the state to
  setup. In a project that already has `docs/state/`, check it parses and register it.
- `wf state setup|discuss|build`
- `wf admin on|off`: refused when run from inside Claude Code (section 6).

**Machine**
- `wf install`: once per machine, by the owner in a terminal. Links `wf` onto PATH and registers the
  hooks; refuses to run inside Claude Code.
- `wf hook session-start|pre-tool-use`: the hook entry points (section 5).

**Env and checks**
- `wf env set <KEY> <value>`: add or overwrite one key in `.env`. It never prints or reads values back,
  and nothing is logged.
- `wf env keys`: list key names only.
- `wf checks set "<cmd>" ["<cmd>" ...]`: write `.githooks/pre-commit` to run these in order, failing on the
  first failure. Also sets `core.hooksPath`.
- `wf push set ["<cmd>" ...]`: write `.githooks/pre-push`, which runs these commands in order only when a
  pushed commit is a major, blocking the push on the first failure.
  - A major is a commit whose subject starts with a bare integer ID (section 3.1). Every other push goes
    through and runs nothing.
  - With no commands, the hook is removed.

## 5. Hooks (registered once, in user settings)

| Hook | Does |
|---|---|
| SessionStart (startup, resume, clear, compact) | prints global learnings, project learnings, the handoff, and the guidance for the current state |
| UserPromptSubmit | if the prompt contains `setup done` while in setup, records it (that unblocks the push) |
| PreToolUse Edit/Write/NotebookEdit | denies writes to `docs/state/**`, `global/learnings.md`, `.env`, `scratch/links/**`, and any project file while in discuss |
| PreToolUse Bash | denies commands that read or print `.env` (other than `.env.example` or `.env.local`), `git push` while in setup before `setup done`, `claude -p`/`--print`, and any command that touches the admin store |
| PreToolUse Read | denies `.env` |

When admin is on for the project, every hook passes. A denial always says what to do instead (for example,
"use `wf learn`").

## 6. Admin mode and its limit

- **Where the flag lives:** `local/projects.json` in claude-setup.
- **Who can change it:**
  - The dashboard changes it from the owner's browser.
  - `wf admin` changes it from the owner's terminal, and refuses when `CLAUDECODE` is set (Claude Code
    sets it in the agent's shell).
  - The hooks deny any agent tool call that mentions the admin store, `wf admin`, or the dashboard's
    admin endpoint.
- **Known limit, stated plainly:** the agent runs as the same OS user, so a determined workaround (for
  example, a script written to a file and then run) can't be fully excluded without OS-level separation. The
  guidance forbids it outright. If it ever happens, it gets recorded as a global learning.
