# Handoff
State: build
Active: —
Next: 1.3, the hooks: SessionStart prints learnings, the handoff and state guidance; PreToolUse denies Edit/Write on docs/state/** and names wf instead
Verify: pnpm --dir wf test passes 19 tests; node wf/cli.ts status works in this repo
Don't: amend or force-push unless the owner says so; mark done before verifying; hand-edit todo.md or handoff.md now that wf covers them; write PII into any file
Open: —
