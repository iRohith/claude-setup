# Handoff
State: build
Active: 1.12, 1.13, 2.2, 2.3, 2.4, 3.1, 3.5, 4.3, 5.5
Next: every remaining item waits on the owner
Verify: pnpm --dir wf test (75); env -C into another project then any writing wf command is refused from a Claude Code session
Don't: hand-edit docs/state; put the owner's words in records; install Python packages with uv or pip; stage part of a file; amend or force-push; remove ponytail or karpathy; add any limit that refuses work or lets one project touch another
Open: owner: the nanoc session rewrote cuda-kernels' learnings (17 to 6 lines, uncommitted there); restore with git -C ~/Projects/cuda-kernels checkout -- docs/state/learnings.md if you want them back
Open: owner: rerun wf install, then one fresh session checking each active item's proof (1.12 to 3.5, and /impeccable on a small UI task for 5.5 and the slimmed 7.4)
Open: owner: read the cut global/CLAUDE.md (5.1) and review the dashboard (4.3)
Open: owner: pick a fresh project for 6.1; history rewrite for old steers, yes or no; may the fixture screenshots scratch/images/1.5-*.png be deleted?
