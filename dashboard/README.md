# Dashboard

The owner's view of every wf project: todo, plans, learnings, steers, risks and memory, editable.

- Develop: `pnpm --dir dashboard dev`. Test: `pnpm --dir dashboard test`.
- Runs at boot as the systemd user service `wf-dashboard.service` (this folder) on
  `127.0.0.1:47913`, localhost only; Caddy forwards `http://wf.localhost` to it. The unit's `ORIGIN`
  must match the address in the browser, or every form save is refused as cross-site (403). It
  serves `build/`, which every commit rebuilds; pick up a new build with
  `systemctl --user restart wf-dashboard`.
- Set up once per machine: `pnpm --dir dashboard build`, then
  `systemctl --user enable --now <repo>/dashboard/wf-dashboard.service` and `loginctl enable-linger`
  so it starts at boot without a login. The unit expects the repo at `~/Projects/claude-setup`.
