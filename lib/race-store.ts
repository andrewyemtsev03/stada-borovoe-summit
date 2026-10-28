import 'server-only';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { games as defaultGames } from '@/app/games';
import { teamRosters, type Team } from '@/app/teams';
import type { AuditEntry, RaceState } from '@/lib/race-types';

export type { AuditEntry, RaceState } from '@/lib/race-types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'race-state.json');

let memory: RaceState | null = null;
let queue: Promise<void> = Promise.resolve();

function emptyTeams(): Team[] {
  return teamRosters.map((roster) => ({
    id: roster.id,
    name: roster.name,
    score: 0,
    updated_at: null,
    game_scores: defaultGames.map((game) => ({ game_id: game.id, score: 0, updated_at: null })),
  }));
}

/** Deterministic-ish demo spread so all 14 teams have telemetry. */
export function buildDemoState(): RaceState {
  const base = [
    [28, 22, 30, 25, 18, 35, 20, 40, 32],
    [24, 26, 21, 29, 27, 20, 24, 35, 28],
    [30, 18, 27, 22, 31, 28, 19, 38, 30],
    [21, 25, 24, 28, 22, 26, 30, 33, 25],
    [26, 20, 29, 24, 25, 22, 27, 36, 29],
    [32, 28, 33, 30, 29, 34, 31, 42, 34], // Shinjuku-ish leader pattern
    [27, 23, 26, 27, 24, 29, 25, 37, 31],
    [19, 21, 20, 23, 18, 22, 21, 30, 24],
    [25, 24, 28, 26, 23, 27, 26, 34, 27],
    [29, 27, 31, 28, 30, 32, 28, 39, 33],
    [28, 26, 30, 29, 28, 31, 27, 38, 32],
    [22, 23, 25, 24, 21, 25, 23, 32, 26],
    [27, 25, 28, 27, 26, 28, 26, 36, 30],
    [20, 19, 22, 21, 20, 23, 22, 31, 25],
  ];
  const now = new Date().toISOString();
  const teams = teamRosters.map((roster, index) => {
    const scores = base[index] ?? base[0];
    const game_scores = defaultGames.map((game, gi) => ({
      game_id: game.id,
      score: scores[gi] ?? 0,
      updated_at: now,
    }));
    const score = game_scores.reduce((sum, entry) => sum + entry.score, 0);
    return { id: roster.id, name: roster.name, score, updated_at: now, game_scores };
  });
  return {
    games: defaultGames,
    teams,
    audit: [{
      id: `seed-${Date.now()}`,
      at: now,
      who: 'Race Control',
      teamId: 0,
      teamName: 'ALL',
      gameId: null,
      label: 'Load Demo Scores',
      from: 0,
      to: teams.reduce((s, t) => s + t.score, 0),
      reason: 'Демо-телеметрия Neo-Tokyo GP',
    }],
    freezeTop3: false,
    banner: null,
  };
}

function recompute(team: Team): Team {
  const score = (team.game_scores ?? []).reduce((sum, entry) => sum + (entry.score || 0), 0);
  return { ...team, score, name: teamRosters.find((r) => r.id === team.id)?.name ?? team.name };
}

function normalize(state: RaceState): RaceState {
  const games = defaultGames;
  const byId = new Map(state.teams.map((team) => [team.id, team]));
  const teams = teamRosters.map((roster) => {
    const existing = byId.get(roster.id);
    const game_scores = games.map((game) => {
      const found = existing?.game_scores?.find((entry) => entry.game_id === game.id);
      return { game_id: game.id, score: found?.score ?? 0, updated_at: found?.updated_at ?? null };
    });
    return recompute({
      id: roster.id,
      name: roster.name,
      score: 0,
      updated_at: existing?.updated_at ?? null,
      game_scores,
    });
  });
  return {
    games,
    teams,
    audit: Array.isArray(state.audit) ? state.audit.slice(0, 400) : [],
    freezeTop3: Boolean(state.freezeTop3),
    banner: typeof state.banner === 'string' && state.banner.trim() ? state.banner.trim() : null,
  };
}

async function persist(next: RaceState) {
  memory = next;
  queue = queue.then(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(next, null, 2), 'utf8');
  });
  await queue;
}

