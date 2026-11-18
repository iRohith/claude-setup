<!-- Changed for claude-setup from impeccable (Apache-2.0); see global/THIRD-PARTY.md. -->
# Command guidance

## Workflow questions

Give advice without executing commands; the menu below is only for bare invocations. Consult relevant command references as needed for prerequisites and scope. If the user also requests execution, follow that request.

## No-argument routing: the context-aware menu

Read this when the user invokes `/impeccable` with no argument. They are asking "what should I do?" Make the menu context-aware instead of static.

If the project has no PRODUCT.md, it has no captured context yet: lead the menu with `/impeccable init` as the top recommendation (one line on why) and still show the rest below; don't silently jump into init. Otherwise look at what the project holds, then lead with the **2-3 highest-value next commands**, each with a one-line reason, followed by the full menu (the Commands table in SKILL.md, grouped by category). **Never auto-run a command; the recommendation is a suggestion the user confirms.**

Reason over what you find; there is no score to obey:

- No DESIGN.md while UI code exists → `document` (capture the visual system).
- No snapshot in `.impeccable/critique/` → the project has never been critiqued; for a set-up project with a real surface, offering `/impeccable critique <surface>` is a strong default.
- The newest open snapshot there (`closed: false`) has a low `total_score` or non-zero `p0_count` / `p1_count` → `polish` (it reads that snapshot as its backlog and closes it when cleared).
- `git status` pointing at one surface → scope `audit` or `polish` to those files specifically, naming them.
- Otherwise group by intent (build new / improve what's there), tailored to the current surface and the platform PRODUCT.md records.

Keep it to 2-3 pointed picks with the exact command to type. The menu stays the fallback; the recommendation is the lede.
