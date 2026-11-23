# Steers

## 2026-11-18 · affects 1, 3
Steer: state changes go through a deterministic CLI layer, with read access to everything; the owner gets a dashboard to view, edit and add todos.
Why: it defines the product.
Changed: core, CLI and dashboard became the scope; the nanoc format became the model for the state files.

## 2026-11-18 · affects 1, 3
Steer: the CLI is also supervisor, source of truth and guidance; the agent queries it instead of reading files.
Why: queries and guidance belong in `wf`.
Changed: `status`, `next`, `show`, `find`, `get` and per-state guidance at session start.

## 2026-11-18 · affects 0, 2
Steer: `wf` doesn't handle git; merges and pushes are prompting work; githooks for format and tests stay.
Why: removes git from the tool.
Changed: the only git-related part of `wf` is writing the hooks.

## 2026-11-18 · affects 2
Steer: an owner-only admin mode with no restrictions; the model can never enter or leave it.
Why: a new mode for the owner.
Changed: added 2.3 and spec section 6.

## 2026-11-18 · affects 3
Steer: learnings and serious mistakes are recorded via the CLI or the dashboard, short, and always in context.
Why: a new always-in-context record.
Changed: `learnings.md`, its size budget and session-start injection.

## 2026-11-18 · affects 0, 2
Steer: no commit or push in setup until the owner says "setup done"; one `work` and one `main` branch; `main` gets minor and major commits, micro commits stay on `work`.
Why: defines setup and branches.
Changed: spec section 2; todo 0.5 and 2.2.

## 2026-11-18 · affects 3
Steer: high-risk actions run only on the owner's prompt and are logged first with why, risk, surface and recovery; a log missing any of them is rejected.
Why: high-risk actions need a record.
Changed: `wf risk`, `risks.md` and todo 3.3.

## 2026-11-18 · affects 0
Steer: a fresh public repo for claude-setup only, with no-PII rules.
Why: sets visibility and adds a rule.
Changed: 0.1 public; added 0.6 (no-PII and no-secrets check).

## 2026-11-18 · affects 0.6
Steer: use the installed gitleaks.
Why: chooses the scanner.
Changed: 0.6 uses gitleaks for secrets and PII, with PII rules built at runtime.

## 2026-11-18 · affects 0.4, 0.6
Steer: allow the LICENSE copyright line; the checks are pnpm format, lint, check and build, plus any tests added.
Why: sets the checks and one PII exception.
Changed: hook order fixed; `.gitleaksignore` allows that line only.

## 2026-11-18 · affects 0.6
Steer: drop the extra PII pattern list; gitleaks is enough.
Why: removes a mechanism.
Changed: `local/pii.txt` gone; gitleaks defaults plus the git config name and email.

## 2026-11-18 · affects all
Steer: todo and handoff are updated before the commit and push, and this goes in the guidelines.
Why: fixes the order of every commit.
Changed: commit order in the spec and the guidance; global learning 7.

## 2026-11-18 · affects 3.6
Steer: optional pre-push hooks, for a deploy for example.
Why: a new optional hook.
Changed: `.githooks/pre-push`, `wf push set`, setup asks for push commands; added 3.6.

## 2026-11-18 · affects 3.6
Steer: pre-push runs only for majors, and stays optional.
Why: narrows when pre-push runs.
Changed: majors detected by a bare-integer subject; the commit subject format is a contract.

## 2026-11-18 · affects 0, all
Steer: amend and force-push are allowed only for the first `init` (here and downstream); `main` starts at `init`.
Why: sets how setup ends and limits history rewrites.
Changed: spec section 2 setup.

## 2026-11-18 · affects all
Steer: never mark done before verifying; order is verify, pre-commit checks, mark done, commit.
Why: fixes the order of done and commit.
Changed: the five-step order in the spec and guidance; global learning 8.

## 2026-11-18 · affects 1.6, all
Steer: type-check, lint and format `wf/`; TypeScript over JavaScript, type-safe languages unless the owner allows otherwise.
Why: adds checks and a language rule.
Changed: added 1.6; intent principle 13; guidance line.

