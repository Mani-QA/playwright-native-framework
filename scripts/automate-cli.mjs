/**
 * QADemo AI harness.
 * Fetches Qase cases and runs Antigravity CLI (`agy`) once per case.
 *
 *   node scripts/automate-cli.mjs --case 91
 *   node scripts/automate-cli.mjs --suite 2 --limit 1
 *   node scripts/automate-cli.mjs --plan 3 --limit 1
 *   node scripts/automate-cli.mjs --case 91 --dry-run
 */
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

function runAgy(caseId, model) {
  const prompt = [
    `Follow .agents/skills/automate/SKILL.md for Qase case ${caseId} in project ${PROJECT}.`,
    `The case payload is playwright/.cache/harness/case-${caseId}.json.`,
    'Read docs/FRD-QADemo.md and docs/kb/product-knowledge.md before writing code.',
    'Fill steps and validations the case omitted. Reuse existing page objects and methods.',
    'Run the tests on the chromium project.',
    `Push branch automate/qase-${caseId} and open a pull request with gh.`,
    'Finish with a line that starts with PR_URL: and the pull request URL.',
  ].join(' ');

  console.log(`[Harness] agy ${model} for ${PROJECT}-${caseId}`);
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

function lookupPullRequest(caseId) {
  const listed = spawnSync(
    'gh',
    ['pr', 'list', '--head', `automate/qase-${caseId}`, '--json', 'number,url', '--limit', '1'],
    { cwd: root, encoding: 'utf8' },
  );
  if (listed.status !== 0 || !listed.stdout?.trim()) return undefined;
  try {
    const [pullRequest] = JSON.parse(listed.stdout);
    return pullRequest?.url;
  } catch {
    return undefined;
  }
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

  const cases = [];
  for (const id of ids) {
    const testCase = await loadCase(token, id);
    writeTask(testCase);
    cases.push(testCase);
    console.log(`[Harness] Prepared ${PROJECT}-${testCase.id}: ${testCase.title}`);
  }

  if (args.dryRun) {
    console.log(`[Harness] Dry run prepared ${cases.length} case task file(s). agy was not started.`);
    return;
  }

  if (!args.dryRun && gitDirty()) {
    throw new Error('The worktree has uncommitted changes. Commit or stash them before the harness runs.');
  }

  const agy = spawnSync('agy', ['--version'], { encoding: 'utf8' });
  if (agy.status !== 0) {
    throw new Error('agy is not on PATH. Install it from https://antigravity.google/docs/getting-started/');
  }

  if (args.applySettings || process.env.CI) applySettings();
  spawnSync('npm', ['run', 'index:pom'], { cwd: root, stdio: 'inherit' });

  const reports = [];
  for (const testCase of cases) {
    let result = runAgy(testCase.id, FLASH_MODEL);
    let parsed = parseAgy(result);
    if (result.status !== 0 || parsed.status === 'ERROR') {
      console.log(`[Harness] ${FLASH_MODEL} did not finish ${PROJECT}-${testCase.id}. Retrying with ${PRO_MODEL}.`);
      spawnSync('git', ['reset', '--hard', 'HEAD'], { cwd: root, stdio: 'inherit' });
      spawnSync('git', ['clean', '-fd', '-e', 'playwright/.cache'], { cwd: root, stdio: 'inherit' });
      result = runAgy(testCase.id, PRO_MODEL);
      parsed = parseAgy(result);
    }
    if (result.status !== 0 || parsed.status === 'ERROR') {
      throw new Error(parsed.error || `agy failed for ${PROJECT}-${testCase.id}`);
    }

    const url = pullRequestFrom(parsed.response || '') || lookupPullRequest(testCase.id);
    const line = url
      ? `${PROJECT}-${testCase.id} pull request: ${url}`
      : `${PROJECT}-${testCase.id} finished. No pull request URL was found.`;
    console.log(`[Harness] ${line}`);
    reports.push(line);
  }

  publishSummary(['### AI Harness', '', ...reports.map((line) => `- ${line}`)]);
}

main().catch((error) => {
  console.error(`[Harness] ${error instanceof Error ? error.message : 'The harness failed.'}`);
  process.exit(1);
});
