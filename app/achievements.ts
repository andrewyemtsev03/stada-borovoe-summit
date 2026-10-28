import type { Team } from './teams';
import type { Game } from './games';

export type AchievementId = 'purple' | 'fire' | 'consistency' | 'overtake';

export type Achievement = {
  id: AchievementId;
  label: string;
  title: string;
};

export const ACHIEVEMENTS: Record<AchievementId, Achievement> = {
  purple: { id: 'purple', label: '⚡ PURPLE SECTOR', title: 'Рекорд одного сектора' },
  fire: { id: 'fire', label: '🔥 ON FIRE', title: 'Больше всего побед в секторах' },
  consistency: { id: 'consistency', label: '🎯 CONSISTENCY KING', title: 'Стабильность по всем секторам' },
  overtake: { id: 'overtake', label: '🚀 OVERTAKE MASTER', title: 'Максимум обгонов лидера по секторам' },
};

function sectorScore(team: Team, gameId: number) {
  return team.game_scores.find((entry) => entry.game_id === gameId)?.score ?? 0;
}

/** Auto-compute racing badges from live sector telemetry. */
export function computeAchievements(teams: Team[], games: Game[]): Map<number, Achievement[]> {
  const result = new Map<number, Achievement[]>();
  const award = (teamId: number, id: AchievementId) => {
    const list = result.get(teamId) ?? [];
    if (!list.some((item) => item.id === id)) list.push(ACHIEVEMENTS[id]);
    result.set(teamId, list);
  };

  if (!teams.length || !games.length) return result;
  const active = teams.filter((team) => team.score > 0 || team.game_scores.some((g) => g.score > 0));
  if (!active.length) return result;

  // ⚡ PURPLE SECTOR — absolute best single-sector score
  let bestSector = -1;
  let purpleIds: number[] = [];
  for (const team of active) {
    for (const game of games) {
      const score = sectorScore(team, game.id);
      if (score > bestSector) {
        bestSector = score;
        purpleIds = [team.id];
      } else if (score === bestSector && score > 0) {
        purpleIds.push(team.id);
      }
    }
  }
  purpleIds.forEach((id) => award(id, 'purple'));

  // 🔥 ON FIRE — most sector wins (ties share)
  const wins = new Map<number, number>();
  for (const game of games) {
    let top = -1;
    let winners: number[] = [];
    for (const team of active) {
      const score = sectorScore(team, game.id);
      if (score > top) {
        top = score;
        winners = [team.id];
      } else if (score === top && score > 0) {
        winners.push(team.id);
      }
    }
    if (top > 0) winners.forEach((id) => wins.set(id, (wins.get(id) ?? 0) + 1));
  }
  const maxWins = Math.max(0, ...wins.values());
  if (maxWins > 0) {
    for (const [id, count] of wins) if (count === maxWins) award(id, 'fire');
  }

  // 🎯 CONSISTENCY KING — scored in most sectors with lowest variance
  type Stat = { id: number; count: number; variance: number };
  const stats: Stat[] = active.map((team) => {
    const scores = games.map((game) => sectorScore(team, game.id));
    const nonzero = scores.filter((score) => score > 0);
    const count = nonzero.length;
    const mean = count ? nonzero.reduce((a, b) => a + b, 0) / count : 0;
    const variance = count > 1
      ? nonzero.reduce((sum, score) => sum + (score - mean) ** 2, 0) / count
      : Number.POSITIVE_INFINITY;
    return { id: team.id, count, variance };
  }).filter((stat) => stat.count >= Math.min(5, games.length));

  if (stats.length) {
    const bestCount = Math.max(...stats.map((stat) => stat.count));
    const pool = stats.filter((stat) => stat.count === bestCount);
    const bestVar = Math.min(...pool.map((stat) => stat.variance));
    pool.filter((stat) => stat.variance === bestVar).forEach((stat) => award(stat.id, 'consistency'));
  }

  // 🚀 OVERTAKE MASTER — most sectors beating the overall leader
  const sorted = [...active].sort((a, b) => b.score - a.score || a.id - b.id);
  const leader = sorted[0];
  if (leader) {
    const overtake = new Map<number, number>();
    for (const team of active) {
      if (team.id === leader.id) continue;
      let beats = 0;
      for (const game of games) {
        if (sectorScore(team, game.id) > sectorScore(leader, game.id)) beats += 1;
      }
      overtake.set(team.id, beats);
    }
    const maxBeats = Math.max(0, ...overtake.values());
    if (maxBeats > 0) {
      for (const [id, count] of overtake) if (count === maxBeats) award(id, 'overtake');
    }
  }

  return result;
}
