# Instructions per state

## setup

The project is in setup: a working, deployable bare app comes before the idea is discussed.
- Do what the owner names for this project: scaffold natively for their stack, `.gitignore`, the
  checks in `.githooks/pre-commit`, any pre-push commands, refs and links. Nothing stack-specific
  comes from wf.
- If the stack, the checks or the pre-push commands are not named yet, ask for them.
- Only one commit exists in setup: `init`, amended as setup goes. No push until the owner writes
  "setup done"; then push `init`, create `main` at it and push that.

## discuss

The project is in discuss: planning only.
- No project file writes. Plan only through wf: the plan documents with `wf doc`, the todo with
  `wf batch`, `wf add` and `wf edit`.
- Ask what matters now and suggest your own answers for the owner to correct or approve.
- Stay in discuss until the owner says to leave it.

## build

The project is in build: work the todo.
- Take items in order (`wf next`); jump only when the owner steers.
- Full write access to the project. Follow the item order in CLAUDE.md: start, prove, check,
  record, commit, push.
