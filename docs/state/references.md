# References

## nanoc.0 `agent-mirror/` (owner's, `scratch/refs` on request)

**Teaches:**
- A plan file with a phase status table (phase | commit | status | tests).
- A deferred registry (file | item | resolves in).
- Numbered locked invariants.
- An ordered slice ledger: "LANDED date, commit, N/N tests".
- `state.md` as working memory, with fixed sections: invariants, contracts, gotchas, pitfalls (dated,
  with cause), in-progress, test strategy, anti-patterns.
- A **fresh-session handoff** block: HEAD, the verify command with the expected count, the next slice, and
  what not to do.
- Memory files with one rule each, plus Why and How to apply.

**Went wrong:**
- The agent hand-edited everything, so it drifted. The status table and the handoff disagreed, and some
  phases had no commit.
- The architecture was copied in three places.
- "In-progress" grew into a 100KB log.
- Mirroring was a manual `cp`.

## NanoGraph-new `docs/` (owner's)

**Teaches:**
- A README with a reading order.
- Numbered lessons, cited by number ("lesson 33").
- `docs/state/` registers with items like A1 and B5, each with a checkbox, the commit, file:line, the
  anti-pattern, the fix direction and the test. New findings are appended as N1, N2.

**Went wrong:** the same hand-editing drift. It had no single place to answer "what's next".

## Backlog.md (third-party, read only, MIT)

**Teaches:**
- Markdown tasks with typed frontmatter.
- One core that the CLI, MCP server and web UI all write through.
- Dependency checks: must exist, can't be itself, no cycles.
- Sentinel-delimited sections, so a tool can edit part of a file safely.
- Guidance served as a tool call.

**Went wrong for us:**
- About 70k lines.
- Hand edits aren't prevented.
- Completion rules are prompt text only.
- Fuzzy-only search.
- `onStatusChange` runs shell commands from task frontmatter.

## beads (third-party, read only, MIT)

**Teaches:**
- Typed links where only some types block.
- A clear definition of "ready".
- Append-only notes.
- SessionStart and PreCompact injection.

**Went wrong for us:**
- About 480k lines.
- A Dolt database, so state isn't reviewable in git.
- A background server.
- Usage metrics on by default.
- LLM compaction that rewrites history.

## claude-setup v1–v3 (deleted)

**Went wrong:**
- **v1:** too many folders.
- **v2 and v3:** grew a per-project kit copy, an MCP server, a ledger with dozens of states, conductors,
  tamper checks, migrations, and hidden `claude -p` subprocesses that could bill API credits.

The owner deleted all of it. See `intent.md` "Lessons" and global learnings.
