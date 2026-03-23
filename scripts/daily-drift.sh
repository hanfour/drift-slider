#!/bin/bash
set -euo pipefail

# ── Config ──
REPO_DIR="/Users/hanfourmini/Projects/library/jquery/drift-slider"
LOG_DIR="$HOME/logs/driftslider"
DATE=$(date +%Y-%m-%d)
DAY=$(date +%u)  # 1=Mon, 7=Sun
LOG_FILE="$LOG_DIR/daily-$DATE.log"

# ── Skip weekends ──
if [ "$DAY" -gt 5 ]; then
  mkdir -p "$LOG_DIR"
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
