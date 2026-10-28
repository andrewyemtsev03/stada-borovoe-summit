'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Swords, X } from 'lucide-react';
import type { Team } from './teams';
import type { Game } from './games';

function sectorScore(team: Team, gameId: number) {
  return team.game_scores.find((entry) => entry.game_id === gameId)?.score ?? 0;
}

export default function H2HDuel({ teams, games }: { teams: Team[]; games: Game[] }) {
  const [open, setOpen] = useState(false);
  const [leftId, setLeftId] = useState<number>(teams[0]?.id ?? 1);
  const [rightId, setRightId] = useState<number>(teams[1]?.id ?? 2);

  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const dialog = dialogRef.current;
    dialog?.querySelector<HTMLButtonElement>('button')?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
      if (event.key !== 'Tab' || !dialog) return;
      const controls = Array.from(dialog.querySelectorAll<HTMLElement>('button, select'));
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus();
    };
  }, [open]);

  const left = teams.find((team) => team.id === leftId) ?? teams[0];
  const right = teams.find((team) => team.id === rightId) ?? teams[1];

  const comparison = useMemo(() => {
    if (!left || !right) return null;
    const rows = games.map((game) => {
      const a = sectorScore(left, game.id);
      const b = sectorScore(right, game.id);
      const max = Math.max(a, b, 1);
      return { game, a, b, max, winner: a === b ? 0 : a > b ? 1 : 2 };
    });
    const winsA = rows.filter((row) => row.winner === 1).length;
    const winsB = rows.filter((row) => row.winner === 2).length;
    const gap = left.score - right.score;
    return { rows, winsA, winsB, gap };
  }, [left, right, games]);

  return <>
    <button className="h2h-open find-me-button" type="button" onClick={() => setOpen(true)}>
      <Swords size={15}/>Дуэль болидов
    </button>
    {open && left && right && comparison && <div className="h2h-overlay" role="dialog" aria-modal="true" aria-labelledby="h2h-title">
      <div className="h2h-dialog" ref={dialogRef}>
        <header className="h2h-header">
          <div>
            <p className="eyebrow">HEAD-TO-HEAD · テレメトリー</p>
            <h2 id="h2h-title">Дуэль болидов</h2>
          </div>
          <button type="button" className="finder-close" aria-label="Закрыть" onClick={() => setOpen(false)}><X size={18}/></button>
        </header>
        <div className="h2h-pickers">
          <label>Команда A
            <select value={leftId} onChange={(event) => setLeftId(Number(event.target.value))}>
              {teams.map((team) => <option key={team.id} value={team.id} disabled={team.id === rightId}>{team.name}</option>)}
            </select>
          </label>
          <span className="h2h-vs">VS</span>
          <label>Команда B
            <select value={rightId} onChange={(event) => setRightId(Number(event.target.value))}>
              {teams.map((team) => <option key={team.id} value={team.id} disabled={team.id === leftId}>{team.name}</option>)}
            </select>
          </label>
        </div>
        <div className="h2h-summary">
          <div><small>Итого A</small><strong>{left.score}</strong></div>
          <div><small>Разрыв</small><strong className={comparison.gap === 0 ? '' : comparison.gap > 0 ? 'is-plus' : 'is-minus'}>{comparison.gap > 0 ? '+' : ''}{comparison.gap}</strong></div>
          <div><small>Итого B</small><strong>{right.score}</strong></div>
          <div><small>Секторы</small><strong>{comparison.winsA} : {comparison.winsB}</strong></div>
        </div>
        <ul className="h2h-sectors">
          {comparison.rows.map((row) => <li key={row.game.id}>
            <div className="h2h-sector-meta"><small>{row.game.stage}</small><span>{row.game.name}</span></div>
            <div className="h2h-bars">
              <div className="h2h-bar-row">
                <strong>{row.a}</strong>
                <div className="h2h-bar-track"><span className={`h2h-bar left ${row.winner === 1 ? 'is-win' : ''}`} style={{ width: `${(row.a / row.max) * 100}%` }}/></div>
              </div>
              <div className="h2h-bar-row">
                <div className="h2h-bar-track"><span className={`h2h-bar right ${row.winner === 2 ? 'is-win' : ''}`} style={{ width: `${(row.b / row.max) * 100}%` }}/></div>
                <strong>{row.b}</strong>
              </div>
            </div>
          </li>)}
        </ul>
      </div>
    </div>}
  </>;
}
