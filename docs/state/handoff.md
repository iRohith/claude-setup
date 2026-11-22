# Handoff
State: build
Active: 1.12, 1.13, 2.2, 2.3, 2.4, 3.1, 3.5, 4.3, 5.5, 7.2
Next: 7.2 (measure every project under the 4,000 budget), then 7.3 bounded reads, 7.4 slim impeccable, 7.5 remove the rule files; everything else waits on the owner
Verify: pnpm --dir wf test; sessionContext per registered project under 4,000
Don't: hand-edit docs/state; put the owner's words in records; install Python packages with uv or pip; stage part of a file; amend or force-push
Open: owner: rerun wf install, then one fresh session checking each active item's proof (1.12 to 3.5, and /impeccable for 5.5)
Open: owner: read the cut global/CLAUDE.md (5.1) and review the dashboard (4.3)
Open: owner: pick a fresh project for 6.1; history rewrite for old steers, yes or no; may scratch/images/1.5-*.png and ui/tabs, ui/switch be deleted?
