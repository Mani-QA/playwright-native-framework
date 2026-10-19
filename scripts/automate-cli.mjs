/**
 * QADemo AI harness.
 * Fetches Qase cases and runs Antigravity CLI (`agy`) once per case.
 *
 *   node scripts/automate-cli.mjs --case 91
 *   node scripts/automate-cli.mjs --suite 2 --limit 1
 *   node scripts/automate-cli.mjs --plan 3 --limit 1
 *   node scripts/automate-cli.mjs --case 91 --dry-run
 */
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const API = 'https://api.qase.io/v1';
const PROJECT = 'QADEMO';
const FLASH_MODEL = process.env.HARNESS_MODEL || 'gemini-3.8-flash-medium';
const PRO_MODEL = process.env.HARNESS_FALLBACK_MODEL || 'gemini-3.1-pro-high';
const STATE_FILE = '.agents/harness-state.json';
const INSTRUCTION_FILES = [
  'GEMINI.md',
  '.agents/skills/automate/SKILL.md',
  '.agents/rules/playwright-standards.md',
  'docs/kb/product-knowledge.md',
];

function printHelp() {
  console.log(`Usage:
  node scripts/automate-cli.mjs --case <id>
  node scripts/automate-cli.mjs --suite <id> [--limit 1]
  node scripts/automate-cli.mjs --plan <id> [--limit 1]

Options:
  --dry-run         Fetch the cases and write the task files. Do not run agy.
  --limit <n>       How many suite or plan cases to automate. Default 1.
  --apply-settings  Copy .agents/antigravity-settings.json into the agy settings path.
`);
}

function readArgs(argv) {
  const values = { limit: 1, dryRun: false, applySettings: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--help' || arg === '-h') values.help = true;
    else if (arg === '--dry-run') values.dryRun = true;
    else if (arg === '--apply-settings') values.applySettings = true;
    else if (arg === '--case') values.case = argv[++index];
    else if (arg === '--suite') values.suite = argv[++index];
    else if (arg === '--plan') values.plan = argv[++index];
    else if (arg === '--limit') values.limit = Number(argv[++index]);
    else throw new Error(`Unknown argument ${arg}`);
  }
  return values;
}

