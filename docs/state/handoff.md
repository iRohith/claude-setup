# Handoff
State: build
Active: —
Next: 1.1, the core that parses and writes `todo.md` and `handoff.md`, plus IDs and the start/done rules.
Verify: `git log --oneline origin/work` ends with `0.5.1 main verified`; a commit runs gitleaks, format, lint, check and build.
Don't: amend or force-push unless the owner says so; mark done before verifying; write PII into any file.
Open: this repo has no pre-push commands yet. Is there anything to run when a major is pushed?
