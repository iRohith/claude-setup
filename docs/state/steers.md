# Steers

## 2026-11-18 · affects 1, 3
> all I am asking is to give tools so that instead of editing those files directly, we go through a deterministic layer to store the state while having read only access to everything related to state. and for my personal use a dashboard where I can look at todo items and edit as I want, add new etc.

Why it's a steer: it defines the product.
Changed: the core, the CLI and the dashboard became the whole scope; the nanoc format became the model for the state files.

## 2026-11-18 · affects 1, 3
> it acts like a supervisor. and also source of truth/guidance/state provider. Like instead of reading file, the ai calls a tool for querying anything.

Why it's a steer: queries and guidance moved into `wf`.
Changed: added `status`, `next`, `show`, `find`, `get`, and per-state guidance at SessionStart.

## 2026-11-18 · affects 0, 2
> we dont handle git related stuff. Not even merge into main and all. that becomes prompting job. but githooks for formatting, testing exists.

Why it's a steer: removes git from the tool.
Changed: the only git-related thing left in `wf` is `wf checks`.

## 2026-11-18 · affects 2
> an admin mode where there are no restrictions at all ... entering admin mode can only be done by me. The model should not even be capable of entering or exiting it

Why it's a steer: a new owner-only mode.
Changed: added minor 2.3 and spec section 6.

## 2026-11-18 · affects 3
> learnings, severely messed up things must be noted via my cli. I can add those from dashboard too ... it should not be too verbose. and it must always be in context no matter what

Why it's a steer: a new always-in-context record.
Changed: added `learnings.md`, the size budget, and SessionStart injection, including after compaction.

## 2026-11-18 · affects 0, 2
> only permission it dont have is commit and push till I mention verbatim "setup done" ... just a single work branch and a single main branch. main branch include major and minor version commits. micro only in work.

Why it's a steer: defines setup and branches.
Changed: spec section 2 setup; todo 0.5; 2.2.

## 2026-11-18 · affects 3
> make it prompt only, but using cli noting high risk actions, justify what happens, how to recover ... if even one of these is missing, reject it

Why it's a steer: high-risk actions get logged.
Changed: added `wf risk`, `risks.md`, and todo 3.3.

## 2026-11-18 · affects 0
> there is no repo at all. this is an uninitialized folder, no git yet. you need a fresh public repo (public only for this), add no PPI rules too

Why it's a steer: changes the repo's visibility, and adds a rule.
Changed: 0.1 is now a public repo; added 0.6 (the no-PII and no-secrets check), placed before 0.5; added `local/pii.txt` to the spec.

## 2026-11-18 · affects 0.6
> we have gitleaks installed. use that like before

Why it's a steer: chooses the scanner.
Changed: 0.6 uses gitleaks for both secrets and PII, with PII rules generated at runtime from git config
and `local/pii.txt`.

## 2026-11-18 · affects 0.4, 0.6
> allow in license ... for svelte - pnpm format, lint, check, build. if you are doing any other tests, add that commands too

Why it's a steer: sets the checks, and an exception to the PII rule.
Changed: 0.4 hook order fixed; `.gitleaksignore` allows the LICENSE copyright line only; future test commands get added to the hook.

## 2026-11-18 · affects 0.6
> remove that. gitleaks is enough

Why it's a steer: removes a mechanism.
Changed: the `local/pii.txt` list is gone; the hook uses gitleaks defaults plus the git config name and email.

## 2026-11-18 · affects all
> an issue with commit pipeline. the handover/todo etc etc should be before the commit and push. add in guidelines too.

Why it's a steer: fixes the order of every commit.
Changed: spec section 2 now has the commit order; the guidance list in implementation.md has it too; global learning 7 added.

## 2026-11-18 · affects 3.6
> add pre push optional hooks. for example I might want to deploy

Why it's a steer: a new optional hook.
Changed: spec adds `.githooks/pre-push` and `wf push set`; setup asks for pre-push commands; added todo 3.6 (with `wf checks set`, which had no item yet).

## 2026-11-18 · affects 3.6
> those hooks I only want on major. still optional

Why it's a steer: narrows when pre-push runs.
Changed: pre-push runs only when a pushed commit is a major; the commit subject format `<id> <keywords>` is now a contract.

## 2026-11-18 · affects 0, all
> ammend and force push first. after that do main and init. same goes for downstream projects. this first init commit is the only place ammend and force push is allowed. rest is not unless I explicitly tell to

Why it's a steer: sets how setup ends, and limits history rewrites.
Changed: spec section 2 setup now ends with `main` at `init`, and limits amend and force-push to the first `init`; major 0 is done.

## 2026-11-18 · affects all
> when in todos, marking as done before commit without verification is not allowed too just because we are committing. so verify, then pre commit hooks, then mark complete and then commit

Why it's a steer: fixes the order of done and commit.
Changed: spec section 2 now has the five-step commit order; the guidance list matches; global learning 8; major 0 is open again until `main` is verified.

## 2026-11-18 · affects 1.6, all
> add those. type it. not js, always ts. add this as a guideline too. Always use type safe languages unless I give permission. TS over JS always when possible.