## 2026-11-18 · affects all
Steer: move to the next task without stopping; a missing tool means asking for it, never a workaround; sessions are long-running by default.
Why: sets how sessions run and how friction is handled.
Changed: intent principles 14 and 15; guidance lines.

## 2026-11-18 · affects 1.5, 4, all
Steer: UI work always has Playwright tests and screenshots at desktop and mobile sizes, committed in `scratch/images/`; Chrome is installed.
Why: a proof rule for UI, and the browser blocker cleared.
Changed: intent principle 16; guidance line; `scratch/images/` in the spec; 1.5 e2e tests.

## 2026-11-18 · affects 1.8, 1.9, 3.4
Steer: the CLI needs `--help` and docs, and bulk writes for todos and the implementation plan.
Why: help was unplanned and bulk planning came too late for discuss.
Changed: added 1.8 and 1.9; edit, batch and doc left 3.4.

## 2026-11-18 · affects 1.4, 2.4, 3.5, 3.7, 4.4, 5.4
Steer: unimplemented parts seemed to be missing from the plan.
Why: work had fallen out of the plan, and some spec features never had an item.
Changed: added 2.4, 3.7, 4.4 and 5.4; widened 3.5.

## 2026-11-18 · affects 1.10
Steer: the todo preview stopped partway; escape properly.
Why: a bare tag in state text broke markdown rendering.
Changed: added 1.10; `<` escaped outside code; `wf doc` rejects bare tags.

## 2026-11-18 · affects 1.11, 3.4, 4.1
Steer: ordering and insertion by id are the CLI's job.
Why: the rule belongs in the tool.
Changed: added 1.11; `wf move` removed.

## 2026-11-18 · affects 1.12, 1.13, 2.1, 5.1, 5.4
Steer: guidance and instructions must be in place from a project's first `wf init`, as the next part of major 1.
Why: the demo session had no instructions and guessed.
Changed: added 1.12 and 1.13; narrowed 2.1, 5.1 and 5.4.

## 2026-11-18 · affects all
Steer: never stop to wait for the owner while todo items remain; make this an important guideline.
Why: waiting idle wastes the owner's time.
Changed: the one-major rule became guidance; `wf next` skips minors in progress; CLAUDE.md, states.md and `wf help` say never wait idle; global learning 11.

## 2026-11-18 · affects all
Steer: records are summaries, never the owner's text verbatim; the repo is public.
Why: verbatim messages don't belong in a public repo.
Changed: steers rewritten as summaries; CLAUDE.md, the spec and `wf help` say summarise.

## 2026-11-18 · affects 0, all
Steer: pnpm instead of bun for everything.
Why: changes the stack.
Changed: pnpm throughout; npm and npx are aliased to pnpm.

## 2026-11-18 · affects 1.4
Assumption: machine setup is `wf install` in TypeScript, which refuses to run inside Claude Code.
Why: TS over shell is the owner's rule, and the refusal keeps the agent from writing outside the project.

## 2026-11-18 · affects 1.3
Assumption: the edit hook denies only the state files `wf` can write; each file joins when its command exists.
Why: a denial must name an alternative.

## 2026-11-18 · affects 4.3, 5.2
Steer: UI work loads the UI skill first and uses shadcn; the dashboard needs a beautiful dark theme; anything the owner calls a guideline goes into the global guidelines, not only a learning
Why: the dashboard looked like a cheap internal tool because no UI skill guided it, and earlier guidelines landed only in learnings
Changed: 4.3 reshaped around impeccable, shadcn-svelte and a dark theme; global/CLAUDE.md gains the UI-skill, shadcn and guideline-placement rules

## 2026-11-18 · affects all
Steer: Type-safe means fully typed code under a strict checker, not a language list; fully typed Python is allowed
Why: downstream projects read the rule as banning Python
Changed: global/CLAUDE.md Code rule on type safety reworded

