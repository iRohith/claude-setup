# Handoff
State: build
Active: —
Next: 1.2, the CLI (`init`, `status`, `next`, `show`, `add`, `start`, `done`, `impl`, `handoff`) with the single-writer lock.
Verify: `pnpm --dir wf test` passes 11 tests; a commit runs gitleaks, format, lint, check, build and the wf tests.
Don't: amend or force-push unless the owner says so; mark done before verifying; write PII into any file.
Open: this repo has no pre-push commands yet. Is there anything to run when a major is pushed?
Open: `wf/` isn't type-checked, linted or formatted, only tested. Add `tsc --noEmit` and prettier/eslint for it?
