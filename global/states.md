# Instructions per state

## setup

The project is in setup: a deployable bare app and its checks, before the idea is discussed.
1. `wf init` if `docs/state/` is missing. Ask the owner for the stack, the checks and any push commands.
2. `git init -b work`; `gh repo create <folder> --private --source . --remote origin`. Scaffold with the
   stack's own tool until the bare app runs and deploys.
3. `.gitignore`: `.env`, `.env.local`, `scratch/temp/`, `scratch/refs/`, `scratch/links/`,
   `scratch/thirdparty/`, build output. `wf checks set` (and `wf push set` if named); prove the hook
   rejects a failing commit.
4. One `init` commit, amended as setup goes. Push only after the owner writes "setup done", then create
   `main` at `init`.

## discuss

The project is in discuss: planning only; nothing outside `docs/state/` changes.
1. Read the references in `scratch/refs/` (their core files, not just READMEs) and summarise the intent
   back in three lines for the owner to confirm. Ask what matters most, with your own suggested answers.
2. Write the plan docs with `wf doc`, then the todo with `wf batch`. Stay until the owner says to leave.

## build

The project is in build: implement the todo. Take items by the owner's priority, then `wf next`; work
each as CLAUDE.md says. When every minor of a major is done and verified, `wf done <major>`. Stop only
when every remaining item waits on the owner, and say what each needs.
