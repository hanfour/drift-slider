# Daily Automation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Set up macOS launchd + Claude CLI to automatically improve DriftSlider every weekday (Mon=C, Tue/Thu=A, Wed/Fri=B), with competitive analysis as input and PRs as output.

**Architecture:** A shell script (`scripts/daily-drift.sh`) is triggered by launchd at 09:00 on weekdays. It calls `claude -p` with a structured prompt that reads the day of week, consults `competitor-analysis.md`, executes the appropriate task type, and creates a PR. All changes require manual review before merge.

**Tech Stack:** Bash, launchd (plist), Claude CLI (`claude -p`), git, gh CLI

---

### Task 1: Competitive Analysis

**Files:**
- Create: `docs/plans/competitor-analysis.md`

**Step 1: Research Swiper features**

Use web search to gather Swiper's full module/feature list. Focus on features DriftSlider does NOT have yet. Cross-reference with existing demos in `docs/demos/`.

**Step 2: Research Splide features**

Same approach for Splide — extensions, plugins, unique capabilities.

**Step 3: Research Embla Carousel features**

Same approach for Embla — plugins, unique patterns.

**Step 4: Write competitor-analysis.md**

Structure:

```markdown
# DriftSlider Competitive Analysis

> Auto-generated 2026-03-20. Used by daily automation to pick tasks.

## Feature Gap Matrix

| Feature | Swiper | Splide | Embla | DriftSlider | Priority |
|---------|--------|--------|-------|-------------|----------|
| Parallax | Yes (module) | — | Plugin | No | High |
| ... | ... | ... | ... | ... | ... |

## A-Type Ideas (New Demos)
- [ ] Parallax effect demo
- [ ] ...

## B-Type Ideas (Improve Existing)
- [ ] physics-playground: add more presets
- [ ] ...

## C-Type Ideas (New Core Features)
- [ ] HashNavigation module
- [ ] ...
```

**Step 5: Commit**

```bash
git add docs/plans/competitor-analysis.md
git commit -m "docs: add competitive analysis for daily automation"
```

---

### Task 2: Create CLAUDE.md

**Files:**
- Create: `CLAUDE.md`

**Step 1: Write CLAUDE.md**

```markdown
# DriftSlider — Claude Code Instructions

## Project Structure
- `src/` — library source code (modules, core)
- `tests/` — test files
- `docs/` — static documentation site (GitHub Pages)
- `docs/demos/` — individual demo pages
- `docs/assets/lib/` — built library bundle for docs site
- `scripts/` — automation scripts

## Build
- `npm run build` — build src/ → dist/
- `npm run build:css` — build CSS bundle
- `npm test` — run tests

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
- Implement module in `src/`, add tests in `tests/`
- `npm run build` and copy to `docs/assets/lib/`
- Create demo page + update API/Modules docs
- `npm test` must pass
```

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add CLAUDE.md with project conventions and daily automation guide"
```

---

### Task 3: Create daily-drift.sh

**Files:**
- Create: `scripts/daily-drift.sh`

**Step 1: Create scripts directory and shell script**

```bash
#!/bin/bash
set -euo pipefail

# ── Config ──
REPO_DIR="/Volumes/SATECHI DISK Media/UserFolders/Projects/library/jquery/drift-slider"
LOG_DIR="$REPO_DIR/logs"
DATE=$(date +%Y-%m-%d)
DAY=$(date +%u)  # 1=Mon, 7=Sun
LOG_FILE="$LOG_DIR/daily-$DATE.log"

# ── Skip weekends ──
if [ "$DAY" -gt 5 ]; then
  echo "Weekend — skipping." >> "$LOG_FILE"
  exit 0
fi

# ── Setup ──
mkdir -p "$LOG_DIR"
cd "$REPO_DIR"
exec > >(tee -a "$LOG_FILE") 2>&1
echo "=== DriftSlider Daily Task: $DATE (day=$DAY) ==="

