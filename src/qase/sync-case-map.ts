import fs from 'fs';
import path from 'path';
import { loadQaseToken } from './token';

const API = 'https://api.qase.io/v1';
const PROJECT = 'QADEMO';
const SUITE_TITLE = 'QADemo Automation';

/** Written before workers start. Gitignored with playwright/.cache. */
export const QASE_CASE_MAP_PATH = path.join(process.cwd(), 'playwright', '.cache', 'qase-case-map.json');

type QaseSuite = { id?: number; title?: string };
type QaseCase = { id?: number; title?: string; suite_id?: number };

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
    const suite = (suitePayload.result?.entities ?? []).find((item) => item.title === SUITE_TITLE);
    if (!suite?.id) {
      console.warn('Qase suite "QADemo Automation" was not found. This run will not link results.');
      return;
    }

    const map: Record<string, number> = {};
    let offset = 0;
    for (;;) {
      const response = await fetch(
        `${API}/case/${PROJECT}?suite_id=${suite.id}&limit=100&offset=${offset}`,
        { headers },
      );
      if (!response.ok) {
        console.warn(`Qase case list failed (${response.status}). This run will not link results.`);
        return;
      }

      const payload = (await response.json()) as { result?: { entities?: QaseCase[] } };
      const entities = payload.result?.entities ?? [];
      for (const entity of entities) {
        if (entity.suite_id === suite.id && entity.title && typeof entity.id === 'number') {
          map[entity.title] = entity.id;
        }
      }
      if (entities.length < 100) break;
      offset += entities.length;
    }

    fs.mkdirSync(path.dirname(QASE_CASE_MAP_PATH), { recursive: true });
    fs.writeFileSync(QASE_CASE_MAP_PATH, JSON.stringify(map));
    console.log(`Linked ${Object.keys(map).length} Qase cases from ${SUITE_TITLE}.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.warn(`Qase case map was not updated. This run will not link results. ${message}`);
  }
}