function loadToken() {
  const fromEnv = process.env.QASE_API_TOKEN || process.env.QASE_TESTOPS_API_TOKEN;
  if (fromEnv?.trim()) return fromEnv.trim();
  for (const envPath of [path.join(root, '.env'), path.join(root, '..', '.env')]) {
    if (!fs.existsSync(envPath)) continue;
    const match = fs.readFileSync(envPath, 'utf8').match(/^QASEToken=(.+)$/m);
    const value = match?.[1]?.trim().replace(/^['"]|['"]$/g, '');
    if (value) return value;
  }
  return undefined;
}

async function qase(token, pathname) {
  const response = await fetch(`${API}${pathname}`, {
    headers: { Token: token, Accept: 'application/json' },
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Qase ${pathname} returned HTTP ${response.status}`);
  }
  return JSON.parse(text);
}

async function listCaseIds(token, { suite, plan }) {
  if (suite) {
    const ids = [];
    let offset = 0;
    for (;;) {
      const payload = await qase(token, `/case/${PROJECT}?suite_id=${suite}&limit=100&offset=${offset}`);
      const entities = payload.result?.entities ?? [];
      ids.push(...entities.map((item) => item.id));
      if (entities.length < 100) break;
      offset += 100;
    }
    return ids;
  }

  const payload = await qase(token, `/plan/${PROJECT}/${plan}`);
  return (payload.result?.cases ?? [])
    .map((item) => (typeof item === 'number' ? item : item.case_id ?? item.id))
    .filter((id) => Number.isInteger(id) && id > 0);
}

async function loadCase(token, id) {
  const payload = await qase(token, `/case/${PROJECT}/${id}`);
  const testCase = payload.result;
  if (!testCase) throw new Error(`Qase case ${id} was not found in ${PROJECT}.`);
  const steps = [];
  for (const step of testCase.steps ?? []) {
    if (step.shared_step_hash && !step.action) {
      const shared = await qase(token, `/shared_step/${PROJECT}/${step.shared_step_hash}`);
      const sharedSteps = shared.result?.steps ?? [];
      steps.push(...sharedSteps);
    } else {
      steps.push({
        action: step.action ?? '',
        expected_result: step.expected_result ?? '',
      });
    }
  }
  return {
    id: testCase.id,
    title: testCase.title,
    description: testCase.description ?? '',
    preconditions: testCase.preconditions ?? '',
    priority: testCase.priority,
    suite_id: testCase.suite_id,
    automation: testCase.automation,
    steps,
  };
}

function writeTask(testCase) {
  const directory = path.join(root, 'playwright', '.cache', 'harness');
  fs.mkdirSync(directory, { recursive: true });
  const filePath = path.join(directory, `case-${testCase.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(testCase, null, 2));
  return filePath;
}

function applySettings() {
  const source = path.join(root, '.agents', 'antigravity-settings.json');
  const destinationDir = path.join(os.homedir(), '.gemini', 'antigravity-cli');
  fs.mkdirSync(destinationDir, { recursive: true });
  fs.copyFileSync(source, path.join(destinationDir, 'settings.json'));
  console.log('Applied Antigravity permission settings for this user.');
}

function gitDirty() {
  const result = spawnSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' });
  return Boolean(result.stdout?.trim());
}

function hash(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return crypto.createHash('sha256').update(text).digest('hex');
}

function instructionsHash() {
  const parts = INSTRUCTION_FILES.map((file) => {
    const fullPath = path.join(root, file);
    const body = fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8') : '';
    return `${file}\n${body}`;
  });
  return hash(parts.join('\n---\n'));
}

function caseSnapshot(testCase) {
  return {
    title: testCase.title ?? '',
    description: testCase.description ?? '',
    preconditions: testCase.preconditions ?? '',
    priority: testCase.priority ?? null,
    steps: (testCase.steps ?? []).map((step) => ({
      action: step.action ?? '',
      expected_result: step.expected_result ?? '',
    })),
  };
}

function readState() {
  const fullPath = path.join(root, STATE_FILE);
  if (!fs.existsSync(fullPath)) return { instructionsHash: '', cases: {} };
  try {
    const parsed = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    return { instructionsHash: parsed.instructionsHash ?? '', cases: parsed.cases ?? {} };
  } catch {
    return { instructionsHash: '', cases: {} };
  }
}

function writeState(state) {
  const cases = {};
  for (const id of Object.keys(state.cases).sort((left, right) => Number(left) - Number(right))) {
    cases[id] = state.cases[id];
  }
  const fullPath = path.join(root, STATE_FILE);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, `${JSON.stringify({ instructionsHash: state.instructionsHash, cases }, null, 2)}\n`);
}

function remember(testCase, decision) {
  const state = readState();
  state.instructionsHash = decision.instructionsHash;
  state.cases[String(testCase.id)] = {
    caseHash: decision.caseHash,
    instructionsHash: decision.instructionsHash,
    spec: decision.spec || '',
    title: testCase.title,
    steps: caseSnapshot(testCase).steps,
  };
  writeState(state);
}

function stepChanges(previousSteps, steps) {
  if (!previousSteps) return { added: [], removed: [] };
  const key = (step) => `${step.action}\n${step.expected_result}`;
  const previous = new Set(previousSteps.map(key));
  const current = new Set(steps.map(key));
  return {
    added: steps.filter((step) => !previous.has(key(step))).map((step) => step.action),
    removed: previousSteps.filter((step) => !current.has(key(step))).map((step) => step.action),
  };
}

function decide(testCase) {
  const saved = readState().cases[String(testCase.id)];
  const currentCase = hash(caseSnapshot(testCase));
  const currentInstructions = instructionsHash();
  const spec = existingSpec(testCase.title) || saved?.spec || '';
  const branch = `automate/qase-${testCase.id}-${currentCase.slice(0, 7)}`;
  const openPullRequest = lookupPullRequest(branch);
  const base = {
    branch,
    spec,
    caseHash: currentCase,
    instructionsHash: currentInstructions,
    previousSteps: saved?.steps ?? null,
    changes: stepChanges(saved?.steps, caseSnapshot(testCase).steps),
    url: openPullRequest?.url,
  };
  if (openPullRequest?.state === 'OPEN') {
    return { ...base, action: 'skip', reasons: ['an open pull request already has this snapshot'] };
  }
  if (saved?.caseHash === currentCase && saved?.instructionsHash === currentInstructions) {
    return { ...base, action: 'skip', reasons: ['the Qase case and the harness instructions are unchanged'] };
  }
  if (!saved && spec) {
    return { ...base, action: 'seed', reasons: ['recorded the current spec as the baseline'] };
  }
  const reasons = [];
  if (!saved) reasons.push('this case has no snapshot yet');
  if (saved && saved.caseHash !== currentCase) reasons.push('the Qase case text or steps changed');
  if (saved && saved.instructionsHash !== currentInstructions) reasons.push('the harness instructions changed');
  return { ...base, action: spec ? 'update' : 'create', reasons };
}

function runAgy(testCase, model) {
  const decision = testCase.harness;
  const caseId = testCase.id;
  const update = decision.action === 'update'
    ? [
      `Mode is update. Edit the existing test in ${decision.spec}.`,
      'Do not add a second test() with the same title.',
      `Added Qase steps: ${decision.changes.added.join(' | ') || 'none'}.`,
      `Removed Qase steps: ${decision.changes.removed.join(' | ') || 'none'}.`,
      'Add a test.step and expect for each new or edited step.',
      'Add validations required by the current skill and product-knowledge that this test does not already assert.',
      'Keep steps that still match the case.',
    ]
    : [
      'Mode is create. Add the test to the spec file named in docs/kb/app-map.md.',
      'Fill steps and validations the case omitted.',
    ];
  const prompt = [
    `Follow .agents/skills/automate/SKILL.md for Qase case ${caseId} in project ${PROJECT}.`,
    `The case payload is playwright/.cache/harness/case-${caseId}.json.`,
    'Read docs/FRD-QADemo.md and docs/kb/product-knowledge.md before writing code.',
    ...update,
    'Reuse existing page objects and methods.',
    'Run the tests on the chromium project.',
    'Leave existing method URLs and locators unchanged. Add a new method when the outcome differs.',
    'Use getByRole, getByLabel, or getByPlaceholder. Do not edit src/qase or the Qase matcher.',
    'Use createSignupAccount() and VALID_CHECKOUT_DATA. Do not hardcode a phone, address, or card.',
    `${STATE_FILE} already records this snapshot. Include it in the commit and do not revert it.`,
    `Push branch ${decision.branch} and open a pull request with gh.`,
    'If that branch already has a pull request, report its URL and do not open a second one.',
    'Finish with a line that starts with PR_URL: and the pull request URL.',
  ].join(' ');

  console.log(`[Harness] agy ${model} for ${PROJECT}-${caseId} (${decision.action})`);
  return spawnSync(
    'agy',
    [
      '-p',
      prompt,
      '--model',
      model,
      '--output-format',
      'json',
      '--print-timeout',
      '45m',
      '--dangerously-skip-permissions',
    ],
    {
      cwd: root,
      encoding: 'utf8',
      env: process.env,
      maxBuffer: 50 * 1024 * 1024,
    },
  );
}

function parseAgy(result) {
  if (!result.stdout?.trim()) return { status: 'ERROR', response: '', error: result.stderr || 'agy produced no output' };
  try {
    return JSON.parse(result.stdout);
  } catch {
    return { status: result.status === 0 ? 'SUCCESS' : 'ERROR', response: result.stdout, error: result.stderr };
  }
}

function pullRequestFrom(text) {
  return text.match(/https:\/\/github\.com\/[^\s)]+\/pull\/\d+/)?.[0];
}

function testTitleOf(caseTitle) {
  const match = String(caseTitle).match(/^((?:FR|TC)-[A-Z0-9]+-\d+):\s*(.+)$/);
  return {
    requirement: match?.[1],
    testTitle: (match ? match[2] : caseTitle).trim(),
  };
}

function specFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...specFiles(fullPath));
    else if (entry.name.endsWith('.ts')) files.push(fullPath);
  }
  return files;
}

