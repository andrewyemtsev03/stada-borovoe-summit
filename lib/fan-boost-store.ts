import 'server-only';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'fan-boosts.json');

export type BoostMap = Record<string, number>;

let memory: BoostMap | null = null;
let writeQueue: Promise<void> = Promise.resolve();

async function ensureLoaded(): Promise<BoostMap> {
  if (memory) return memory;
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    memory = JSON.parse(raw) as BoostMap;
  } catch {
    memory = {};
  }
  return memory!;
}

async function persist(next: BoostMap) {
  memory = next;
  writeQueue = writeQueue.then(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(next, null, 2), 'utf8');
  });
  await writeQueue;
}

export async function getBoosts(): Promise<BoostMap> {
  return { ...(await ensureLoaded()) };
}

export async function addBoost(teamId: number): Promise<BoostMap> {
  if (!Number.isInteger(teamId) || teamId < 1 || teamId > 14) {
    throw new Error('Invalid team');
  }
  const current = await ensureLoaded();
  const key = String(teamId);
  const next = { ...current, [key]: (current[key] ?? 0) + 1 };
  await persist(next);
  return next;
}
