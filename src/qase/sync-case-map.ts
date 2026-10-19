import fs from 'fs';
import path from 'path';
import { loadQaseToken } from './token';

const API = 'https://api.qase.io/v1';
const PROJECT = 'QADEMO';
const AUTOMATION_SUITE = 'QADemo Automation';
const MANUAL_SUITE = 'eCommerce';

/** Written before workers start. Gitignored with playwright/.cache. */
export const QASE_CASE_MAP_PATH = path.join(process.cwd(), 'playwright', '.cache', 'qase-case-map.json');

type QaseSuite = { id?: number; title?: string };
type QaseCase = { id?: number; title?: string; suite_id?: number };

/** Adds one suite to the title map. Automation titles stay in place when a manual title matches. */
async function addSuiteCases(
  headers: { Token: string; Accept: string },
  suiteId: number,
  map: Record<string, number>,
  overwrite: boolean,
): Promise<number | undefined> {
  let added = 0;
  let offset = 0;
  for (;;) {
    const response = await fetch(
      `${API}/case/${PROJECT}?suite_id=${suiteId}&limit=100&offset=${offset}`,
      { headers },
    );
    if (!response.ok) {
      console.warn(`Qase case list failed (${response.status}). This run will not link results.`);
      return undefined;
    }

    const payload = (await response.json()) as { result?: { entities?: QaseCase[] } };
    const entities = payload.result?.entities ?? [];
    for (const entity of entities) {
      if (entity.suite_id !== suiteId || !entity.title || typeof entity.id !== 'number') continue;
      if (!overwrite && map[entity.title] !== undefined) continue;
      map[entity.title] = entity.id;
      added += 1;
    }
    if (entities.length < 100) break;
    offset += entities.length;
  }
  return added;
}

/**
 * Download QADemo Automation case ids so each spec can report against its Qase case.
 * A missing token or a Qase error leaves the previous map untouched and does not fail the run.
 */
export async function syncQaseCaseMap(): Promise<void> {
  const token = loadQaseToken();
  if (!token) return;

  try {
    const headers = { Token: token, Accept: 'application/json' };
    const suiteResponse = await fetch(`${API}/suite/${PROJECT}?limit=100`, { headers });
    if (!suiteResponse.ok) {
      console.warn(`Qase suite list failed (${suiteResponse.status}). This run will not link results.`);
      return;
    }

    const suitePayload = (await suiteResponse.json()) as { result?: { entities?: QaseSuite[] } };
    const suites = suitePayload.result?.entities ?? [];
    const automation = suites.find((item) => item.title === AUTOMATION_SUITE);
    if (!automation?.id) {
      console.warn('Qase suite "QADemo Automation" was not found. This run will not link results.');
      return;
    }

    const map: Record<string, number> = {};
    const automationCount = await addSuiteCases(headers, automation.id, map, true);
    if (automationCount === undefined) return;

    const manual = suites.find((item) => item.title === MANUAL_SUITE);
    const manualCount = manual?.id ? await addSuiteCases(headers, manual.id, map, false) : 0;
    if (manualCount === undefined) return;

    fs.mkdirSync(path.dirname(QASE_CASE_MAP_PATH), { recursive: true });
    fs.writeFileSync(QASE_CASE_MAP_PATH, JSON.stringify(map));
    console.log(
      `Linked ${automationCount} Qase cases from ${AUTOMATION_SUITE} and ${manualCount ?? 0} manual titles that are not already automated.`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.warn(`Qase case map was not updated. This run will not link results. ${message}`);
  }
}
