#!/usr/bin/env node

/**
 * DriftSlider Agentic 自主優化迴圈
 *
 * Usage:
 *   node scripts/agent-optimize.mjs --target coverage --maxIters 10
 *   node scripts/agent-optimize.mjs --target bundle --model opus --maxIters 5
 *   node scripts/agent-optimize.mjs --target lighthouse --resume
 *   node scripts/agent-optimize.mjs --target coverage --dryRun
 */

import { execSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { parseArgs } from 'node:util';

// ─── CLI Args ────────────────────────────────────────────────────────────────

const { values: args } = parseArgs({
  options: {
    target:   { type: 'string',  default: 'coverage' },
    maxIters: { type: 'string',  default: '5' },
    model:    { type: 'string',  default: 'sonnet' },
    dryRun:   { type: 'boolean', default: false },
    resume:   { type: 'boolean', default: false },
    logFile:  { type: 'string',  default: 'scripts/optimize-log.json' },
  },
});

const TARGET    = args.target;
const MAX_ITERS = parseInt(args.maxIters, 10);
const MODEL     = args.model;
const DRY_RUN   = args.dryRun;
const RESUME    = args.resume;
const LOG_FILE  = args.logFile;

const VALID_TARGETS = ['coverage', 'bundle', 'lighthouse'];
if (!VALID_TARGETS.includes(TARGET)) {
  console.error(`❌ Invalid target: "${TARGET}". Must be one of: ${VALID_TARGETS.join(', ')}`);
  process.exit(1);
}

const ROOT = resolve(import.meta.dirname, '..');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function run(cmd, opts = {}) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf-8', stdio: 'pipe', ...opts }).trim();
}

function runSafe(cmd) {
  try {
    return { ok: true, output: run(cmd) };
  } catch (e) {
    return { ok: false, output: e.stderr || e.message };
  }
}

