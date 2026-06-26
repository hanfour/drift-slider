#!/bin/bash
set -euo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
export HOME="${HOME:-/Users/hanfourmini}"
export USER="${USER:-hanfourmini}"

# ── Auth: cron can't access macOS keyring ──
CRED_DIR="$HOME/.config/driftslider"
if [ -f "$CRED_DIR/.gh-token" ]; then
  export GH_TOKEN=$(cat "$CRED_DIR/.gh-token")
else
  echo "ERROR: No gh token. Run: gh auth token > $CRED_DIR/.gh-token"
  exit 1
fi
if [ -f "$CRED_DIR/.claude-credentials" ]; then
  export CLAUDE_CODE_CREDENTIALS=$(cat "$CRED_DIR/.claude-credentials")
else
  echo "ERROR: No claude credentials. Run: security find-generic-password -s 'Claude Code-credentials-578f502b' -w > $CRED_DIR/.claude-credentials"
  exit 1
fi

# ── Config ──
REPO_DIR="/Users/hanfourmini/local-repos/drift-slider"
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
read -r -d '' PROMPT << 'ENDPROMPT' || true
You are running the DriftSlider daily automation task.

## Phase 1: Plan
1. Read CLAUDE.md for project conventions and daily task rules.
2. Read docs/plans/competitor-analysis.md for task ideas.
3. Check git log --oneline -20 and ls docs/demos/ to avoid duplicating recent work.
4. Decide what to build today based on the task type.

## Phase 2: Implement
5. Create a new branch: daily/DATEPLACEHOLDER
6. Execute the task as described in CLAUDE.md.
7. For type C: run npm test and npm run build.
8. Commit your changes with a descriptive message.

## Phase 3: Verify (BEFORE creating PR)
Run a strict self-review. You must pass ALL checks before proceeding.

### 3a. Code Review
- No security issues (XSS, injection, unsafe innerHTML)
- No unused variables, dead code, or console.log left behind
- i18n complete: both data-i18n-en and data-i18n-zh on h1 and p.demo-desc
- No hardcoded English text in visible UI (except code blocks)
- picsum.photos uses seed URLs (not ?random=)

### 3b. Functional Testing
- Open the page with Playwright browser_navigate
- Take a screenshot to verify it renders correctly
- Verify slider initializes (DOM has drift-slide elements)
- Click the language toggle and verify Chinese text appears
- For type C: npm test must pass with 0 failures

### 3c. RWD Responsive Check
- Screenshot at desktop width (1280px)
- Resize to 768px (tablet) and screenshot — check no overflow or broken layout
- Resize to 375px (mobile) and screenshot — check content is readable and usable

### 3d. Lighthouse Quick Check (if available)
- Run Lighthouse on the new/modified page
- Performance ≥ 0.9, Accessibility ≥ 0.9

### Verification Failure Handling
If ANY check fails:
- Fix the issue immediately
- Re-run the failed check
- Maximum 3 fix-verify cycles
- After 3 failures: create a DRAFT PR with issues listed in the body

## Phase 4: Create PR
9. Push the branch.
10. Create a PR with gh pr create. Include in the PR body:
    - Summary of what was built/changed
    - Verification results (screenshots, test results)
    - Desktop/Tablet/Mobile screenshot links if applicable
    - Any known issues (if creating a draft PR after verification failure)
11. Mark the completed item in competitor-analysis.md with [x].
12. Output ONLY the PR URL as the very last line of your response.

## Rules
- Do NOT push directly to main. Always create a PR.
- Include i18n (EN + ZH) for any new or modified demo pages.
- Use seed-based picsum URLs: https://picsum.photos/seed/{name}/W/H
- Add the demo card to docs/demos.html gallery if creating a new demo.
ENDPROMPT

# Replace date placeholder
PROMPT="${PROMPT//DATEPLACEHOLDER/$DATE}"

# Prepend today's context
PROMPT="Today is $DATE ($(date +%A)), task type: $TYPE ($DESC).

$PROMPT"

# ── Run Claude ──
echo "Starting Claude CLI..."
CLAUDE_OUTPUT_FILE="$LOG_DIR/claude-output-$DATE.txt"
set +e  # allow claude to fail without exiting
claude -p "$PROMPT" \
  --output-format text \
  --permission-mode auto \
  --model sonnet \
  > "$CLAUDE_OUTPUT_FILE" 2>&1
CLAUDE_EXIT=$?
set -e

echo "Claude exit code: $CLAUDE_EXIT"
echo "Claude output (last 50 lines):"
tail -50 "$CLAUDE_OUTPUT_FILE"

# ── Extract PR URL ──
PR_URL=$(grep -oE 'https://github\.com/[^ ]+/pull/[0-9]+' "$CLAUDE_OUTPUT_FILE" | tail -1 || echo "")

# ── Notify ──
if [ -n "$PR_URL" ]; then
  echo "PR created: $PR_URL"
  osascript -e "display notification \"$DESC completed. PR: $PR_URL\" with title \"DriftSlider Daily ✓\""
elif [ "$CLAUDE_EXIT" -ne 0 ]; then
  echo "ERROR: Claude exited with code $CLAUDE_EXIT"
  osascript -e "display notification \"Claude failed (exit $CLAUDE_EXIT). Check logs.\" with title \"DriftSlider Daily ✗\""
else
  echo "WARNING: Claude finished but no PR URL found."
  osascript -e "display notification \"No PR created. Check logs.\" with title \"DriftSlider Daily ⚠\""
fi

echo "=== Done ==="