export async function loadRaceState(): Promise<RaceState> {
  if (memory) return memory;
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    memory = normalize(JSON.parse(raw) as RaceState);
  } catch {
    memory = buildDemoState();
    await persist(memory);
  }
  return memory!;
}

async function mutate(fn: (state: RaceState) => RaceState): Promise<RaceState> {
  const current = await loadRaceState();
  const next = normalize(fn(structuredClone(current)));
  await persist(next);
  return next;
}

function pushAudit(state: RaceState, entry: Omit<AuditEntry, 'id' | 'at'> & { id?: string; at?: string }) {
  const item: AuditEntry = {
    id: entry.id ?? `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: entry.at ?? new Date().toISOString(),
    who: entry.who,
    teamId: entry.teamId,
    teamName: entry.teamName,
    gameId: entry.gameId,
    label: entry.label,
    from: entry.from,
    to: entry.to,
    reason: entry.reason,
  };
  state.audit = [item, ...state.audit].slice(0, 400);
}

export async function getPublicScoreboard() {
  const state = await loadRaceState();
  let teams = state.teams;
  if (state.freezeTop3) {
    const ranked = [...teams].sort((a, b) => b.score - a.score || a.id - b.id);
    const topIds = new Set(ranked.slice(0, 3).map((team) => team.id));
    teams = teams.map((team) => {
      if (!topIds.has(team.id)) return team;
      return {
        ...team,
        score: -1,
        game_scores: team.game_scores.map((entry) => ({ ...entry, score: -1 })),
        updated_at: team.updated_at,
      };
    });
  }
  return {
    games: state.games,
    teams,
    freezeTop3: state.freezeTop3,
    banner: state.banner,
  };
}

export async function getAdminScoreboard() {
  return loadRaceState();
}

export async function setCell(opts: {
  teamId: number; gameId: number; score: number; who: string; reason?: string;
}) {
  const score = Math.max(0, Math.min(1_000_000, Math.trunc(opts.score)));
  return mutate((state) => {
    const team = state.teams.find((entry) => entry.id === opts.teamId);
    const game = state.games.find((entry) => entry.id === opts.gameId);
    if (!team || !game) throw new Error('Команда или сектор не найдены');
    const current = team.game_scores.find((entry) => entry.game_id === opts.gameId);
    const from = current?.score ?? 0;
    const now = new Date().toISOString();
    team.game_scores = state.games.map((g) => {
      if (g.id !== opts.gameId) {
        return team.game_scores.find((entry) => entry.game_id === g.id)
          ?? { game_id: g.id, score: 0, updated_at: null };
      }
      return { game_id: g.id, score, updated_at: now };
    });
    Object.assign(team, recompute(team), { updated_at: now });
    pushAudit(state, {
      who: opts.who,
      teamId: team.id,
      teamName: team.name,
      gameId: game.id,
      label: `${game.stage} · ${game.name}`,
      from,
      to: score,
      reason: opts.reason,
    });
    return state;
  });
}

export async function setManyCells(opts: {
  changes: { teamId: number; gameId: number; score: number }[];
  who: string;
}) {
  return mutate((state) => {
    const now = new Date().toISOString();
    for (const change of opts.changes) {
      const team = state.teams.find((entry) => entry.id === change.teamId);
      const game = state.games.find((entry) => entry.id === change.gameId);
      if (!team || !game) continue;
      const score = Math.max(0, Math.min(1_000_000, Math.trunc(change.score)));
      const from = team.game_scores.find((entry) => entry.game_id === change.gameId)?.score ?? 0;
      if (from === score) continue;
      team.game_scores = state.games.map((g) => {
        const prev = team.game_scores.find((entry) => entry.game_id === g.id);
        if (g.id !== change.gameId) return prev ?? { game_id: g.id, score: 0, updated_at: null };
        return { game_id: g.id, score, updated_at: now };
      });
      Object.assign(team, recompute(team), { updated_at: now });
      pushAudit(state, {
        who: opts.who,
        teamId: team.id,
        teamName: team.name,
        gameId: game.id,
        label: `${game.stage} · ${game.name}`,
        from,
        to: score,
        reason: 'Batch save',
      });
    }
    return state;
  });
}

export async function applyBonus(opts: {
  teamId: number; delta: number; reason: string; who: string; gameId?: number;
}) {
  return mutate((state) => {
    const team = state.teams.find((entry) => entry.id === opts.teamId);
    if (!team) throw new Error('Команда не найдена');
    const gameId = opts.gameId ?? state.games[0]?.id ?? 1;
    const game = state.games.find((entry) => entry.id === gameId) ?? state.games[0];
    const now = new Date().toISOString();
    const current = team.game_scores.find((entry) => entry.game_id === game.id)?.score ?? 0;
    const next = Math.max(0, Math.min(1_000_000, current + Math.trunc(opts.delta)));
    team.game_scores = state.games.map((g) => {
      const prev = team.game_scores.find((entry) => entry.game_id === g.id);
      if (g.id !== game.id) return prev ?? { game_id: g.id, score: 0, updated_at: null };
      return { game_id: g.id, score: next, updated_at: now };
    });
    Object.assign(team, recompute(team), { updated_at: now });
    pushAudit(state, {
      who: opts.who,
      teamId: team.id,
      teamName: team.name,
      gameId: game.id,
      label: `Bonus/Penalty → ${game.stage}`,
      from: current,
      to: next,
      reason: opts.reason,
    });
    return state;
  });
}

export async function setControls(opts: { freezeTop3?: boolean; banner?: string | null; who: string }) {
  return mutate((state) => {
    if (typeof opts.freezeTop3 === 'boolean') state.freezeTop3 = opts.freezeTop3;
    if (opts.banner !== undefined) state.banner = opts.banner?.trim() ? opts.banner.trim() : null;
    pushAudit(state, {
      who: opts.who,
      teamId: 0,
      teamName: 'CONTROL',
      gameId: null,
      label: 'Live controls',
      from: 0,
      to: state.freezeTop3 ? 1 : 0,
      reason: `freeze=${state.freezeTop3}; banner=${state.banner ?? '—'}`,
    });
    return state;
  });
}

export async function loadDemo(who: string) {
  const demo = buildDemoState();
  demo.audit[0].who = who;
  await persist(demo);
  return demo;
}

export async function resetScores(who: string) {
  const blank: RaceState = {
    games: defaultGames,
    teams: emptyTeams(),
    audit: [],
    freezeTop3: false,
    banner: null,
  };
  pushAudit(blank, {
    who,
    teamId: 0,
    teamName: 'ALL',
    gameId: null,
    label: 'Reset',
    from: 0,
    to: 0,
    reason: 'Сброс демо-данных',
  });
  await persist(blank);
  return blank;
}

export async function undoLast(who: string) {
  return mutate((state) => {
    const last = state.audit.find((entry) => entry.gameId != null && entry.teamId > 0);
    if (!last || last.gameId == null) throw new Error('Нечего отменять');
    const team = state.teams.find((entry) => entry.id === last.teamId);
    const game = state.games.find((entry) => entry.id === last.gameId);
    if (!team || !game) throw new Error('Запись аудита устарела');
    const now = new Date().toISOString();
    const current = team.game_scores.find((entry) => entry.game_id === game.id)?.score ?? 0;
    team.game_scores = state.games.map((g) => {
      const prev = team.game_scores.find((entry) => entry.game_id === g.id);
      if (g.id !== game.id) return prev ?? { game_id: g.id, score: 0, updated_at: null };
      return { game_id: g.id, score: last.from, updated_at: now };
    });
    Object.assign(team, recompute(team), { updated_at: now });
    state.audit = state.audit.filter((entry) => entry.id !== last.id);
    pushAudit(state, {
      who,
      teamId: team.id,
      teamName: team.name,
      gameId: game.id,
      label: `Undo · ${game.stage}`,
      from: current,
      to: last.from,
      reason: `Отмена ${last.id}`,
    });
    return state;
  });
}

export function toCsv(state: RaceState) {
  const header = ['team_id', 'team_name', 'total', ...state.games.map((game) => `g${game.id}_${game.stage.replace(/\s+/g, '_')}`)];
  const rows = state.teams.map((team) => [
    team.id,
    `"${team.name.replaceAll('"', '""')}"`,
    team.score,
    ...state.games.map((game) => team.game_scores.find((entry) => entry.game_id === game.id)?.score ?? 0),
  ].join(','));
  return [header.join(','), ...rows].join('\n');
}
