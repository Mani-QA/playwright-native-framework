import fs from 'fs';
import path from 'path';

/**
 * Read the Qase token from the environment or a local .env file.
 * The value is never logged.
 */
export function loadQaseToken(): string | undefined {
  const fromEnv = process.env.QASE_TESTOPS_API_TOKEN || process.env.QASE_API_TOKEN;
  if (fromEnv?.trim()) return fromEnv.trim();

  const candidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '..', '.env'),
  ];

  for (const envPath of candidates) {
    if (!fs.existsSync(envPath)) continue;
    const match = fs.readFileSync(envPath, 'utf8').match(/^QASEToken=(.+)$/m);
    const value = match?.[1]?.trim().replace(/^['"]|['"]$/g, '');
    if (value) return value;
  }

  return undefined;
}
