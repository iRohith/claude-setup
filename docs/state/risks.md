# Risks

## 2026-11-18 · 0.5 · medium
Action: `git commit --amend --no-edit` then `git push --force-with-lease origin work`
Why: the pushed `init` lacks its own final state (0.5 checked, handoff, commit-order rule); the owner chose to amend it
Surface: `origin/work`, one commit (`8be469b`), pushed minutes earlier, no other clones or branches
Recover: `git push --force-with-lease origin 8be469b:work` restores the old commit; it stays reachable in the local reflog

## 2026-11-18 · 0.5 · medium
Action: `git commit --amend --no-edit` then `git push --force-with-lease origin work`, then `git branch main` and `git push -u origin main`
Why: the pre-push plan change belongs in `init`; the owner said to amend, force-push, then create `main` from `init`
Surface: `origin/work`, one commit (`e4c6435`), no other clones; `main` is new
Recover: `git push --force-with-lease origin e4c6435:work` restores the old commit; `main` can be removed only with the owner's approval

## 2026-11-23 · 7.5 · low
Action: git rm global/rules/ponytail.md global/rules/karpathy.md
Why: the owner approved cutting the setup (do whatever, after the proposal to drop these files); one CLAUDE.md line carries their essence and they cost about 1,400 tokens in every session
Surface: two committed markdown files and the ~/.claude/rules links wf install made to them (left dangling until the owner removes them)
Recover: git checkout b6efaea -- global/rules, then wf install
