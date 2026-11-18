# Third-party rules and skills

Each file below is adapted from an MIT-licensed upstream. Only their markdown is taken: no hooks, scripts,
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