function existingSpec(caseTitle) {
  const { requirement, testTitle } = testTitleOf(caseTitle);
  const escaped = testTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const testCall = new RegExp(`\\btest(?:\\.only)?\\(\\s*(['"\`])${escaped}\\1`);
  const testsDir = path.join(root, 'tests');
  if (!fs.existsSync(testsDir)) return undefined;
  for (const filePath of specFiles(testsDir)) {
    const source = fs.readFileSync(filePath, 'utf8');
    if (!testCall.test(source)) continue;
    if (requirement && !source.includes(requirement)) continue;
    return path.relative(root, filePath);
  }
  return undefined;
}

function git(args) {
  return spawnSync('git', args, { cwd: root, encoding: 'utf8' });
}

function currentBranch() {
  return git(['branch', '--show-current']).stdout.trim();
}

function currentRevision() {
  return git(['rev-parse', 'HEAD']).stdout.trim();
}

function lookupPullRequest(branch) {
  const listed = spawnSync(
    'gh',
    ['pr', 'list', '--head', branch, '--state', 'all', '--json', 'url,state', '--limit', '10'],
    { cwd: root, encoding: 'utf8' },
  );
  if (listed.status !== 0 || !listed.stdout?.trim()) return undefined;
  try {
    const pullRequests = JSON.parse(listed.stdout);
    return pullRequests.find((pullRequest) => pullRequest.state === 'OPEN')
      || pullRequests.find((pullRequest) => pullRequest.state === 'MERGED')
      || pullRequests[0];
  } catch {
    return undefined;
  }
}

