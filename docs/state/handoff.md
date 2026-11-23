# Handoff
State: build
Active: 1.12, 1.13, 2.2, 2.3, 2.4, 3.1, 3.5, 4.3, 4.8, 5.5
Next: 4.8 waits on the owner's first save at http://wf.localhost/settings (agents are denied the settings by design); everything else waits on the owner
Verify: pnpm --dir wf test (76); pnpm --dir dashboard test (38); the dashboard at http://wf.localhost (restart wf-dashboard after a rebuild)
Don't: hand-edit docs/state; put the owner's words in records; install Python packages with uv or pip; stage part of a file; amend or force-push; remove ponytail or karpathy; let one project touch another; touch the owner's settings; commit micro steps or small edits on their own
Open: owner: save the settings once at http://wf.localhost/settings (change and restore any value) to close 4.8
Open: owner: the nanoc session rewrote cuda-kernels' learnings (17 to 6 lines, uncommitted there); restore with git -C ~/Projects/cuda-kernels checkout -- docs/state/learnings.md if you want them back
Open: owner: rerun wf install, then one fresh session checking each active item's proof (1.12 to 3.5, and /impeccable on a small UI task for 5.5 and the slimmed 7.4)
Open: owner: read the cut global/CLAUDE.md (5.1) and review the dashboard at http://wf.localhost (4.3)
Open: owner: pick a fresh project for 6.1; history rewrite for old steers, yes or no; may the fixture screenshots scratch/images/1.5-*.png be deleted?
