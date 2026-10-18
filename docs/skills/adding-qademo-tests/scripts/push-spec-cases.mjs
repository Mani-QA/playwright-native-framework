/**
 * Publish Playwright spec tests to the Qase suite "QADemo Automation".
 * Reads QASEToken from the repo-root .env. Never prints the token.
 *
 *   node playwright-native-framework/docs/skills/adding-qademo-tests/scripts/push-spec-cases.mjs
 *   node playwright-native-framework/docs/skills/adding-qademo-tests/scripts/push-spec-cases.mjs --dry-run
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const API = 'https://api.qase.io/v1';
const PROJECT = 'QADEMO';
const SUITE_TITLE = 'QADemo Automation';
const DRY_RUN = process.argv.includes('--dry-run');

const NEGATIVE_REQUIREMENTS = new Set([
  'FR-AUTH-003',
  'FR-AUTH-004',
  'FR-AUTH-009',
  'FR-AUTH-012',
  'FR-ADM-001',
  'FR-CHK-001',
  'FR-CHK-002',
  'FR-CHK-007',
  'FR-CHK-008',
  'FR-ORD-001',
  'FR-ORD-008',
  'FR-CART-011',
  'FR-PROD-011',
]);

function loadToken() {
  let dir = path.dirname(fileURLToPath(import.meta.url));
  for (let hop = 0; hop < 8; hop += 1) {
    const envPath = path.join(dir, '.env');
    if (fs.existsSync(envPath)) {
      const match = fs.readFileSync(envPath, 'utf8').match(/^QASEToken=(.+)$/m);
      if (match?.[1]?.trim()) return match[1].trim();
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  if (process.env.QASE_TOKEN) return process.env.QASE_TOKEN;
  throw new Error('QASEToken was not found in .env and QASE_TOKEN is not set.');
}

function frameworkRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
}

function redact(token, value) {
  return String(value).split(token).join('[token]');
}

async function qase(token, method, pathname, body) {
  const response = await fetch(`${API}${pathname}`, {
    method,
    headers: {
      Token: token,
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { raw: text };
  }
  if (!response.ok || payload?.status === false) {
    throw new Error(`${method} ${pathname} -> ${response.status} ${redact(token, text).slice(0, 2000)}`);
  }
  return payload;
}

function readQuoted(source, start) {
  const quote = source[start];
  let value = '';
  let i = start + 1;
  while (i < source.length) {
    if (source[i] === '\\') {
      value += source[i + 1] ?? '';
      i += 2;
      continue;
    }
    if (source[i] === quote) return { value, end: i + 1 };
    value += source[i];
    i += 1;
  }
  throw new Error('Unterminated string while reading a test title.');
}

function skipTrivia(source, index) {
  let i = index;
  while (i < source.length) {
    if (source.startsWith('//', i)) {
      const next = source.indexOf('\n', i);
      i = next === -1 ? source.length : next + 1;
      continue;
    }
    if (source.startsWith('/*', i)) {
      const next = source.indexOf('*/', i + 2);
      i = next === -1 ? source.length : next + 2;
      continue;
    }
    if (source[i] === "'" || source[i] === '"' || source[i] === '`') {
      i = readQuoted(source, i).end;
      continue;
    }
    break;
  }
  return i;
}

function findBodyBrace(source, from) {
  let i = from;
  let parens = 1;
  let seenArrow = false;
  while (i < source.length) {
    i = skipTrivia(source, i);
    if (i >= source.length) break;
    if (source[i] === '(') parens += 1;
    else if (source[i] === ')') {
      parens -= 1;
      if (parens === 0) return -1;
    } else if (source.startsWith('=>', i)) seenArrow = true;
    else if (seenArrow && parens === 1 && source[i] === '{') return i;
    i += 1;
  }
  return -1;
}

