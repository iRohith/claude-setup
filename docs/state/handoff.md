# Handoff
State: build
Active: —
Next: 1.2, the CLI (`init`, `status`, `next`, `show`, `add`, `start`, `done`, `impl`, `handoff`) with the single-writer lock.
Verify: a commit runs gitleaks, then format, lint, check and build for `dashboard/`, and lint, check and test for `wf/`.
Don't: amend or force-push unless the owner says so; mark done before verifying; write JS where TS works; write PII into any file.
Open: —
