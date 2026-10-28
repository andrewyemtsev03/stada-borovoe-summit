'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, ChartNoAxesColumnIncreasing, ChevronRight, FileText, MapPin, Minus, Search, Send, Swords, Trophy, X } from 'lucide-react';
import './maluk-panel.css';
import { useParticipant } from './participant-context';
import { initialTeams, participants, Team, teamRosters } from './teams';
import { games as initialGames, Game } from './games';
import { dayLabel, getAgenda, getAgendaStatus, timeLabel } from './agenda-model';
import { useConferenceClock } from './use-conference-clock';

type ChatMsg = { role: 'maluk' | 'user'; text: string };

const CHIPS = [
  { id: 'team', label: 'Моя команда', icon: ChartNoAxesColumnIncreasing },
  { id: 'leaders', label: 'Кто лидирует?', icon: Trophy },
  { id: 'route', label: 'Куда идти дальше?', icon: MapPin },
  { id: 'rules', label: 'Правила и регламент', icon: FileText },
] as const;

function sectorScore(team: Team, gameId: number) {
  return team.game_scores.find((entry) => entry.game_id === gameId)?.score ?? 0;
}

function rankTeams(teams: Team[]) {
  return [...teams].sort((a, b) => b.score - a.score || a.id - b.id);
}

function RobotFallback({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <rect x="8" y="14" width="48" height="40" rx="10" fill="#fff5f6" stroke="#ed071d" strokeWidth="2"/>
      <rect x="16" y="24" width="32" height="12" rx="4" fill="#24242b"/>
      <circle cx="24" cy="30" r="3" fill="#FF1E38"/>
      <circle cx="40" cy="30" r="3" fill="#FF1E38"/>
      <rect x="22" y="42" width="20" height="6" rx="2" fill="#ed071d"/>
      <line x1="32" y1="14" x2="32" y2="6" stroke="#ed071d" strokeWidth="2"/>
      <circle cx="32" cy="5" r="3" fill="#ed071d"/>
    </svg>
  );
}