function log(msg) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] ${msg}`);
}

// ─── Metric Collection ──────────────────────────────────────────────────────

function collectCoverageMetrics() {
  log('📊 Running test:coverage...');
  const result = runSafe('npm run test:coverage');
  if (!result.ok) {
    log('⚠️  test:coverage failed');
    return null;
  }

  const covPath = join(ROOT, 'coverage', 'coverage-final.json');
  if (!existsSync(covPath)) {
    log('⚠️  coverage-final.json not found');
    return null;
  }

  const covData = JSON.parse(readFileSync(covPath, 'utf-8'));
  let totalStatements = 0, coveredStatements = 0;
  let totalBranches = 0, coveredBranches = 0;
  let totalFunctions = 0, coveredFunctions = 0;

  for (const file of Object.values(covData)) {
    // Statements
    const s = file.s || {};
    for (const count of Object.values(s)) {
      totalStatements++;
      if (count > 0) coveredStatements++;
    }
    // Branches
    const b = file.b || {};
    for (const counts of Object.values(b)) {
      for (const count of counts) {
        totalBranches++;
        if (count > 0) coveredBranches++;
      }
    }
    // Functions
    const f = file.f || {};
    for (const count of Object.values(f)) {
      totalFunctions++;
      if (count > 0) coveredFunctions++;
    }
  }

  return {
    statements: totalStatements ? round((coveredStatements / totalStatements) * 100) : 0,
    branches:   totalBranches   ? round((coveredBranches / totalBranches) * 100) : 0,
    functions:  totalFunctions  ? round((coveredFunctions / totalFunctions) * 100) : 0,
  };
}

function collectBundleMetrics() {
  log('📦 Running build...');
  const result = runSafe('npm run build');
  if (!result.ok) {
    log('⚠️  build failed');
    return null;
  }

  const distDir = join(ROOT, 'dist');
  const files = readdirSync(distDir).filter(f => f.endsWith('.js'));
  const metrics = {};

  for (const file of files) {
    const content = readFileSync(join(distDir, file));
    const gzipped = gzipSync(content);
    metrics[file] = {
      raw: content.length,
      gzip: gzipped.length,
    };
  }

  return metrics;
}

function collectLighthouseMetrics() {
  log('🔦 Running Lighthouse CI...');
  const result = runSafe('npx @lhci/cli autorun');
  if (!result.ok) {
    log('⚠️  Lighthouse CI failed');
    // Try to parse results even on assertion failures
  }

  const lhDir = join(ROOT, '.lighthouseci');
  if (!existsSync(lhDir)) {
    log('⚠️  .lighthouseci/ not found');
    return null;
  }

  const lhrFiles = readdirSync(lhDir).filter(f => f.startsWith('lhr-') && f.endsWith('.json'));
  if (lhrFiles.length === 0) {
    log('⚠️  No lhr-*.json found');
    return null;
  }

  const scores = { performance: [], accessibility: [], 'best-practices': [], seo: [] };

  for (const file of lhrFiles) {
    const lhr = JSON.parse(readFileSync(join(lhDir, file), 'utf-8'));
    for (const cat of Object.keys(scores)) {
      if (lhr.categories?.[cat]?.score != null) {
        scores[cat].push(lhr.categories[cat].score);
      }
    }
  }

  const avg = {};
  for (const [cat, vals] of Object.entries(scores)) {
    avg[cat] = vals.length ? round(vals.reduce((a, b) => a + b, 0) / vals.length, 2) : null;
  }

  return avg;
}

function collectMetrics() {
  switch (TARGET) {
    case 'coverage':   return collectCoverageMetrics();
    case 'bundle':     return collectBundleMetrics();
    case 'lighthouse': return collectLighthouseMetrics();
  }
}

function round(n, decimals = 2) {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

// ─── Comparison Logic ────────────────────────────────────────────────────────

function isImprovement(baseline, current) {
  if (!baseline || !current) return false;

  switch (TARGET) {
    case 'coverage': {
      let anyBetter = false;
      for (const key of ['statements', 'branches', 'functions']) {
        if (current[key] < baseline[key]) return false; // 退步
        if (current[key] > baseline[key]) anyBetter = true;
      }
      return anyBetter;
    }

    case 'bundle': {
      let anyBetter = false;
      for (const file of Object.keys(baseline)) {
        if (!current[file]) continue;
        if (current[file].gzip > baseline[file].gzip) return false; // 變大
        if (current[file].gzip < baseline[file].gzip) anyBetter = true;
      }
      return anyBetter;
    }

    case 'lighthouse': {
      let anyBetter = false;
      for (const cat of Object.keys(baseline)) {
        if (baseline[cat] == null || current[cat] == null) continue;
        if (current[cat] < baseline[cat]) return false; // 退步
        if (current[cat] > baseline[cat]) anyBetter = true;
      }
      return anyBetter;
    }
  }

  return false;
}

function formatMetricsDiff(baseline, current) {
  const lines = [];

  switch (TARGET) {
    case 'coverage':
      for (const key of ['statements', 'branches', 'functions']) {
        const diff = round(current[key] - baseline[key]);
        const sign = diff > 0 ? '+' : '';
        lines.push(`  ${key}: ${baseline[key]}% → ${current[key]}% (${sign}${diff}%)`);
      }
      break;

    case 'bundle':
      for (const file of Object.keys(baseline)) {
        if (!current[file]) continue;
        const diff = current[file].gzip - baseline[file].gzip;
        const sign = diff > 0 ? '+' : '';
        lines.push(`  ${file}: ${baseline[file].gzip}B → ${current[file].gzip}B (${sign}${diff}B gzip)`);
      }
      break;

    case 'lighthouse':
      for (const cat of Object.keys(baseline)) {
        if (baseline[cat] == null) continue;
        const diff = round((current[cat] || 0) - baseline[cat]);
        const sign = diff > 0 ? '+' : '';
        lines.push(`  ${cat}: ${baseline[cat]} → ${current[cat]} (${sign}${diff})`);
      }
      break;
  }

  return lines.join('\n');
}

// ─── Git Helpers ─────────────────────────────────────────────────────────────

function createBranch(name) {
  log(`🌿 Creating branch: ${name}`);
  run(`git checkout -b ${name}`);
}

function commitChanges(msg) {
  run('git add -A');
  // Check if there are staged changes
  const status = runSafe('git diff --cached --quiet');
  if (status.ok) {
    log('ℹ️  No changes to commit');
    return false;
  }
  const commitResult = spawnSync('git', ['commit', '-m', msg], {
    cwd: ROOT, encoding: 'utf-8', stdio: 'pipe',
  });
  if (commitResult.status !== 0) {
    log(`⚠️  Commit failed: ${commitResult.stderr}`);
    return false;
  }
  log('✅ Committed changes');
  return true;
}

function rollback() {
  log('🔄 Rolling back changes...');
  run('git checkout -- .');
  run('git clean -fd');
}

function getCurrentBranch() {
  return run('git rev-parse --abbrev-ref HEAD');
}

// ─── Prompt Templates ───────────────────────────────────────────────────────

function buildPrompt(baseline, iteration) {
  switch (TARGET) {
    case 'coverage':
      return `You are optimizing test coverage for the DriftSlider project.

Current test coverage (iteration ${iteration}):
- Statements: ${baseline.statements}%
- Branches: ${baseline.branches}%
- Functions: ${baseline.functions}%

Your goal: Increase test coverage by adding or improving test files.