function parseSpec(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);
  const tests = [];
  const describes = [];
  const pending = [];
  let current = null;
  let depth = 0;
  let i = 0;

  const closeFinished = () => {
    while (describes.length > 0 && describes.at(-1).depth > depth) describes.pop();
    if (current && depth < current.depth) {
      tests.push(current);
      current = null;
    }
  };

  while (i < source.length) {
    if (source.startsWith('//', i)) {
      const next = source.indexOf('\n', i);
      i = next === -1 ? source.length : next + 1;
      continue;
    }
    if (source.startsWith('/*', i)) {
      const next = source.indexOf('*/', i + 2);
      i = next === -1 ? source.length : next + 2;
      continue;
    }
    if (source[i] === "'" || source[i] === '"' || source[i] === '`') {
      i = readQuoted(source, i).end;
      continue;
    }

    const atCall = (i === 0 || !/[\w.]/.test(source[i - 1])) && source.startsWith('test', i);
    if (atCall) {
      const match = source.slice(i).match(/^test(?:\.(describe|step|skip))?/);
      const kind = match?.[1] ?? 'test';
      let cursor = i + match[0].length;
      while (/\s/.test(source[cursor])) cursor += 1;
      if (source[cursor] === '(') {
        cursor += 1;
        while (/\s/.test(source[cursor])) cursor += 1;
        if (source[cursor] === "'" || source[cursor] === '"' || source[cursor] === '`') {
          const quoted = readQuoted(source, cursor);
          const brace = findBodyBrace(source, quoted.end);
          if (brace !== -1) {
            pending.push({ kind, title: quoted.value, brace });
            i = quoted.end;
            continue;
          }
        }
      }
    }

    if (source[i] === '{') {
      depth += 1;
      const opened = pending.filter((item) => item.brace === i);
      pending.splice(0, pending.length, ...pending.filter((item) => item.brace !== i));
      for (const item of opened) {
        if (item.kind === 'describe') {
          describes.push({ title: item.title, depth });
        } else if (item.kind === 'step') {
          if (current) current.steps.push(item.title);
        } else {
          if (current) tests.push(current);
          current = {
            fileName,
            title: item.title,
            skipped: item.kind === 'skip',
            steps: [],
            describes: describes.map((item) => item.title),
            depth,
          };
        }
      }
      i += 1;
      continue;
    }

    if (source[i] === '}') {
      depth -= 1;
      closeFinished();
      i += 1;
      continue;
    }

    i += 1;
  }

  if (current) tests.push(current);
  return tests;
}

function requirementId(describes) {
  for (let index = describes.length - 1; index >= 0; index -= 1) {
    const match = describes[index].match(/FR-[A-Z]+-\d+/);
    if (match) return match[0];
  }
  return '';
}

function priorityTag(describes) {
  for (let index = describes.length - 1; index >= 0; index -= 1) {
    const match = describes[index].match(/@p([1-4])/);
    if (match) return match[1];
  }
  return '2';
}

function preconditions(testCase) {
  const blob = [testCase.title, ...testCase.steps].join('\n');
  const lines = ['Application under test: https://qademo.com.'];
  if (/signed-up customer|login with the signed-up/i.test(blob)) {
    lines.push('Sign in as the shared customer created before the Playwright run.');
  } else if (/admin user|login as admin/i.test(blob) && !/cannot access admin|admin link not visible/i.test(blob)) {
    lines.push('Sign in as admin_user. The password is $Admin plus the local date as DDMMYYYY.');
  } else if (/locked user/i.test(blob)) {
    lines.push('Use the seeded locked account locked_user / locked123.');
  } else if (/standard user/i.test(blob)) {
    lines.push('Use the seeded account standard_user / standard123.');
  } else if (/without authentication|unauthenticated|for guests|guest/i.test(blob)) {
    lines.push('Start signed out. Do not apply a stored browser session.');
  } else if (/signup|create an account|create a standard account|leave username empty|duplicate email|empty form|invalid signup|missing signup/i.test(blob)) {
    lines.push('Register a new visitor. Do not replace the shared customer credentials file.');
  } else if (/navigate to login page and login/i.test(blob)) {
    lines.push('Sign in as the shared customer created before the Playwright run.');
  }
  if (testCase.fileName === 'api.spec.ts') {
    lines.push('Exercise the HTTPS API directly. Do not drive the browser.');
  }
  if (testCase.skipped) {
    lines.push('This test is marked test.skip in the spec and does not run in the default suite.');
  }
  return lines.join('\n');
}

function toQaseCase(testCase, suiteId, apiLayerId) {
  const requirement = requirementId(testCase.describes);
  const priority = priorityTag(testCase.describes);
  const moduleTitle = testCase.describes[0] ?? testCase.fileName;
  const groupTitle = testCase.describes.at(-1) ?? moduleTitle;
  const title = `${requirement ? `${requirement}: ` : ''}${testCase.title}`.slice(0, 255);
  const steps = (testCase.steps.length > 0 ? testCase.steps : [testCase.title]).map((step) => ({
    action: step,
    expected_result: /^verify\b/i.test(step)
      ? step.replace(/^verify\s+/i, '')
      : 'The action completes and the page is ready for the next step.',
  }));

  return {
    title,
    description: [
      'Automated Playwright test.',
      '',
      `Spec: tests/${testCase.fileName}`,
      `Module: ${moduleTitle}`,
      `Group: ${groupTitle}`,
      testCase.skipped ? 'Playwright status: test.skip. The described screen is not available in the current app.' : '',
    ].filter(Boolean).join('\n'),
    preconditions: preconditions(testCase),
    suite_id: suiteId,
    severity: priority === '1' ? 3 : priority === '2' ? 4 : 5,
    priority: priority === '1' ? 1 : priority === '2' ? 2 : 3,
    type: 8,
    layer: testCase.fileName === 'api.spec.ts' ? apiLayerId : 1,
    behavior: NEGATIVE_REQUIREMENTS.has(requirement) ? 3 : 2,
    automation: 2,
    isManual: 0,
    status: 0,
    steps,
    tags: [requirement, `p${priority}`, testCase.fileName.replace('.spec.ts', ''), 'automation'].filter(Boolean),
  };
}