export default function MalukEngineer() {
  const pathname = usePathname();
  const { participant, openFinder } = useParticipant();
  const now = useConferenceClock();
  const [open, setOpen] = useState(false);
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [games, setGames] = useState<Game[]>(initialGames);
  const [loaded, setLoaded] = useState(false);
  const [input, setInput] = useState('');
  const [awaitingSearch, setAwaitingSearch] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState('/maluk-helmet.png');
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const inFlight = useRef(false);
  const interacted = useRef(false);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const pendingFocus = useRef<'panel' | 'launcher' | null>(null);

  const hidden = pathname === '/admin' || pathname.startsWith('/admin/') || pathname === '/tv';

  // Welcome once per browser session, three seconds after the opening film.
  useEffect(() => {
    if (hidden || interacted.current) return;
    try { if (sessionStorage.getItem('maluk-welcomed-v1')) return; } catch { /* Storage is optional. */ }
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      if (timer || document.querySelector('.nt-intro')) return;
      timer = setTimeout(() => {
        observer.disconnect();
        if (interacted.current) return;
        interacted.current = true;
        try { sessionStorage.setItem('maluk-welcomed-v1', '1'); } catch { /* Storage is optional. */ }
        setOpen(true);
      }, 3000);
    };
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
    schedule();
    return () => { clearTimeout(timer); observer.disconnect(); };
  }, [hidden]);

  function togglePanel(next: boolean) {
    interacted.current = true;
    try { sessionStorage.setItem('maluk-welcomed-v1', '1'); } catch { /* Storage is optional. */ }
    const restoreFocus = !next && panelRef.current?.contains(document.activeElement);
    pendingFocus.current = next ? 'panel' : restoreFocus ? 'launcher' : null;
    setOpen(next);
  }

  useEffect(() => {
    const target = pendingFocus.current;
    if (!target || hidden) return;
    pendingFocus.current = null;
    const timer = setTimeout(() => {
      if (target === 'panel') panelRef.current?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
      else launcherRef.current?.focus({ preventScroll: true });
    }, target === 'launcher' ? 180 : 0);
    return () => clearTimeout(timer);
  }, [open, hidden]);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const response = await fetch('/api/scores', { cache: 'no-store', signal: AbortSignal.timeout(12000) });
      if (!response.ok) throw Error();
      const data = await response.json() as { teams: Team[]; games: Game[] };
      const live = new Map(data.teams.map((team) => [team.id, team]));
      setTeams(initialTeams.map((team) => {
        const entry = live.get(team.id);
        return {
          ...team,
          score: entry?.score ?? 0,
          updated_at: entry?.updated_at ?? null,
          game_scores: entry?.game_scores ?? [],
        };
      }));
      setGames(initialGames);
      setLoaded(true);
    } catch {
      /* keep last frame */
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    if (hidden) return;
    const first = window.setTimeout(() => void refresh(), 0);
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh();
    }, 12000);
    return () => { clearTimeout(first); clearInterval(timer); };
  }, [refresh, hidden]);

  const sorted = useMemo(() => rankTeams(teams), [teams]);
  const telemetry = useMemo(() => {
    if (!participant) return null;
    const team = teams.find((entry) => entry.id === participant.teamId);
    if (!team) return null;
    const rank = sorted.findIndex((entry) => entry.id === team.id) + 1;
    const leader = sorted[0];
    const p3 = sorted[2];
    return {
      team,
      rank: rank || null,
      gapToP1: leader ? leader.score - team.score : 0,
      gapToP3: p3 ? p3.score - team.score : 0,
    };
  }, [participant, teams, sorted]);

  useEffect(() => {
    if (!open || messages.length) return;
    const greeting = participant && telemetry
      ? `Радиосвязь установлена, ${participant.name}. Scuderia «${participant.teamName}» на P${telemetry.rank ?? '—'} · ${telemetry.team.score} pts. До P1: ${telemetry.gapToP1} · до P3: ${telemetry.gapToP3 >= 0 ? `+${telemetry.gapToP3} нужно` : `${Math.abs(telemetry.gapToP3)} в запасе`}. Готов разобрать телеметрию.`
      : 'Привет! Я MALUK. Чем могу помочь?';
    const timer = setTimeout(() => setMessages([{ role: 'maluk', text: greeting }]), 0);
    return () => clearTimeout(timer);
  }, [open, participant, telemetry, messages.length]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open]);

  function strongestWeakest(team: Team) {
    const rows = games.map((game) => ({ game, score: sectorScore(team, game.id) }));
    const scored = rows.filter((row) => row.score > 0);
    const best = [...scored].sort((a, b) => b.score - a.score)[0];
    const worst = [...rows].sort((a, b) => a.score - b.score)[0];
    return { best, worst, rows };
  }

  function answerChip(id: string, freeText?: string): string {
    const leader = sorted[0];
    const p2 = sorted[1];
    const p3 = sorted[2];

    if (id === 'rules') return 'Регламент и чек-лист пилота — на /briefing. Пройдите 5 пунктов, чтобы получить PIT LANE CLEARANCE.';

    if (id === 'find' || awaitingSearch || (freeText && /найт|поиск|пилот|скаудер|команд/i.test(freeText) && !/сравн|лидер|маршрут|разбор/i.test(freeText))) {
      const query = (freeText ?? '').trim();
      if (!query || id === 'find' && !freeText) {
        setAwaitingSearch(true);
        return 'Передаю поиск по паддоку. Введите ник пилота или название скаудерии в поле ниже.';
      }
      setAwaitingSearch(false);
      const q = query.toLocaleLowerCase('ru-RU').replaceAll('ё', 'е');
      const pilots = participants.filter((person) => person.name.toLocaleLowerCase('ru-RU').replaceAll('ё', 'е').includes(q)).slice(0, 8);
      const scuds = teamRosters.filter((team) => team.name.toLocaleLowerCase('en-US').includes(q) || String(team.id) === q).slice(0, 6);
      if (!pilots.length && !scuds.length) return `По запросу «${query}» ничего не нашёл в 14 скаудериях. Уточните ник или имя команды.`;
      const lines: string[] = [];
      if (scuds.length) lines.push('Скаудерии:\n' + scuds.map((team) => `· ${team.name} (ID ${team.id}) — ${team.members.length} пилотов`).join('\n'));
      if (pilots.length) lines.push('Пилоты:\n' + pilots.map((person) => `· ${person.name} → ${person.teamName}`).join('\n'));
      return lines.join('\n\n');
    }

    if (id === 'leaders') {
      if (!loaded || !leader) return 'Телеметрия ещё грузится с /api/scores. Повторите через секунду.';
      const gaps = sorted.slice(0, 5).map((team, index) => {
        const gap = leader.score - team.score;
        return `P${index + 1} ${team.name} — ${team.score} pts${index === 0 ? '' : ` (−${gap} к лидеру)`}`;
      });
      return `Поул держит ${leader.name}. Топ-5 Neo-Tokyo:\n${gaps.join('\n')}\nОтрыв P1→P2: ${leader.score - (p2?.score ?? 0)} · P1→P3: ${leader.score - (p3?.score ?? 0)}.`;
    }

    if (id === 'team') {
      if (!participant || !telemetry) {
        return 'Чтобы разобрать вашу команду, сначала отметьтесь через «Найти себя». Я подтяну P-rank и сектора.';
      }
      const { best, worst, rows } = strongestWeakest(telemetry.team);
      const zeros = rows.filter((row) => row.score === 0).map((row) => row.game.stage);
      return [
        `${participant.name}, разбор «${participant.teamName}»: P${telemetry.rank} · ${telemetry.team.score} pts.`,
        best ? `Сильнейший сектор: ${best.game.stage} «${best.game.name}» — ${best.score}.` : 'Сектора ещё без баллов.',
        worst ? `Зона роста: ${worst.game.stage} «${worst.game.name}» — ${worst.score}.` : '',
        zeros.length ? `Нули: ${zeros.join(', ')}.` : 'Все сектора отмечены.',
        telemetry.gapToP1 === 0 ? 'Вы на поуле. Держите темп.' : `До P1 нужно ${telemetry.gapToP1} pts · до зоны P3: ${telemetry.gapToP3 > 0 ? telemetry.gapToP3 + ' pts' : 'уже внутри Топ-3'}.`,
      ].filter(Boolean).join('\n');
    }

    if (id === 'route') {
      if (!participant) {
        openFinder();
        return 'Без выбранного пилота маршрут общий. Откройте «Найти себя» — покажу раунды, залы и соперников вашей скаудерии.';
      }
      const events = getAgenda(participant.teamId);
      const status = now === null ? { current: undefined, next: undefined } : getAgendaStatus(events, now);
      const focus = status.current ?? status.next;
      const upcoming = events
        .filter((event) => event.teamId === participant.teamId || (!event.block && event.round))
        .slice(0, 4);
      if (!focus && !upcoming.length) {
        return `Программа для «${participant.teamName}» в календаре завершена или ещё не размечена. Проверьте вкладку «Программа».`;
      }
      const lines = [
        status.current
          ? `Сейчас: ${status.current.title} · ${timeLabel(status.current)} · ${status.current.location || 'место у организаторов'}`
          : status.next
            ? `Далее: ${status.next.title} · ${dayLabel(status.next.date)} ${timeLabel(status.next)} · ${status.next.location || 'место уточняется'}`
            : 'Активного слота нет.',
      ];
      for (const event of upcoming.filter((item) => item.id !== focus?.id).slice(0, 3)) {
        const opponent = event.opponentId ? teamRosters.find((team) => team.id === event.opponentId)?.name : null;
        lines.push(`· ${dayLabel(event.date)} ${timeLabel(event)} — ${event.title}${opponent ? ` vs ${opponent}` : ''}${event.location ? ` @ ${event.location}` : ''}`);
      }
      return lines.join('\n');
    }

    if (id === 'vs') {
      if (!loaded || !leader) return 'Жду телеметрию лидера…';
      if (!participant || !telemetry) {
        return `Лидер сейчас ${leader.name} (${leader.score}). Выберите себя, чтобы сравнить вашу скаудерию сектор за сектором.`;
      }
      if (telemetry.team.id === leader.id) {
        return `Вы и есть лидер «${leader.name}». Ближайший преследователь: ${p2?.name ?? '—'} (−${leader.score - (p2?.score ?? 0)}).`;
      }
      const rows = games.map((game) => {
        const ours = sectorScore(telemetry.team, game.id);
        const theirs = sectorScore(leader, game.id);
        const delta = ours - theirs;
        return `${game.stage}: ${ours} vs ${theirs} (${delta >= 0 ? '+' : ''}${delta})`;
      });
      return `Дуэль «${telemetry.team.name}» vs лидер «${leader.name}»:\nИтого ${telemetry.team.score} vs ${leader.score} (разрыв ${telemetry.gapToP1}).\n${rows.join('\n')}`;
    }

    // free-text keyword router
    const text = (freeText ?? '').toLocaleLowerCase('ru-RU');
    if (/лидер|поул|топ|отрыв|кто впереди|standings|leader/.test(text)) return answerChip('leaders');
    if (/маршрут|куда|программ|agenda|расписан|следующ/.test(text)) return answerChip('route');
    if (/сравн|duel|лидер.?сектор|vs /.test(text)) return answerChip('vs');
    if (/разбор|моя команда|наш счет|наш счёт|телеметр/.test(text)) return answerChip('team');
    if (/админ|парол|race control|stada2026/.test(text)) {
      return 'Race Control на /admin. Демо-вход настраивается на следующем шаге; пока панель организатора защищена паролем сессии.';
    }
    if (/правил|пит.?стоп|безопасност|брифинг/.test(text)) {
      return 'Регламент и чек-лист пилота — на /briefing. Пройдите 5 пунктов, чтобы получить PIT LANE CLEARANCE.';
    }
    if (leader) {
      return `Слышу вас. Сейчас поул — ${leader.name} (${leader.score} pts). Спросите про лидеров, маршрут, разбор команды или поиск пилота — или жмите чипы ниже.`;
    }
    return 'Канал открыт. Телеметрия ещё подтягивается — повторите запрос или выберите быструю команду.';
  }

  function pushExchange(userText: string, reply: string) {
    setMessages((current) => [
      ...current,
      { role: 'user', text: userText },
      { role: 'maluk', text: reply },
    ]);
  }

  function onChip(id: (typeof CHIPS)[number]['id'] | 'vs' | 'find', label: string) {
    void refresh();
    pushExchange(label, answerChip(id));
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput('');
    void refresh();
    const mode = awaitingSearch ? 'find' : 'free';
    pushExchange(text, answerChip(mode, text));
  }

  if (hidden) return null;

  const avatar = (className: string, size: number) => avatarFailed
    ? <RobotFallback className={className}/>
    // eslint-disable-next-line @next/next/no-img-element
    : <img className={className} src={avatarSrc} alt="MALUK в гоночном шлеме" width={size} height={size} onError={() => {
        if (avatarSrc !== '/maluk-robot-nobg.png') setAvatarSrc('/maluk-robot-nobg.png');
        else setAvatarFailed(true);
      }}/>;

  return (
    <div className={`mgp-root ${open ? 'mgp-open' : ''}`}>
      <section ref={panelRef} id="maluk-character-panel" className="mgp-panel" role="dialog" aria-labelledby="mgp-title" aria-hidden={!open} inert={!open}
        onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); togglePanel(false); } }}>
        <header className="mgp-head">
          <svg className="mgp-mark" viewBox="0 0 40 40" aria-hidden="true"><path d="M16 4h10L12 21H2zM29 4h9L25 21H15zM15 22h10L13 37H3zM28 22h9L25 37H16z" fill="currentColor"/></svg>
          <div className="mgp-identity"><h2 id="mgp-title">MALUK GP</h2><span>RACE ENGINEER</span></div>
          <span className="mgp-live"><i/>LIVE</span>
          <button type="button" className="mgp-icon-button" aria-label="Свернуть MALUK" onClick={() => togglePanel(false)}><Minus size={18}/></button>
          <button type="button" className="mgp-icon-button" aria-label="Закрыть MALUK" onClick={() => togglePanel(false)}><X size={19}/></button>
        </header>

        <div className="mgp-body">
          <div className="mgp-welcome">
            <div className="mgp-portrait">{avatar('mgp-avatar', 88)}</div>
            <div className="mgp-greeting"><p>Привет! Я MALUK.<br/>Чем могу помочь?</p><span>あなたのレースエンジニア</span></div>
          </div>

          {participant && telemetry && <div className="mgp-telemetry" aria-live="polite"><span>{participant.name}<strong>{participant.teamName}</strong></span><span><b>P{telemetry.rank ?? '—'}</b> {telemetry.team.score} pts<small>ΔP1 {telemetry.gapToP1} · ΔP3 {telemetry.gapToP3}</small></span></div>}

          <div className="mgp-actions" role="group" aria-label="Быстрые команды">
            {CHIPS.map(({id, label, icon: Icon}) => <button key={id} type="button" onClick={() => onChip(id, label)}><Icon size={20} strokeWidth={2.2}/><span>{label}</span><ChevronRight size={16}/></button>)}
          </div>

          <div className={`mgp-conversation ${messages.length > 1 ? 'mgp-has-messages' : ''}`} ref={listRef} role="log" aria-label="Переписка с MALUK" aria-live="polite" aria-relevant="additions" tabIndex={messages.length > 1 ? 0 : -1}>
            {messages.filter((_, index) => index > 0 || Boolean(participant)).map((message, index) => <div key={`${message.role}-${index}`} className={`mgp-message mgp-message-${message.role}`}><span>{message.role === 'maluk' ? 'MALUK' : 'ВЫ'}</span><p>{message.text}{message.role === 'maluk' && message.text.includes('/briefing') && <a href="/briefing">Открыть регламент <ArrowUpRight size={13}/></a>}</p></div>)}
          </div>

          <details className="mgp-more"><summary>Ещё команды <ChevronRight size={13}/></summary><div><button type="button" onClick={() => onChip('vs', 'Сравнить с лидером')}><Swords size={14}/>Сравнить с лидером</button><button type="button" onClick={() => onChip('find', 'Найти пилота или скаудерию')}><Search size={14}/>Найти пилота</button><button type="button" onClick={openFinder}>Найти себя <ArrowUpRight size={13}/></button></div></details>
        </div>

        <form className="mgp-compose" onSubmit={onSubmit}>
          <span className="mgp-wave" aria-hidden="true"><i/><i/><i/><i/><i/></span>
          <input value={input} onChange={event => setInput(event.target.value)} placeholder={awaitingSearch ? 'Ник или скаудерия…' : 'Спросить MALUK…'} aria-label="Сообщение MALUK"/>
          <button type="submit" aria-label="Отправить сообщение" disabled={!input.trim()}><Send size={19}/></button>
        </form>
        <div className="mgp-footnote"><span>NEO TOKYO GRAND PRIX</span><span>ピット通信 / 2026</span></div>
      </section>

      <button ref={launcherRef} type="button" className="mgp-launcher" aria-expanded={open} aria-controls="maluk-character-panel" aria-label={open ? 'Свернуть MALUK GP' : 'Открыть MALUK GP'} onClick={() => togglePanel(!open)}>
        {avatar('mgp-launcher-avatar', 60)}<span className="mgp-launcher-dot" aria-hidden="true"/><span className="mgp-launcher-label">MALUK GP</span>
      </button>
    </div>
  );
}
