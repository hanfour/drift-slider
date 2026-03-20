# DriftSlider Daily Automation Design

**Date:** 2026-03-20
**Status:** Approved

## Overview

Automated daily improvement system for DriftSlider's demo site and core library. Uses macOS `launchd` to schedule Claude CLI execution every weekday, cycling through three task types.

## Weekly Schedule

| Day | Type | Description |
|-----|------|-------------|
| Mon | C | New core feature — module in `src/`, build, demo, API docs |
| Tue | A | New demo page — competitive analysis → design → implement |
| Wed | B | Improve existing demo — UI/UX, bugs, Lighthouse optimization |
| Thu | A | New demo page |
| Fri | B | Improve existing demo |
| Sat/Sun | — | No execution |

## Task Types

### A — New Demo Page
1. Read `competitor-analysis.md` for inspiration
2. Check existing demos via `git log` and `docs/demos/` to avoid duplicates
3. Pick the highest-impact missing demo
4. Implement: HTML + inline CSS/JS, i18n (EN + ZH), picsum images with seed URLs
5. Register in `docs/demos.html` gallery grid
6. Verify: Lighthouse, screenshot, language toggle

### B — Improve Existing Demo
1. Audit existing demos for issues (layout, responsiveness, a11y, Lighthouse)
2. Pick the demo with the most room for improvement
3. Fix and enhance
4. Verify changes

### C — New Core Feature
1. Read `competitor-analysis.md` for feature gaps
2. Design module API (consistent with existing patterns)
3. Implement in `src/`, write tests in `tests/`
4. `npm run build` → copy bundle to `docs/assets/lib/`
5. Create demo page + update `docs/api.html` and `docs/modules.html`
6. `npm test` to verify

## Automation Architecture

```
launchd (weekdays 09:00)
  → scripts/daily-drift.sh
    → claude -p <structured prompt> --cwd <repo-path>
      → read day-of-week → determine task type
      → read competitor-analysis.md
      → check git log + existing demos for duplicates
      → execute task (implement, test, verify)
      → git checkout -b daily/YYYY-MM-DD
      → commit + push
      → gh pr create
      → macOS notification
```

## Competitive Analysis

Stored in `docs/plans/competitor-analysis.md`. Covers:
- **Swiper** — grid, thumbs, virtual slides, parallax, hash navigation, mousewheel, free mode
- **Splide** — autoScroll, intersection, URL hash, drag-free, live region
- **Embla Carousel** — autoplay, autoScroll, fade, wheel gesture, class names, auto-height

Claude checks this file each run to find the next valuable feature or demo to build.

## Error Handling

- Failure → log to `logs/daily-YYYY-MM-DD.log`, task stays undone, retries next matching day
- 3 consecutive failures on same task type → skip and try different item
- If unmerged PR exists from previous run → skip execution, send notification

## Safety

- All changes go through PR (never direct push to main)
- `--allowedTools` restricts Claude CLI capabilities
- Shell script checks for stale PRs before running
- macOS notification on completion or failure

## Files

| File | Location | In repo? |
|------|----------|----------|
| `scripts/daily-drift.sh` | Repo root | Yes |
| `docs/plans/competitor-analysis.md` | Repo | Yes |
| `CLAUDE.md` | Repo root | Yes (updated) |
| `.gitignore` | Repo root | Yes (add `logs/`) |
| `com.driftslider.daily.plist` | `~/Library/LaunchAgents/` | No |
| `logs/daily-*.log` | Repo root | No (gitignored) |
