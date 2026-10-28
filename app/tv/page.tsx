'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Trophy, Flag } from 'lucide-react';
import { initialTeams, Team } from '../teams';
import { games as initialGames, Game } from '../games';
import PublicLogo from '../public-logo';
import CircuitMark from '../circuit-mark';


export default function TvPage() {
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [games, setGames] = useState<Game[]>(initialGames);
  const [tick, setTick] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const response = await fetch('/api/scores', { cache: 'no-store', signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw Error();
      const data = await response.json() as { games: Game[]; teams: Team[] };
      const scores = new Map(data.teams.map((team) => [team.id, team]));
      setTeams(initialTeams.map((team) => {
        const live = scores.get(team.id);
        return { ...team, score: live?.score ?? 0, updated_at: live?.updated_at ?? null, game_scores: live?.game_scores ?? [] };
      }));
      setGames(initialGames);
      setLoaded(true);
    } catch {
      /* keep last good frame */
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    const first = window.setTimeout(refresh, 0);
    const timer = window.setInterval(refresh, 8000);
    return () => { clearTimeout(first); clearInterval(timer); };
  }, [refresh]);

  useEffect(() => {
    const timer = window.setInterval(() => setTick((value) => value + 1), 4000);
    return () => clearInterval(timer);
  }, []);

  const sorted = useMemo(
    () => [...teams].sort((a, b) => b.score - a.score || a.id - b.id),
    [teams],
  );
  const podium = sorted.slice(0, 3);
  const tickerItems = useMemo(() => {
    const lines: string[] = [];
    for (const team of sorted.slice(0, 8)) {
      lines.push(`P${sorted.indexOf(team) + 1} ${team.name} — ${team.score} pts`);
    }
    for (const game of games.slice(0, 4)) {
      const leader = [...teams].sort((a, b) => {
        const as = a.game_scores.find((g) => g.game_id === game.id)?.score ?? 0;
        const bs = b.game_scores.find((g) => g.game_id === game.id)?.score ?? 0;
        return bs - as;
      })[0];
      if (leader) lines.push(`${game.stage}: лидер ${leader.name}`);
    }
    lines.push('TRACK: TOKYO BAY CYBER CIRCUIT // NIGHT MODE', 'スタダ・グランプリ 2026');
    return lines;
  }, [sorted, teams, games]);

  const scrollOffset = (tick % Math.max(sorted.length - 6, 1));

  return (
    <main className="tv-screen race-tv nt-tv" aria-label="Live tv">
      <header className="tv-top">
        <PublicLogo/>
        <div className="tv-title">
          <p><span className="tv-feed-dot"/>{loaded ? 'LIVE TIMING' : 'CONNECTING'}<span>Live tv / 2026</span></p>
          <h1>NEO TOKYO <span>GRAND PRIX</span></h1>
        </div>
        <div className="tv-circuit"><CircuitMark/><span>TOKYO BAY<small>NIGHT CIRCUIT</small></span></div>
        <Link className="tv-exit" href="/">На сайт<ArrowUpRight size={15}/></Link>
      </header>

      <div className="tv-section-label"><span>01 / THE FRONT RUNNERS</span><span>STADA MOTORSPORT · 東京</span></div>
      <section className="tv-podium" aria-label="Топ-3">
        {[podium[1], podium[0], podium[2]].map((team, visualIndex) => {
          const place = visualIndex === 0 ? 2 : visualIndex === 1 ? 1 : 3;
          if (!team) return <div key={place} className={`tv-podium-slot place-${place} is-empty`}/>;
          return (
            <article key={team.id} className={`tv-podium-slot place-${place}`}>
              <span className="tv-place">P{place}<small>{place === 1 ? 'POLE POSITION' : 'FRONT RUNNER'}</small></span>
              <strong>{team.name}</strong>
              <em>{loaded ? team.score : '—'}<small>PTS</small></em>
              {place === 1 && <Trophy size={22}/>}
            </article>
          );
        })}
      </section>

      <section className="tv-standings" aria-label="Полный рейтинг">
        <div className="tv-standings-head"><span><Flag size={15}/>ПОЛНЫЙ РЕЙТИНГ / 14 СКАУДЕРИЙ</span><span>PTS</span></div>
        <ol className="tv-standings-list" style={{ transform: `translateY(-${scrollOffset * 52}px)` }}>
          {sorted.map((team, index) => (
            <li key={team.id} className={index < 3 ? 'is-podium' : undefined}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{team.name}</strong>
              <em>{loaded ? team.score : '—'}</em>
            </li>
          ))}
        </ol>
      </section>

      <div className="tv-ticker" aria-hidden="true">
        <div className="tv-ticker-track">
          {[...tickerItems, ...tickerItems].map((line, index) => (
            <span key={`${line}-${index}`}>{line}</span>
          ))}
        </div>
      </div>
    </main>
  );
}