## 2026-11-18 · affects all
Steer: Python packages come from pacman, never uv or pip installs; ask the owner for missing ones; a uv venv with system site packages only for packages pacman lacks or gets wrong, overriding just those; never reinstall big system packages like pytorch
Why: downstream projects ignored the Python rules and installed packages with uv
Changed: global/CLAUDE.md Code rules on Python rewritten

## 2026-11-19 · affects 4.4
Steer: Learnings can be edited and removed, not only added: core, wf learn --edit/--remove and the dashboard; removal renumbers the rest
Why: agents are told to merge or prune over budget but had no way to; the dashboard needs full learnings editing
Changed: spec 3.3 and section 4, implementation dashboard section, 4.4 proof

## 2026-11-19 · affects 4.6
Steer: The dashboard edits every section of steers, risks, memory and the plan docs, each checked by its file's rules before writing
Why: the owner wants full control of the state records from the dashboard, logs included
Changed: 4.6 scope covers steers and risks too

## 2026-11-19 · affects 5, 5.1, 5.2
Steer: Adopt ponytail and karpathy as adapted copies imported by global/CLAUDE.md, and only mattpocock's tdd, diagnosing-bugs and codebase-design; CLAUDE.md stays complete rather than near 80 lines
Why: the owner chose the coding skills that don't duplicate wf, and completeness for downstream projects over a line count
Changed: major 5 deliverable, 5.2 title, implementation Skills section

## 2026-11-19 · affects 5.2, 5.4
Steer: The adapted ponytail and karpathy rules load through ~/.claude/rules/ links made by wf install, not @imports
Why: an @import inside the symlinked ~/.claude/CLAUDE.md may not resolve, and an absolute path would expose a home path in a public repo
Changed: implementation layout and Skills, spec locations, 5.4 title

## 2026-11-19 · affects 5.5
Steer: impeccable is installed code-led only: no launcher, detector, decision page, catalog rolls or comp pipeline; a new look is three proposed directions the owner picks from
Why: those parts need impeccable's binary and its paid catalog service
Changed: 5.5 title

## 2026-11-19 · affects 5.5
Assumption: impeccable's direction contract goes into the project's implementation.md as a 'How \<surface> looks' section via wf doc, and its finish reviewer, documenter and motion reviewer run as fresh general-purpose subagents briefed from prompt files in the skill, with nothing installed into ~/.claude/agents
Why: without the launcher its surface-brief files and shipped agents have no home; this reuses wf's records and the Agent tool, and is easy to change
Changed: 5.5 adaptation plan

## 2026-11-22 · affects 5.6
Steer: Review the cuda-kernels project's transcript, state and learnings, and tune the setup from what worked, what failed and what the owner kept repeating; read only what is needed
Why: a large real project is the best evidence of where the guidance and wf fall short
Changed: added 5.6

## 2026-11-22 · affects 5.6
Steer: The setup has become a bottleneck and its context keeps growing; cut it down significantly, since context is expensive
Why: standing rules, per-item ceremony and ever-growing state files cost every session more than they return
Changed: added major 7 (7.1 CLAUDE.md cut, 7.2 injected context cut, 7.3 wf command cut); 5.6's additions are cut back in 7.1

## 2026-11-23 · affects 7
Assumption: Owner said to do whatever; major 7 replanned to fit a 100k-token model (brief re-injected after compaction, bounded reads, slim impeccable, rule files removed)
Why: the owner is tired and away; each change is in git and reversible
Changed: 7 deliverable, 7.2 and 7.3 rewritten; 7.4 and 7.5 added

## 2026-11-23 · affects 7.5
Steer: Keep ponytail and karpathy as always-loaded rules; they carry the coding ethics
Why: the owner relies on them for how code is written, so their context cost is worth paying
Changed: 7.5 now keeps both files instead of removing them; major 7's deliverable counts them in the always-loaded budget

## 2026-11-23 · affects 3.1
Steer: No size limit may block work: show warnings instead of refusals, and never let one project's state restrict another
Why: the cross-project budget refusal blocked a fresh project and pushed its agent into editing another project's learnings
Changed: 3.1 now warns instead of refusing; the budget refusals in learn and handoff are removed
