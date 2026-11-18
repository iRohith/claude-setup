# Handoff
State: setup (done; waiting for the owner to switch to build)
Active: —
Next: create `main` at `init`, push it, verify; the first build commit checks major 0; then 1.1.
Verify: `git log --oneline origin/work origin/main` both show only `init`; a commit runs gitleaks, format, lint, check and build.
Don't: amend or force-push from here on unless the owner says so; mark done before verifying; write PII into any file.
Open: this repo has no pre-push commands yet. Is there anything to run when a major is pushed?