function publishBranch(branch, message, title, body) {
  const created = git(['checkout', '-b', branch]);
  if (created.status !== 0 && git(['checkout', branch]).status !== 0) {
    throw new Error(created.stderr || `Could not create ${branch}.`);
  }
  const added = git(['add', '--', STATE_FILE]);
  if (added.status !== 0) throw new Error(added.stderr || 'git add failed.');
  const committed = git(['commit', '-m', message]);
  const commitText = `${committed.stdout}${committed.stderr}`;
  if (committed.status !== 0 && !/nothing to commit/i.test(commitText)) {
    throw new Error(commitText || 'git commit failed.');
  }
  const pushed = git(['push', '-u', 'origin', 'HEAD']);
  if (pushed.status !== 0) throw new Error(pushed.stderr || 'git push failed.');
  const existing = lookupPullRequest(branch);
  if (existing?.url) return existing.url;
  const pullRequest = spawnSync(
    'gh',
    ['pr', 'create', '--title', title, '--body', body],
    { cwd: root, encoding: 'utf8' },
  );
  if (pullRequest.status !== 0) throw new Error(pullRequest.stderr || 'gh pr create failed.');
  return pullRequest.stdout.trim() || lookupPullRequest(branch)?.url;
}

function ensureStateCommitted(testCase, decision) {
  if (currentBranch() !== decision.branch) return undefined;
  remember(testCase, decision);
  const committed = git(['diff', '--quiet', '--', STATE_FILE]);
  const unstaged = git(['diff', '--cached', '--quiet', '--', STATE_FILE]);
  if (committed.status === 0 && unstaged.status === 0 && git(['status', '--porcelain', '--', STATE_FILE]).stdout.trim() === '') {
    return undefined;
  }
  return publishBranch(
    decision.branch,
    `chore(harness): record QADEMO-${testCase.id} snapshot`,
    `chore(harness): Record QADEMO-${testCase.id} snapshot`,
    `Records the Qase case and harness instruction snapshot for QADEMO-${testCase.id}.`,
  );
}

function resetWorktree(startRevision, branch) {
  git(['checkout', '--force', startRevision]);
  git(['reset', '--hard', startRevision]);
  git(['branch', '-D', branch]);
  git(['clean', '-fd', '-e', 'playwright/.cache']);
}

function publishSummary(lines) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) return;
  fs.appendFileSync(summaryPath, `${lines.join('\n')}\n`);
}