Rules:
1. ONLY create or modify files in the tests/ directory
2. Look at coverage/coverage-final.json to find uncovered code paths
3. Read the source files in src/ to understand what needs testing
4. Use existing test patterns from tests/ as reference
5. Focus on the lowest coverage area first
6. Make sure all tests pass (npm run test)
7. Do NOT modify any source code in src/

After making changes, run: npm run test
to verify all tests pass.`;

    case 'bundle':
      return `You are optimizing bundle size for the DriftSlider project.

Current bundle sizes (gzipped, iteration ${iteration}):
${Object.entries(baseline).map(([f, s]) => `- ${f}: ${s.gzip} bytes gzip (${s.raw} bytes raw)`).join('\n')}

Your goal: Reduce the gzipped bundle size without changing the public API.

Rules:
1. ONLY modify files in src/
2. Do NOT change any public API signatures or behavior
3. Focus on: dead code elimination, shorter variable names in hot paths, reducing repetition
4. After changes, run: npm run test && npm run build
5. Verify tests still pass before finishing
6. Do NOT modify test files`;

    case 'lighthouse':
      return `You are optimizing Lighthouse scores for the DriftSlider documentation site.

Current Lighthouse scores (iteration ${iteration}):
${Object.entries(baseline).map(([cat, score]) => `- ${cat}: ${score}`).join('\n')}

Your goal: Improve Lighthouse performance, accessibility, best-practices, and SEO scores.