function collectTests() {
  const testsDir = path.join(frameworkRoot(), 'tests');
  const files = fs.readdirSync(testsDir)
    .filter((name) => name.endsWith('.spec.ts') && name !== 'seed.spec.ts')
    .sort();
  return files.flatMap((name) => parseSpec(path.join(testsDir, name)));
}

async function listSuites(token) {
  const payload = await qase(token, 'GET', `/suite/${PROJECT}?limit=100`);
  return payload.result?.entities ?? payload.result ?? [];
}

async function ensureSuite(token) {
  const suites = await listSuites(token);
  const existing = suites.find((suite) => suite.title === SUITE_TITLE);
  if (existing) return existing.id;
  const created = await qase(token, 'POST', `/suite/${PROJECT}`, {
    title: SUITE_TITLE,
    description: 'Playwright tests from playwright-native-framework/tests. One case per test(), excluding seed and setup.',
    preconditions: 'https://qademo.com is available. Global setup creates the shared customer before a Playwright run.',
  });
  return created.result.id;
}

async function layerIds(token) {
  const payload = await qase(token, 'GET', '/system_field');
  const fields = payload.result?.entities ?? payload.result ?? [];
  const layer = fields.find((field) => field.slug === 'layer' || field.title === 'Layer');
  const options = layer?.options ?? layer?.values ?? [];
  const api = options.find((option) => /api/i.test(option.title ?? option.name ?? ''));
  return { api: api?.id ?? 1, options: options.map((option) => ({ id: option.id, title: option.title ?? option.name })) };
}

async function existingTitles(token, suiteId) {
  const titles = new Set();
  let offset = 0;
  for (;;) {
    const payload = await qase(token, 'GET', `/case/${PROJECT}?suite_id=${suiteId}&limit=100&offset=${offset}`);
    const entities = payload.result?.entities ?? [];
    for (const entity of entities) {
      if (entity.suite_id === suiteId || entity.suite?.id === suiteId) titles.add(entity.title);
    }
    if (entities.length < 100) break;
    offset += entities.length;
  }
  return titles;
}

async function createInBatches(token, cases) {
  const created = [];
  for (let index = 0; index < cases.length; index += 10) {
    const batch = cases.slice(index, index + 10);
    try {
      const payload = await qase(token, 'POST', `/case/${PROJECT}/bulk`, { cases: batch });
      created.push(...(payload.result?.ids ?? payload.result ?? []));
    } catch (error) {
      const message = String(error.message ?? error);
      if (!message.includes('422') || !batch.some((item) => Object.hasOwn(item, 'automation'))) throw error;
      const fallback = batch.map(({ automation, ...rest }) => rest);
      const payload = await qase(token, 'POST', `/case/${PROJECT}/bulk`, { cases: fallback });
      created.push(...(payload.result?.ids ?? payload.result ?? []));
    }
  }
  return created;
}

const tests = collectTests();
if (tests.length === 0) throw new Error('No spec tests were parsed.');

if (DRY_RUN) {
  console.log(JSON.stringify({
    tests: tests.length,
    skipped: tests.filter((item) => item.skipped).length,
    titles: tests.map((item) => `${requirementId(item.describes)}: ${item.title}`),
  }, null, 2));
} else {
  const token = loadToken();
  const suiteId = await ensureSuite(token);
  const layers = await layerIds(token);
  const present = await existingTitles(token, suiteId);
  const cases = tests
    .map((item) => toQaseCase(item, suiteId, layers.api))
    .filter((item) => !present.has(item.title));
  const ids = cases.length > 0 ? await createInBatches(token, cases) : [];
  const suite = await qase(token, 'GET', `/suite/${PROJECT}/${suiteId}`);
  const sampleId = ids[0];
  const sample = sampleId ? await qase(token, 'GET', `/case/${PROJECT}/${sampleId}`) : null;
  console.log(JSON.stringify({
    suiteId,
    suiteTitle: suite.result?.title,
    suiteCases: suite.result?.cases_count,
    parsed: tests.length,
    created: ids.length,
    skippedExisting: tests.length - cases.length,
    layerOptions: layers.options,
    sample: sample && {
      id: sample.result?.id,
      title: sample.result?.title,
      suite_id: sample.result?.suite_id,
      priority: sample.result?.priority,
      layer: sample.result?.layer,
      behavior: sample.result?.behavior,
      isManual: sample.result?.isManual,
      steps: sample.result?.steps?.length,
    },
  }, null, 2));
}
