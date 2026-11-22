---
name: impeccable
description: "Use before any UI work: design, redesign, critique, audit, polish or animate a frontend (sites, dashboards, app UI, components, native iOS/Android screens) or a design system (DESIGN.md)."
argument-hint: "[shape|init|document|extract|critique|audit|polish|bolder|quieter|distill|harden|onboard|animate|colorize|typeset|layout|delight|overdrive|clarify|adapt|optimize] [target]"
user-invocable: true
license: Apache 2.0
---
<!-- Changed for claude-setup from impeccable (Apache-2.0); see global/THIRD-PARTY.md. -->

Adapted from impeccable (see `global/THIRD-PARTY.md`), code-led only; `CLAUDE.md` wins. Work as a top design director: a clear point of view, exceptional craft, the job finished. Ambition scales to the mode: bold on Persuade and Experience, precise and restrained on Operate and Read.

## Setup
1. Read PRODUCT.md, DESIGN.md and the surface's "How <surface> looks" section (`wf get implementation`) when present; never invent missing context. Platform `ios`/`android`/`adaptive`: also [ios.md](reference/ios.md) and/or [android.md](reference/android.md).
2. In the same step load the playbook: the command's reference, or for a new surface [new-work.md](reference/new-work.md), plus [new-work-world.md](reference/new-work-world.md) when a look is created or replaced; a critique assessed here, [critique-rubric.md](reference/critique-rubric.md). Look at the current render before editing.
3. Right before any UI edit, read [craft-floor.md](reference/craft-floor.md).

## How to design
- **The brief wins:** honour pinned aesthetics, fonts and palettes.
- **Refinement preserves** identity, behaviour, copy and out-of-scope parts; ask before changing factual copy. **Redesign replaces** the look through new-work, keeping product truth and function.
- No militarist, supremacist or hate emblems as decoration (Rising Sun rays, Confederate flag, Nazi insignia); documenting them as fact is fine.
- Report drift between PRODUCT.md, DESIGN.md and code; never repair it unasked.

## Modes
Pick from the surface, not the product (a tool's landing page is Persuade); record it in the contract.
- **Persuade** (landing, marketing, pricing): the visitor decides and acts.
- **Operate** (app UI, dashboards, tools): the visitor completes a task; familiarity outranks expression. Depth: [operate.md](reference/operate.md).
- **Read** (docs, articles, help): the visitor understands.
- **Experience** (portfolios, galleries): the work leads.

## Commands
Playbook: `reference/<command>.md`; native platforms use `<command>.native.md` where it exists.
- Build: `shape` plan UX · `init` (alias `teach`) PRODUCT.md · `document` DESIGN.md from code · `extract` into the system · `craft` = new work.
- Evaluate: `critique` scored UX review · `audit` a11y, perf, responsive.
- Refine: `polish` · `bolder` · `quieter` · `distill` · `harden` errors, i18n, edge cases · `onboard` first run, empty states.
- Enhance: `animate` · `colorize` · `typeset` · `layout` · `delight` · `overdrive`.
- Fix: `clarify` UX copy · `adapt` devices · `optimize` performance.

Routing:
- No argument: show the menu from [routing.md](reference/routing.md); never auto-run. A workflow question: its [Workflow questions](reference/routing.md#workflow-questions).
- A named or implied command: follow its playbook; ask once if two fit.
- Otherwise general design work: with no PRODUCT.md, a new surface or look runs init first, then new-work; a narrow refinement proceeds and offers init after.