# ── Check for unmerged PRs ──
OPEN_PRS=$(gh pr list --author "@me" --state open --json number --jq 'length')
if [ "$OPEN_PRS" -gt 0 ]; then
  echo "WARNING: $OPEN_PRS unmerged PR(s) exist. Skipping today."
  osascript -e "display notification \"$OPEN_PRS unmerged PR(s) — skipping today\" with title \"DriftSlider Daily\""
  exit 0
fi

# ── Ensure clean main ──
git checkout main
git pull origin main

# ── Determine task type ──
case $DAY in
  1) TYPE="C"; DESC="New core feature" ;;
  2) TYPE="A"; DESC="New demo page" ;;
  3) TYPE="B"; DESC="Improve existing demo" ;;
  4) TYPE="A"; DESC="New demo page" ;;
  5) TYPE="B"; DESC="Improve existing demo" ;;
esac

echo "Task type: $TYPE ($DESC)"

# ── Build prompt ──
PROMPT="You are running the DriftSlider daily automation task.

Today is $DATE ($(date +%A)), task type: $TYPE ($DESC).

Instructions:
1. Read CLAUDE.md for project conventions and daily task rules.
2. Read docs/plans/competitor-analysis.md for task ideas.
3. Check git log and docs/demos/ to avoid duplicating recent work.
4. Execute the type-$TYPE task as described in CLAUDE.md.
5. Create a new branch: daily/$DATE
6. Commit your changes with a descriptive message.
7. Push and create a PR with gh pr create.
8. Output the PR URL as the last line.

Important:
- Do NOT push directly to main. Always create a PR.
- Include i18n (EN + ZH) for any new or modified demo pages.
- For type C: run npm test and npm run build before committing.
- Mark completed items in competitor-analysis.md with [x]."

# ── Run Claude ──
echo "Starting Claude CLI..."
PR_URL=$(claude -p "$PROMPT" \
  --output-format text \
  --permission-mode auto \
  --model sonnet \
  2>> "$LOG_FILE")

echo "Claude finished. Output: $PR_URL"

# ── Notify ──
if [ -n "$PR_URL" ]; then
  osascript -e "display notification \"$DESC completed. PR: $PR_URL\" with title \"DriftSlider Daily ✓\""
else
  osascript -e "display notification \"Task may have failed. Check logs.\" with title \"DriftSlider Daily ✗\""
fi

echo "=== Done ==="
```

**Step 2: Make executable**

```bash
chmod +x scripts/daily-drift.sh
```

**Step 3: Commit**

```bash
git add scripts/daily-drift.sh
git commit -m "feat: add daily automation shell script"
```

---

### Task 4: Update .gitignore

**Files:**
- Modify: `.gitignore`

**Step 1: Add logs/ to .gitignore**

Append `logs/` if not already present.

**Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: add logs/ to gitignore for daily automation"
```

---

### Task 5: Create launchd plist

**Files:**
- Create: `~/Library/LaunchAgents/com.driftslider.daily.plist`

**Step 1: Write plist file**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.driftslider.daily</string>

  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>/Volumes/SATECHI DISK Media/UserFolders/Projects/library/jquery/drift-slider/scripts/daily-drift.sh</string>
  </array>

  <key>StartCalendarInterval</key>
  <dict>
    <key>Hour</key>
    <integer>9</integer>
    <key>Minute</key>
    <integer>0</integer>
  </dict>

  <key>StandardOutPath</key>
  <string>/tmp/driftslider-daily.out</string>

  <key>StandardErrorPath</key>
  <string>/tmp/driftslider-daily.err</string>

  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
  </dict>
</dict>
</plist>
```

**Step 2: Load the agent**

```bash
launchctl load ~/Library/LaunchAgents/com.driftslider.daily.plist
```

**Step 3: Verify it's registered**

```bash
launchctl list | grep driftslider
```

Expected: one line showing `com.driftslider.daily`

---

### Task 6: Push and verify

**Step 1: Push all commits**

```bash
git push origin main
```

**Step 2: Manual dry run**

```bash
cd "/Volumes/SATECHI DISK Media/UserFolders/Projects/library/jquery/drift-slider"
bash scripts/daily-drift.sh
```

Verify: a PR is created, notification pops up.

**Step 3: Clean up test PR if needed**

```bash
gh pr close <number> --delete-branch
```
