# Third-party rules and skills

Each file below is adapted from an MIT- or Apache-2.0-licensed upstream. Only their markdown is taken: no hooks, scripts,
binaries, plugin manifests or telemetry. Every adaptation makes the owner's rules in `global/CLAUDE.md` win
where they conflict. To see an exact change, diff the file against the upstream path at the commit named.

## ponytail

- **Upstream:** `github.com/DietrichGebert/ponytail` at `96608e078b2d5ea607c5c3b8b5a54d1c1fba6846`.
- **Taken:** `AGENTS.md` → `global/rules/ponytail.md`.
- **Left out:** the hooks (activation, mode tracker, statusline, band), commands, levels, benchmarks and
  every agent's plugin manifest.
- **Changed:** a header naming the source; a shortcut with a known limit is recorded with `wf defer`
  instead of a `shortcut:` comment; the line addressed to ponytail's own repo is removed.

## karpathy

- **Upstream:** `github.com/multica-ai/andrej-karpathy-skills` (author forrestchang) at
  `2c606141936f1eeef17fa3043a72095b4765b9c2`. MIT, declared in its README and plugin manifest; the repo
  has no LICENSE file.
- **Taken:** `CLAUDE.md` → `global/rules/karpathy.md`.
- **Changed:** a title and header naming the source; "stop and ask" also puts the question in the handoff
  and carries on, with `wf assume` when the owner is away; dead code goes at every micro commit, whoever
  wrote it (upstream keeps pre-existing dead code); the item's proof is the success criterion.

## mattpocock

- **Upstream:** `github.com/mattpocock/skills` at `5863806dd4e15c63174bee4e7515a4256792ecfa`.
- **Taken:** `skills/engineering/tdd/` (`SKILL.md`, `tests.md`, `mocking.md`) → `global/skills/tdd/`;
  `skills/engineering/diagnosing-bugs/SKILL.md` → `global/skills/diagnosing-bugs/`;
  `skills/engineering/codebase-design/` (`SKILL.md`, `DEEPENING.md`, `DESIGN-IT-TWICE.md`) →
  `global/skills/codebase-design/`.
- **Left out:** every other skill (tracker flows, GLOSSARY and ADR skills), `scripts/`, the
  `hitl-loop.template.sh` script and the `agents/openai.yaml` files.
- **Changed:** GLOSSARY.md and ADR reads become `wf get` and `wf find` on `docs/state/`; seams come from the
  item's proof, and an open question goes to the handoff instead of blocking; refactoring happens after
  green, before the micro commit, and tests are never faked or weakened; the human-in-the-loop script
  becomes handoff steps; throwaway harnesses stay in `scratch/temp/` and causes go to `wf memory
  pitfalls`; restructuring needs the owner's permission, and design-it-twice sub-agents run only when the
  owner asks; old tests are removed only after the new ones cover the same behaviour.

## impeccable

- **Upstream:** `github.com/pbakaus/impeccable` at `d41d9860b0094dcb68030657da63461212835aaa`, Apache-2.0.
  Its licence and NOTICE are copied unchanged into `global/skills/impeccable/` (`LICENSE`, `NOTICE.md`);
  every changed file carries a change notice in its first lines.
- **Taken:** `skill/SKILL.src.md` → `global/skills/impeccable/SKILL.md`; 35 of `skill/reference/*.md`;
  `skill/agents/impeccable-{finish-reviewer,documenter,motion-reviewer}.md` →
  `reference/agents/{finish-reviewer,documenter,motion-reviewer}.md`, as briefs for fresh subagents.
- **Left out:** the launcher and engine (`skill/scripts/`), the detector, the live mode and its server,
  the decision page, the catalog rolls (`concept-seed`, which calls impeccable's service), the comp-led
  pipeline (`new-work-comp`, `visualize`, `region-map`, `component-review`), `live`, `live-setup`,
  `generate`, `hooks`, `doctor`, `foundations`, the asset producer and manual-edit agents, and
  `hermes-plugin/`.
- **Changed:**
  - build placeholders filled for Claude Code; the ask instruction adds the handoff fallback;
  - Setup reads PRODUCT.md, DESIGN.md and the direction contract directly; every build is code-led;
  - a new look is the agent's own ranked directions: the lead, one alternate and the category standard,
    put to the owner with AskUserQuestion; a new surface's structures the same way;
  - the direction contract is a "How <surface> looks" section of `docs/state/implementation.md`, written
    with `wf doc`;
  - critique runs one isolated design assessment with screenshots, no detector; critique snapshots and
    audit reports are written as plain files that polish reads and closes;
  - motion is captured with Playwright, and the finish reviewer, documenter and motion reviewer are fresh
    general-purpose subagents briefed from the files above;
  - screenshots go to `scratch/images/<id>-<page>-<size>.png`.

## Licences

### ponytail

```
MIT License

Copyright (c) 2026 DietrichGebert

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### mattpocock/skills

```
MIT License

Copyright (c) 2026 Matt Pocock

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### andrej-karpathy-skills

Declared MIT by its author; no licence text is published in the repo.
