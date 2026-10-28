import type { Game } from '@/app/games';
import type { Team } from '@/app/teams';

export type AuditEntry = {
  id: string;
  at: string;
  who: string;
  teamId: number;
  teamName: string;
  gameId: number | null;
  label: string;
  from: number;
  to: number;
  reason?: string;
};

export type RaceState = {
  games: Game[];
  teams: Team[];
  audit: AuditEntry[];
  freezeTop3: boolean;
  banner: string | null;
};