async function main() {
  const args = readArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }
  if (!args.case && !args.suite && !args.plan) {
    printHelp();
    throw new Error('Pass --case, --suite, or --plan.');
  }
  if ([args.case, args.suite, args.plan].filter(Boolean).length !== 1) {
    throw new Error('Pass only one of --case, --suite, or --plan.');
  }

  const token = loadToken();
  if (!token) {
    throw new Error('Set QASE_API_TOKEN or QASEToken in .env. The value is not printed.');
  }

  let ids = args.case ? [Number(args.case)] : await listCaseIds(token, args);
  if (!Number.isInteger(ids[0]) || ids.some((id) => !Number.isInteger(id) || id <= 0)) {
    throw new Error('Qase ids must be positive integers.');
  }
  if (!args.case) ids = ids.slice(0, Math.max(0, args.limit));
  if (ids.length === 0) throw new Error('No Qase cases matched.');

  const plans = [];
  for (const id of ids) {
    const testCase = await loadCase(token, id);
    testCase.harness = decide(testCase);
    writeTask(testCase);
    plans.push(testCase);
    console.log(`[Harness] ${PROJECT}-${testCase.id} ${testCase.harness.action}: ${testCase.harness.reasons.join('; ')}`);
  }

  if (args.dryRun) {
    console.log(`[Harness] Dry run prepared ${plans.length} case task file(s). agy was not started.`);
    return;
  }

  const needsGit = plans.some((testCase) => testCase.harness.action !== 'skip');
  if (needsGit && gitDirty()) {
    throw new Error('The worktree has uncommitted changes. Commit or stash them before the harness runs.');
  }

  const needsAgy = plans.some((testCase) => testCase.harness.action === 'create' || testCase.harness.action === 'update');
  if (needsAgy) {
    const agy = spawnSync('agy', ['--version'], { encoding: 'utf8' });
    if (agy.status !== 0) {
      throw new Error('agy is not on PATH. Install it from https://antigravity.google/docs/getting-started/');
    }
    if (args.applySettings || process.env.CI) applySettings();
    spawnSync('npm', ['run', 'index:pom'], { cwd: root, stdio: 'inherit' });
  }

  const startRevision = currentRevision();
  const reports = [];
  for (const testCase of plans) {
    const decision = testCase.harness;
    if (decision.action === 'skip') {
      const line = decision.url
        ? `${PROJECT}-${testCase.id} skipped. ${decision.reasons.join('; ')}. ${decision.url}`
        : `${PROJECT}-${testCase.id} skipped. ${decision.reasons.join('; ')}.`;
      console.log(`[Harness] ${line}`);
      reports.push(line);
      continue;
    }

    if (currentRevision() !== startRevision) git(['checkout', '--force', startRevision]);

    if (decision.action === 'seed') {
      remember(testCase, decision);
      const url = publishBranch(
        decision.branch,
        `chore(harness): baseline QADEMO-${testCase.id}`,
        `chore(harness): Baseline QADEMO-${testCase.id}`,
        `Records the current Qase case and harness instructions for QADEMO-${testCase.id}. The spec is unchanged.`,
      );
      const line = `${PROJECT}-${testCase.id} baseline recorded. ${url || decision.branch}`;
      console.log(`[Harness] ${line}`);
      reports.push(line);
      continue;
    }

    remember(testCase, decision);
    let result = runAgy(testCase, FLASH_MODEL);
    let parsed = parseAgy(result);
    if (result.status !== 0 || parsed.status === 'ERROR') {
      console.log(`[Harness] ${FLASH_MODEL} did not finish ${PROJECT}-${testCase.id}. Retrying with ${PRO_MODEL}.`);
      resetWorktree(startRevision, decision.branch);
      remember(testCase, decision);
      result = runAgy(testCase, PRO_MODEL);
      parsed = parseAgy(result);
    }
    if (result.status !== 0 || parsed.status === 'ERROR') {
      throw new Error(parsed.error || `agy failed for ${PROJECT}-${testCase.id}`);
    }

    const stateUrl = ensureStateCommitted(testCase, decision);
    const url = pullRequestFrom(parsed.response || '') || stateUrl || lookupPullRequest(decision.branch)?.url;
    const line = url
      ? `${PROJECT}-${testCase.id} ${decision.action}: ${url}`
      : `${PROJECT}-${testCase.id} ${decision.action} finished. No pull request URL was found.`;
    console.log(`[Harness] ${line}`);
    reports.push(line);
  }

  publishSummary(['### AI Harness', '', ...reports.map((line) => `- ${line}`)]);
}

main().catch((error) => {
  console.error(`[Harness] ${error instanceof Error ? error.message : 'The harness failed.'}`);
  process.exit(1);
});
