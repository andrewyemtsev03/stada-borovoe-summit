'use client';
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {ArrowUpRight,ChevronDown,Flame,RefreshCw,Search,Trophy} from 'lucide-react';
import PublicShell from './public-shell';
import PublicHeading from './public-heading';
import H2HDuel from './h2h-duel';
import {useParticipant} from './participant-context';
import {initialTeams,Team} from './teams';
import {games as initialGames,Game} from './games';
import {computeAchievements} from './achievements';
const BOOST_USED_KEY = 'stada-neo-tokyo-fan-boost-used-v1';

export default function Board() {
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const { participant, openFinder } = useParticipant();
  const selectedTeamId = participant?.teamId ?? null;
  const selectedParticipant = participant?.name ?? '';
  const [games, setGames] = useState<Game[]>(initialGames);
  const [expandedTeamId, setExpandedTeamId] = useState<number | null>(null);
  const [boosts, setBoosts] = useState<Record<string, number>>({});
  const [boostUsed, setBoostUsed] = useState(false);
  const [boostBusy, setBoostBusy] = useState(false);
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
        return { ...team, name: team.name, score: live?.score ?? 0, updated_at: live?.updated_at ?? null, game_scores: live?.game_scores ?? [] };
      }));
      setGames(initialGames);
      setLoaded(true);
      setError(false);
    } catch {
      setError(true);
    } finally {
      inFlight.current = false;
    }
  }, []);

  const refreshBoosts = useCallback(async () => {
    try {
      const response = await fetch('/api/boosts', { cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json() as { boosts?: Record<string, number> };
      setBoosts(data.boosts ?? {});
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    try { setBoostUsed(localStorage.getItem(BOOST_USED_KEY) === '1'); } catch { /* ignore */ }
    const firstLoad = window.setTimeout(() => { void refresh(); void refreshBoosts(); }, 0);
    const tick = () => {
      if (document.visibilityState === 'visible') {
        void refresh();
        void refreshBoosts();
      }
    };
    const timer = setInterval(tick, 10000);
    document.addEventListener('visibilitychange', tick);
    return () => { clearTimeout(firstLoad); clearInterval(timer); document.removeEventListener('visibilitychange', tick); };
  }, [refresh, refreshBoosts]);

  useEffect(() => {
    if (!selectedTeamId) return;
    const timer = window.setTimeout(() => setExpandedTeamId(selectedTeamId), 0);
    return () => clearTimeout(timer);
  }, [selectedTeamId]);

  const visibleScore = (score: number) => (score < 0 ? null : score);
  const sorted = [...teams].sort((a, b) => {
    if (a.score < 0 && b.score < 0) return a.id - b.id;
    if (a.score < 0) return 1;
    if (b.score < 0) return -1;
    return b.score - a.score || a.id - b.id;
  });
  const started = teams.some((team) => team.score > 0);
  const max = Math.max(0, ...teams.map((team) => (team.score < 0 ? 0 : team.score)));
  const leaders = teams.filter((team) => team.score === max && team.score > 0);
  const achievements = useMemo(() => computeAchievements(teams, games), [teams, games]);

  async function boostTeam(teamId: number) {
    if (boostUsed || boostBusy) return;
    setBoostBusy(true);
    try {
      const response = await fetch('/api/boosts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId }),
      });
      const data = await response.json() as { boosts?: Record<string, number>; error?: string };
      if (!response.ok) throw new Error(data.error || 'fail');
      setBoosts(data.boosts ?? {});
      localStorage.setItem(BOOST_USED_KEY, '1');
      setBoostUsed(true);
    } catch {
      /* keep prior state */
    } finally {
      setBoostBusy(false);
    }
  }

  return <PublicShell active="leaderboard">
    <main id="main-content" className="nt-page nt-classification">
      <PublicHeading index="01" kicker="LIVE RACE CLASSIFICATION" title="THE LIVE" accent="LEADERBOARD" japanese="ライブランキング" description="Четырнадцать скаудерий. Девять секторов. Результаты обновляются в реальном времени."/>
      <div className="nt-ranking-status"><span className={error?'nt-feed is-error':'nt-feed'}><i/>{error?'CONNECTION LOST':loaded?'LIVE TIMING':'CONNECTING'}<small>10 SEC SYNC</small></span><span>{started?leaders.length===1?`LEADING / ${leaders[0].name}`:`SHARED LEAD / ${leaders.length}`:'FORMATION LAP'}</span></div>
      <section className="nt-podium" aria-label="Лидеры гонки">{sorted.filter(team=>team.score>=0).slice(0,3).map((team,index)=><article className={`nt-podium-card nt-podium-${index+1}`} key={team.id}>
        <div className="nt-podium-top"><span>P{!loaded||!started?'—':sorted.findIndex(entry=>entry.score===team.score)+1}</span><small>{index===0?'POLE POSITION':'FRONT RUNNER'}</small>{index===0&&<Trophy size={19}/>}</div>
        <h2>{team.name}</h2><div className="nt-podium-score"><strong>{loaded?team.score:'—'}</strong><span>POINTS</span><small>SCUDERIA {String(team.id).padStart(2,'0')}</small></div>
      </article>)}</section>
      <div className="nt-ranking-toolbar"><div><h2>Race classification <span>/ 順位</span></h2><p>Нажмите на команду, чтобы открыть результаты по секторам.</p></div><div className="nt-ranking-actions"><H2HDuel teams={sorted} games={games}/><button type="button" className="nt-small-button" onClick={openFinder}><Search size={15}/>{selectedParticipant?'Сменить участника':'Найти себя'}</button></div></div>
      {error&&<div className="nt-connection" role="status"><span>{loaded?'Показываем последние загруженные баллы. Связь восстанавливается.':'Не удалось загрузить баллы. Проверьте соединение.'}</span><button type="button" onClick={refresh}><RefreshCw size={14}/>Повторить</button></div>}
      <div className="nt-ranking-columns" aria-hidden="true"><span>POS</span><span>SCUDERIA</span><span>PACE / LEADER</span><span>POINTS</span><span/></div>
      <ol className="nt-ranking-list" aria-label="Рейтинг 14 команд">{sorted.map(team=>{
        const frozen=team.score<0;
        const rank=started&&!frozen?sorted.findIndex(entry=>entry.score===team.score)+1:null;
        const selected=team.id===selectedTeamId;
        const expanded=expandedTeamId===team.id;
        const badges=frozen?[]:(achievements.get(team.id)??[]);
        const boostCount=boosts[String(team.id)]??0;
        const displayScore=visibleScore(team.score);
        const progress=loaded&&max>0?Math.min(100,Math.max(0,displayScore??0)/max*100):0;
        return <li id={`team-${team.id}`} className={`nt-ranking-entry ${rank===1?'is-leading ':''}${selected?'is-own ':''}${frozen?'is-frozen':''}`} key={team.id}>
          <button type="button" className="nt-ranking-row" aria-expanded={expanded} aria-controls={`team-games-${team.id}`} onClick={()=>setExpandedTeamId(expanded?null:team.id)}>
            <span className="nt-rank">{frozen?'??':rank===null?'—':String(rank).padStart(2,'0')}</span>
            <span className="nt-ranking-team"><small>SCUDERIA {String(team.id).padStart(2,'0')}{selected&&<b>YOUR TEAM</b>}</small><strong>{team.name}</strong>{badges.length>0&&<span className="nt-achievements">{badges.map(badge=><span key={badge.id} title={badge.title}>{badge.label}</span>)}</span>}</span>
            <span className="nt-ranking-pace"><span><i style={{width:`${progress}%`}}/></span><small>{loaded&&!frozen?`${Math.round(progress)}%`:'—'}</small></span>
            <span className="nt-ranking-points">{!loaded?'—':frozen?'???':team.score}</span>
            <ChevronDown size={17} className={expanded?'is-open':''}/>
          </button>
          {expanded&&<div id={`team-games-${team.id}`} className="nt-ranking-detail"><div className="nt-detail-heading"><span>SECTOR ANALYSIS</span><strong>Итого: {loaded?(frozen?'скрыто (Safety Car)':team.score):'—'}</strong></div><div className="nt-sector-results">{games.map(game=><div key={game.id}><small>{game.stage}</small><span>{game.name}</span><strong>{loaded?(frozen?'???':(team.game_scores.find(entry=>entry.game_id===game.id)?.score??0)):'—'}</strong></div>)}</div><div className="nt-boost-row"><button type="button" className="nt-small-button nt-boost-button" disabled={boostUsed||boostBusy} onClick={()=>void boostTeam(team.id)}><Flame size={16}/>{boostUsed?'Буст уже использован':'Nitro Boost'}</button><span>FAN BOOST / {boostCount}</span></div></div>}
        </li>;
      })}</ol>
      <div className="nt-ranking-legend"><span>При равенстве баллов команды делят место. Темп — баллы относительно лидера.</span><a href="/tv" target="_blank" rel="noreferrer">Live tv<ArrowUpRight size={14}/></a></div>
    </main>
  </PublicShell>;
}
