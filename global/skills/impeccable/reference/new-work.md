<!-- Changed for claude-setup from impeccable (Apache-2.0); see global/THIRD-PARTY.md. -->
# New visual work

For a new surface or a replacement look, always code-led. No PRODUCT.md: run [init.md](init.md) first; a missing DESIGN.md does not.

## 1. Decide what is already true
Read DESIGN.md, representative code, tokens, components and assets. **Redesign:** keep product truth, content, function and brand commitments; the old look is evidence, not authority. **Established world** (even without DESIGN.md): inherit it. **Incomplete brand:** keep confirmed traits; expand with the user. **No visual authority:** create a world with the user. A section, component or state inside a surface inherits it; never make it an identity exercise.

## 2. Ask what will change the work
Before building, ask two or three questions with AskUserQuestion (a precise request needs only a confirmation). Persuade: who must act, what they must believe, what real proof earns it. Operate: task, information, key states, frequency, constraints. Read: the reader's question, sources, structure, wayfinding. Experience: what leads, how exploration unfolds. Also: what success looks like, what must not change, what would feel wrong. Never ask for CSS values or offer canned styles; for a new world, name no look before the directions round. Owner away: take the most reversible answer, `wf assume`.

## 3. Choose the amount of invention
- **Extend a surface:** inherit its world and composition; resolve only purpose, content, hierarchy, states and interaction.
- **New surface in an established world:** keep the system; derive five to seven different structures from content and task, ranked. For an open page or flow, offer three with AskUserQuestion (your strongest, the most different, one nobody would guess from the category), each with one line of structure (what leads, reading order, primary action) and one risk. Build the pick; owner away: your strongest, `wf assume`.
- **Create or replace the visual world:** follow [new-work-world.md](new-work-world.md), then step 4.

## 4. Commit the world
- **Colour strategy first:** Restrained (tinted neutrals, one accent, colour still doing real jobs), Committed (one saturated colour on 30–60%), Full palette (3–4 named roles) or Drenched (the surface is the colour). Persuade and Experience may go bold. Colour owns regions, not scattered accents.
- **Light or dark:** one sentence of physical scene (who, where, what light) decides.
- **Type:** faces from the subject's world, in the mode's register; Operate and Read do well with system stacks and workhorse UI faces. On Persuade and Experience these mean you stopped looking: Fraunces, Playfair Display, Cormorant, Lora, Crimson, Newsreader, Syne, Space Grotesk, Space Mono, IBM Plex, Inter as display, DM Sans, DM Serif, Outfit, Plus Jakarta Sans, Instrument Sans. One needs a reason no other face meets; a subject association (books want a serif, tech a mono) never is.
- **Saturated looks:** cream, high-contrast serif, terracotta accent; near-black, one neon, glow; editorial hairlines, italic serif, tracked mono labels; flat ink, black boxes, hard offset shadows, condensed type. Fine when the brief asks. On a free look, landing in one, or being guessable from the category (or its avoidance), means rework.
- **Your prior:** warm, bookish or child subjects come out cream, italic serif, lamplight. If OWN-WORLD says cream, paper, ivory or lamplight on an unpinned Persuade surface, rework from the world's saturated materials. A pinned world pins the world, not its softest rendition. "No hype" rules out devices, not energy.

## 5. Record the decision
Before code, draft in `scratch/temp/` and write `wf doc implementation --section "How <surface> looks" --from <file>` (read any existing section with `wf get` first; re-read after). About 150 words: THESIS (the one idea, and the category default it refuses); OWN-WORLD (palette and component language, recognisable with content removed); STORY (what the visitor understands, believes, does); FIRST VIEWPORT (exact composition, scale, primary action); FORM (the form and its rank, or `pinned` and the quoted words); FINISH, verbatim: "unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md". Add mode, audience, constraints and open decisions; no PRODUCT.md or DESIGN.md copies. A block that reads like a mood means undecided. Never put the contract in anything the browser receives. For `shape`, return the direction to [shape.md](shape.md) and stop.

## 6. Build with full commitment
- Build the direction, not a safer version. Every atom (nav, buttons, inputs, links) takes the form's vocabulary by extending shadcn; a stock-looking component is a lapse. Later passes clarify, never dilute.
- The first viewport is the thesis: the mechanism at once, at life scale, not a stock hero or card.
- Prove, don't claim: show the product working. Demo data at full fidelity, labelled synthetic; never invent prices, customers, benchmarks or capabilities.
- Author the assets (names, entries, copy, covers, textures); gradients, glass, icon tiles and many-vertex `clip-path` polygons are no substitute. A named technique (canvas, WebGL, view transitions) is built, not imitated.
- Pace the scroll: vary density, scale and quiet in one spacing rhythm; end on a real close. Real, verified imagery when the brief implies it. Motion: native to the form, once, orchestrated; content visible by default.

## 7. Inspect and finish
- **Look:** one batched Playwright round on the real app with real data at desktop, mobile and any reported user viewport (native: each device class, per the platform reference). Drive every state (hover, focus, open, error, empty, overlong) and check overlap and clipping. Fix in one batch, confirm in a second round, then stop polishing. Never judge from one full-page thumbnail.
- **Captures:** settle entrance motion, shoot full pages from the top, open each file to confirm it shows what its name says. Save as `scratch/images/<item id>-<page>-<size>.png` (`desktop`, `mobile`, `user-<width>`; native `phone`, `tablet`).
- **Review:** spawn a fresh general-purpose subagent (never a fork) told to follow [agents/finish-reviewer.md](agents/finish-reviewer.md), passing the request, answers, artifact path, all screenshot paths (required), the contract, PRODUCT.md and craft-floor paths, and native platform references. Wait with one long timeout, doing other work; respawn once on an empty return.
- **Disposition:** recapture: redo the named captures, full review. Rebuild: rebuild the named parts now, full review. Fix: one batch, recapture the same files, a verdict pass from the same or a briefed fresh reviewer; two rounds, then the user decides on what stays open. Ship: documenter. Report the word at its real scope; open findings are never a pass. User evidence against a ship gets a fresh full review.
- **Document** a new world or approved system change: if DESIGN.md exists, ask refresh, overwrite or merge. Spawn a fresh subagent told to follow [agents/documenter.md](agents/documenter.md) with the root, artifact, contract, PRODUCT.md, [document.md](document.md), write boundary and choice; verify DESIGN.md with tokens and `.impeccable/design.json`. Done only after review and documentation.