Rules:
1. ONLY modify files in docs/
2. Focus on: semantic HTML, image optimization attributes, meta tags, ARIA labels, loading performance
3. Do NOT modify src/ or tests/ files
4. Common improvements: add alt text, use semantic elements, add meta descriptions, lazy load images, preconnect hints`;
  }
}

// ─── Claude CLI ─────────────────────────────────────────────────────────────

function callClaude(prompt) {
  log(`🤖 Calling Claude (${MODEL})...`);

  const allowedTools = [
    'Read', 'Glob', 'Grep', 'Edit', 'Write',
    'Bash(npm run test)', 'Bash(npm run build)',
    'Bash(npm run test:coverage)',
    'Bash(cat *)', 'Bash(ls *)',
  ];

  // Remove CLAUDECODE env var to allow nested invocation
  const env = { ...process.env };
  delete env.CLAUDECODE;

  const result = spawnSync('claude', [
    '-p',
    '--model', MODEL,
    '--allowedTools', allowedTools.join(','),
  ], {
    input: prompt,
    cwd: ROOT,
    encoding: 'utf-8',
    timeout: 10 * 60 * 1000, // 10 minutes
    stdio: ['pipe', 'pipe', 'pipe'],
    maxBuffer: 10 * 1024 * 1024,
    env,
  });

  if (result.error) {
    log(`⚠️  Claude CLI error: ${result.error.message}`);
    return { ok: false, output: result.error.message };
  }

  if (result.status !== 0) {
    log(`⚠️  Claude CLI exited with code ${result.status}`);
    return { ok: false, output: result.stderr || 'Unknown error' };
  }

  log('✅ Claude finished');
  return { ok: true, output: result.stdout };
}

// ─── Validation ─────────────────────────────────────────────────────────────

function validate() {
  log('🧪 Validating (npm test)...');
  const testResult = runSafe('npm test');
  if (!testResult.ok) {
    log('❌ Tests failed');
    return false;
  }
  log('✅ Tests passed');

  if (TARGET === 'bundle') {
    log('🔨 Validating (npm run build)...');
    const buildResult = runSafe('npm run build');
    if (!buildResult.ok) {
      log('❌ Build failed');
      return false;
    }
    log('✅ Build passed');
  }

  return true;
}

// ─── Log Management ─────────────────────────────────────────────────────────

function loadLog() {
  const logPath = join(ROOT, LOG_FILE);
  if (existsSync(logPath)) {
    return JSON.parse(readFileSync(logPath, 'utf-8'));
  }
  return null;
}

function saveLog(logData) {
  const logPath = join(ROOT, LOG_FILE);
  writeFileSync(logPath, JSON.stringify(logData, null, 2) + '\n', 'utf-8');
}

// ─── Main Loop ──────────────────────────────────────────────────────────────

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   DriftSlider Agentic Optimization Loop     ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
  console.log(`  Target:    ${TARGET}`);
  console.log(`  Model:     ${MODEL}`);
  console.log(`  Max Iters: ${MAX_ITERS}`);
  console.log(`  Dry Run:   ${DRY_RUN}`);
  console.log(`  Resume:    ${RESUME}`);
  console.log('');

  // Load or init log
  let logData;
  let startIter = 0;

  if (RESUME) {
    logData = loadLog();
    if (logData && logData.target === TARGET) {
      startIter = logData.iterations.length;
      log(`📂 Resuming from iteration ${startIter + 1}`);
      // Switch to existing branch
      const currentBranch = getCurrentBranch();
      if (currentBranch !== logData.branch) {
        run(`git checkout ${logData.branch}`);
      }
    } else if (logData) {
      console.error(`❌ Log target mismatch: log has "${logData.target}" but --target is "${TARGET}"`);
      process.exit(1);
    } else {
      console.error('❌ No log file found to resume from');
      process.exit(1);
    }
  }

  if (!logData) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const branchName = `agent/optimize-${TARGET}-${timestamp}`;

    if (!DRY_RUN) {
      createBranch(branchName);
    }

    logData = {
      target: TARGET,
      branch: DRY_RUN ? '(dry-run)' : branchName,
      startedAt: new Date().toISOString(),
      iterations: [],
    };
  }

  // Main iteration loop
  for (let i = startIter; i < MAX_ITERS; i++) {
    const iterNum = i + 1;
    console.log('');
    console.log(`── Iteration ${iterNum}/${MAX_ITERS} ${'─'.repeat(40)}`);
    console.log('');

    // 1. Snapshot baseline
    log('Collecting baseline metrics...');
    const baseline = collectMetrics();
    if (!baseline) {
      log('❌ Failed to collect baseline metrics, aborting');
      break;
    }
    log(`Baseline: ${JSON.stringify(baseline)}`);

    if (DRY_RUN) {
      log('🏁 Dry run — skipping Claude call');
      logData.iterations.push({
        iteration: iterNum,
        baseline,
        current: baseline,
        status: 'dry-run',
      });
      saveLog(logData);
      continue;
    }

    // 2. Call Claude
    const prompt = buildPrompt(baseline, iterNum);
    const claudeResult = callClaude(prompt);
    if (!claudeResult.ok) {
      log('⚠️  Claude call failed, rolling back');
      rollback();
      logData.iterations.push({
        iteration: iterNum,
        baseline,
        current: null,
        status: 'claude-failed',
        error: claudeResult.output.slice(0, 500),
      });
      saveLog(logData);
      continue;
    }

    // 3. Validate (skip for coverage — collectMetrics already runs tests)
    if (TARGET !== 'coverage' && !validate()) {
      log('❌ Validation failed, rolling back');
      rollback();
      logData.iterations.push({
        iteration: iterNum,
        baseline,
        current: null,
        status: 'validation-failed',
      });
      saveLog(logData);
      continue;
    }

    // 4. Measure new metrics
    log('Collecting new metrics...');
    const current = collectMetrics();
    if (!current) {
      log('⚠️  Failed to collect new metrics, rolling back');
      rollback();
      logData.iterations.push({
        iteration: iterNum,
        baseline,
        current: null,
        status: 'metrics-failed',
      });
      saveLog(logData);
      continue;
    }

    // 5. Compare
    const improved = isImprovement(baseline, current);
    const diff = formatMetricsDiff(baseline, current);

    console.log('');
    console.log(diff);
    console.log('');

    if (improved) {
      log('🎉 Improvement detected! Committing...');
      const commitMsg = `agent(${TARGET}): iteration ${iterNum}\n\n${diff}`;
      commitChanges(commitMsg);
      logData.iterations.push({
        iteration: iterNum,
        baseline,
        current,
        status: 'committed',
      });
    } else {
      log('📉 No improvement, rolling back');
      rollback();
      logData.iterations.push({
        iteration: iterNum,
        baseline,
        current,
        status: 'rolled-back',
      });
    }

    // 6. Save log
    saveLog(logData);
  }

  // Summary
  logData.finishedAt = new Date().toISOString();
  saveLog(logData);

  console.log('');
  console.log('═'.repeat(50));
  console.log('  Summary');
  console.log('═'.repeat(50));
  console.log(`  Target:     ${TARGET}`);
  console.log(`  Branch:     ${logData.branch}`);
  console.log(`  Iterations: ${logData.iterations.length}`);

  const committed = logData.iterations.filter(i => i.status === 'committed').length;
  const rolledBack = logData.iterations.filter(i => i.status === 'rolled-back').length;
  const failed = logData.iterations.filter(i => i.status.includes('failed')).length;

  console.log(`  Committed:  ${committed}`);
  console.log(`  Rolled back: ${rolledBack}`);
  console.log(`  Failed:     ${failed}`);

  if (logData.iterations.length > 0) {
    const first = logData.iterations[0].baseline;
    const lastCommitted = [...logData.iterations].reverse().find(i => i.status === 'committed');
    if (lastCommitted) {
      console.log('');
      console.log('  Overall improvement:');
      console.log(formatMetricsDiff(first, lastCommitted.current));
    }
  }

  console.log('');
  console.log(`  Log: ${LOG_FILE}`);
  console.log('');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