Why it's a steer: adds checks for `wf/`, and a language rule for every project.
Changed: added 1.6 (placed before 1.2); intent principle 13; guidance line in implementation.md.

## 2026-11-18 · affects all
> continue implementing, going to next task. And also I talked about friction too. For example if there is a tool missing, inform and get the tool instead of doing workarounds etc. no stopping until there are blockers. should be long running sessions by default

Why it's a steer: sets how sessions run, and how friction is handled.
Changed: intent principles 14 and 15; two guidance lines in implementation.md.

## 2026-11-18 · affects all
> I just told you I was going away and you still fucking stopped in middle? cant we just edit claude.md later? will it fucking end the world if you started other todo tasks instead of stopping and wasting my time? add this as an important guideline.

Why it's a steer: waiting on the owner must never stop the work.
Changed: the one-major rule moved from `wf start` into guidance; `wf next` skips minors in progress; CLAUDE.md, states.md and `wf help` say never wait idle; global learning 11.

## 2026-11-18 · affects 1.12, 1.13, 2.1, 5.1, 5.4
> the first wf init/setup whatever that runs first that guidance, instructions everything need to some in place. ... if its just next part, then its fine. implement everything first.

Why it's a steer: guidance must exist from a project's first moment; the demo session retried a denied edit and chained commands because it had none.
Changed: added 1.12 (global CLAUDE.md, linked by install) and 1.13 (per-state instructions at session start, `wf init` prints setup's, final denials) to major 1; narrowed 2.1, 5.1 and 5.4.

## 2026-11-18 · affects 1.11, 3.4, 4.1
> thats cli job to handle sort/insertion location logic by id and all right

Why it's a steer: the ordering rule belongs in the CLI.
Changed: added 1.11; the core keeps todo.md in id order; `wf move` is gone from 3.4, the spec and 4.1's reordering.

## 2026-11-18 · affects 1.10
> It stopped here. core editItem (proofs on minors, deliverables on majors) and writeDoc (whole document from "# ... escape properly

Why it's a steer: a bare tag in state text broke the markdown preview from that line on.
Changed: added 1.10; `<` outside code is escaped on write and unescaped on read; `wf doc` rejects bare tags.

## 2026-11-18 · affects 1.4, 2.4, 3.5, 3.7, 4.4, 5.4
> not just that. seems like you deleted the unimplemented parts. what about it

Why it's a steer: the plan had lost work. 1.4's links pointed at items that didn't hold them, and several spec features never had an item.
Changed: added 2.4 (links and `claude -p` denials), 3.7 (deferred registry), 4.4 (learnings editing in the dashboard), 5.4 (install links); widened 3.5 to direct `.env` writes; 1.4 now points at 5.4.

## 2026-11-18 · affects 1.8, 1.9, 3.4
> the cli needs --help and more docs if the ai wants to query how to run. and also what about the batch creating todos, implementation plan, batch/bulk write initial todo etc via cli? are those planned yet?

Why it's a steer: help was missing from the plan, and bulk planning was planned too late (3.4, after states), although discuss needs it first.
Changed: added 1.8 (help) and 1.9 (batch, edit, doc) to major 1; 3.4 loses `wf edit`, `wf batch` and doc sections once `wf edit` exists.

## 2026-11-18 · affects 1.5, 4, all
> another guideline. for UI related stuff, playwright tests, screenshots (committed in scratch/images) at different resolutions like desktop, mobile etc are mandatory. via prompts. I installed chrome here - /usr/bin/google-chrome-stable

Why it's a steer: a proof rule for every UI item, and the browser blocker is cleared.
Changed: intent principle 16; guidance line; `scratch/images/` added to spec locations; 1.5 gets Playwright e2e tests that write desktop and mobile screenshots.

## 2026-11-18 · affects 1.4
assumption: machine setup is `wf install` in TypeScript (`wf/install.ts`), not `install.sh`. It refuses to run when `CLAUDECODE` is set, so only the owner runs it, from a terminal.
Why: the owner's rule is type-safe languages and TS over JS wherever possible, and install needs JSON merging that TS does safely. The refusal also keeps the agent from writing outside the project.
Changed: implementation.md now describes `wf install`; the 1.4 title still says install.sh until `wf edit` lands in 3.4; reversible by swapping in a shell script.

## 2026-11-18 · affects 1.3
assumption: the PreToolUse deny covers only the state files `wf` can write so far (`todo.md`, `handoff.md`). Each file joins `WF_OWNED_FILES` when its `wf` command lands in 3.x.
Why: a denial must name the alternative, and steers, learnings, memory and docs have no `wf` command yet. Denying them now would block work with nothing to use instead.
Changed: 1.3 denies two files instead of all of `docs/state/**`; reversible by extending one list in `wf/core.ts`.

## 2026-11-18 · affects 0, all
> now move to pnpm instead of bun for everything.

Why it's a steer: changes the stack.
Changed: pnpm throughout; npm and npx are aliased to pnpm and no longer forbidden.
