# DriftSlider — Claude Code Instructions

## Project Structure
This repo is an **npm-workspaces monorepo** (root `package.json` is `private`,
`workspaces: ["packages/*"]`); commands run from the repo root delegate to the workspaces.
- `packages/core/` — the published `drift-slider` library
  - `packages/core/src/` — library source code (modules, core)
  - `packages/core/tests/` — test files
  - `packages/core/scripts/` — core build scripts (build-css, build-types, …)
- `packages/react/` — the `drift-slider-react` React wrapper (`src/` + `test/`)
- `docs/` — static documentation site (GitHub Pages), at the repo root
- `docs/demos/` — individual demo pages
- `docs/assets/lib/` — built library bundle for docs site (refreshed by `npm run build:docs`)
- `scripts/` — repo-level scripts (e.g. `copy-docs-lib.mjs`)

## Build (run from the repo root)
- `npm run build` — build core (`packages/core`, rollup) then react (`packages/react`, tsup)
- `npm run build:css` — build the core CSS bundle
- `npm run build:docs` — build core + copy the bundle into `docs/assets/lib/`
- `npm test` — run all workspace tests

## i18n
- EN/ZH toggle via `data-i18n-en` / `data-i18n-zh` attributes
- ALL demo pages must have i18n for h1 and p.demo-desc
- CSS: `[data-i18n-zh] { display: none }`, shown via `html[lang="zh-Hant"]`

## Demo Page Conventions
- Use picsum.photos with seed URLs: `https://picsum.photos/seed/{name}/W/H`
- Include `data-include` for header/footer
- Add demo card to `docs/demos.html` gallery grid
- Slide content colors: slide-1 through slide-6 classes

## Daily Automation
This repo has an automated daily task system. When invoked with the
daily task prompt, Claude should:

1. Check `date +%u` for day of week (1=Mon ... 5=Fri)
2. Mon(1)=C, Tue(2)=A, Wed(3)=B, Thu(4)=A, Fri(5)=B
3. Read `docs/plans/competitor-analysis.md` for task ideas
4. Check existing demos and git log to avoid duplicates
5. Execute the task, verify, create PR

### Task Type A — New Demo Page
- Pick from A-Type Ideas in competitor-analysis.md
- Create `docs/demos/<name>.html` with full i18n
- Register in `docs/demos.html` gallery
- Verify: page loads, i18n toggle works, no console errors

### Task Type B — Improve Existing Demo
- Audit demos for layout issues, a11y, Lighthouse scores, missing features
- Fix and enhance the demo with most room for improvement
- Verify: before/after comparison

### Task Type C — New Core Feature
- Pick from C-Type Ideas in competitor-analysis.md
- Implement the module in `packages/core/src/`, add tests in `packages/core/tests/`
- `npm run build:docs` to rebuild and refresh `docs/assets/lib/`
- Create demo page + update API/Modules docs
- `npm test` must pass
