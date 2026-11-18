# Intent

## The one-sentence version

An agent the owner can hand a project to, that works the way the owner works. It:
- plans before it builds;
- keeps an honest, readable record;
- proves its work the way a human would;
- never quietly drifts or cuts corners.

The setup that makes it behave this way is itself simple, small and obvious.

## The pain

- The owner runs several real projects at once, some depending on others: an engine and its games, a
  format and its assets. Sessions hit usage limits, switch machines, get compacted, or run while the owner
  is away.
- Left to prose instructions, the agent drifts. It codes on a steer without updating the plan, skips
  checkboxes, works around blocks, games tests, claims work after the fact, pads output and commits noise.
- An older hand-edited format (`nanoc.0/agent-mirror`, `NanoGraph-new/docs`) worked decently, but drifted
  because the agent edited it freely. Three later attempts to fix this were overengineered and deleted.

## Who uses it, and how

- **The owner:**
  - talks to the agent through Claude Code prompts;
  - reads and edits state in the dashboard;
  - names stacks and checks during setup;
  - decides when discussion ends;
  - flips admin mode.
- **The agent:**
  - reads state freely, preferring `wf` queries;
  - changes state only through `wf`;
  - follows the guidance for the current state.

## What a beginner and an expert would say

- Beginner: "I can see exactly what it's doing and what's next, and I can change it in a page."
- Expert: "It's a few hundred lines. Plain markdown in git, one CLI, a handful of hooks. Nothing clever."

## Where it shines

- **Resuming.** Any session on any machine reads the handoff and continues.
- **Steering.** A steer changes the plan first, and the reason is on record.
- **Keeping lessons.** Lessons paid for once stay in context forever.

## The owner's working principles (for code the agent writes, and for this setup)

1. Security and performance first, then simplicity.
2. No overengineering: no layers, options, fallbacks or "for later" code. Abstractions only at real seams.
3. A change means replacement: the old way goes completely. First implementations still get clean schemas.
4. Reuse: search before writing. Reinvent only for a real unmet need, and say why.
5. Few files, simple structure, proper separation of concerns.
6. Dead code goes at every micro commit. Only code that is actively used now stays.
7. Warnings are errors. If one can't be fixed, ask.
8. No deferred work: no TODOs or stubs. New work becomes a todo item now.
9. Nothing hardcoded: configurable values live in env.
10. Everything stays reviewable by the owner.
11. Latest stable versions when adding packages. Never upgrade existing ones without permission, but report
    outdated ones.
12. No secrets and no PII anywhere in git history: not the owner's names, usernames or email. Identity comes
    from git config at runtime. claude-setup is public; every project repo is private.
13. pnpm is the default for everything (npm and npx are aliased to pnpm). System Python with uv.

## Lessons from three failed attempts

- Small and obvious beats clever and complete. If the owner can't read it quickly, it is too big.
- Every mechanism traces to something the owner asked for. Propose and ask; never pick mechanisms on the
  owner's behalf.
- Few, defined states.
- Guidance first, enforcement last. A rule that keeps firing is a guidance failure.
- No friction for its own sake.
- Honesty: report what was and wasn't tested, admit mistakes plainly, and don't defend choices by quoting
  the owner's goals back at them.
