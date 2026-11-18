# Karpathy guidelines

Behavioral guidelines to reduce common LLM coding mistakes. Adapted from andrej-karpathy-skills (MIT, see
`global/THIRD-PARTY.md`). Where they and `~/.claude/CLAUDE.md` differ, `CLAUDE.md` wins.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, name what's confusing and ask. Don't sit idle on the answer: put the question
  in the handoff with `--open` and carry on with work that doesn't depend on it. When the owner is away,
  take the most reversible choice and record it with `wf assume`.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.

Dead code goes at every micro commit, whoever wrote it: remove the imports, variables and functions your
change made unused, and any other code nothing uses. Only code that is used now stays.

The test: every changed line traces to the request, or to removing dead code.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.** The item's proof in the todo is the success criterion.

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
