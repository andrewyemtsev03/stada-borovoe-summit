'use client';

import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { AuditEntry, RaceState } from '@/lib/race-types';

type Tab = 'matrix' | 'judge' | 'bonus' | 'live' | 'audit';

const PRESETS = [
  { label: '+5', delta: 5 },
  { label: '+10', delta: 10 },
  { label: '+25', delta: 25 },
  { label: 'Max', absolute: 50 },
  { label: '−5', delta: -5 },
] as const;

function keyOf(teamId: number, gameId: number) {
  return `${teamId}:${gameId}`;
}

export default function RaceControl({
  initial,
  role,
}: {
  initial: RaceState;
  role: 'director' | 'judge';
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(role === 'judge' ? 'judge' : 'matrix');
  const [state, setState] = useState<RaceState>(initial);
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(initial.teams.flatMap((team) =>
      (team.game_scores ?? []).map((entry) => [keyOf(team.id, entry.game_id), String(entry.score)]),
    )),
  );
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [sectorId, setSectorId] = useState(initial.games[0]?.id ?? 1);
  const [filter, setFilter] = useState('');
  const [bonusTeam, setBonusTeam] = useState(initial.teams[0]?.id ?? 1);
  const [bonusDelta, setBonusDelta] = useState('10');
  const [bonusReason, setBonusReason] = useState('');
  const [banner, setBanner] = useState(initial.banner ?? '');

  useEffect(() => {
    setState(initial);
    setDraft(Object.fromEntries(initial.teams.flatMap((team) =>
      (team.game_scores ?? []).map((entry) => [keyOf(team.id, entry.game_id), String(entry.score)]),
    )));
    setBanner(initial.banner ?? '');
  }, [initial]);

  const dirtyKeys = useMemo(() => {
    const dirty = new Set<string>();
    for (const team of state.teams) {
      for (const game of state.games) {
        const key = keyOf(team.id, game.id);
        const live = team.game_scores.find((entry) => entry.game_id === game.id)?.score ?? 0;
        const value = Number(draft[key] ?? live);
        if (String(draft[key] ?? live) !== String(live) || value !== live) dirty.add(key);
      }
    }
    return dirty;
  }, [draft, state]);

  function applyState(next: RaceState) {
    setState(next);
    setDraft(Object.fromEntries(next.teams.flatMap((team) =>
      (team.game_scores ?? []).map((entry) => [keyOf(team.id, entry.game_id), String(entry.score)]),
    )));
    setBanner(next.banner ?? '');
  }

  async function saveCell(teamId: number, gameId: number) {
    const key = keyOf(teamId, gameId);
    const score = Number(draft[key]);
    if (!Number.isInteger(score) || score < 0) {
      setMessage('Введите целое число ≥ 0.');
      return;
    }
    setBusy(true);
    try {
      const response = await fetch('/api/scores', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, gameId, score }),
      });
      const data = await response.json() as RaceState & { error?: string };
      if (!response.ok) throw new Error(data.error || 'Ошибка сохранения');
      applyState(data);
      setMessage(`Сохранено: команда ${teamId} / сектор ${gameId} → ${score}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Ошибка');
    } finally {
      setBusy(false);
    }
  }

  async function saveBatch() {
    const changes = [...dirtyKeys].map((key) => {
      const [teamId, gameId] = key.split(':').map(Number);
      return { teamId, gameId, score: Number(draft[key]) };
    }).filter((change) => Number.isInteger(change.score) && change.score >= 0);
    if (!changes.length) {
      setMessage('Нет изменений для сохранения.');
      return;
    }
    setBusy(true);
    try {
      const response = await fetch('/api/scores', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ changes }),
      });
      const data = await response.json() as RaceState & { error?: string };
      if (!response.ok) throw new Error(data.error || 'Ошибка batch save');
      applyState(data);
      setMessage(`Сохранено изменений: ${changes.length}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Ошибка');
    } finally {
      setBusy(false);
    }
  }

  async function raceAction(action: string, payload: Record<string, unknown> = {}) {
    setBusy(true);
    try {
      const response = await fetch('/api/race-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await response.json() as RaceState & { error?: string };
      if (!response.ok) throw new Error(data.error || 'Ошибка Race Control');
      applyState(data);
      setMessage(`OK · ${action}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Ошибка');
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.replace('/admin');
    router.refresh();
  }

  function onMatrixKey(event: KeyboardEvent<HTMLInputElement>, teamIndex: number, gameIndex: number) {
    const teams = state.teams.length;
    const games = state.games.length;
    let nextTeam = teamIndex;
    let nextGame = gameIndex;
    if (event.key === 'ArrowRight') nextGame = Math.min(games - 1, gameIndex + 1);
    else if (event.key === 'ArrowLeft') nextGame = Math.max(0, gameIndex - 1);
    else if (event.key === 'ArrowDown') nextTeam = Math.min(teams - 1, teamIndex + 1);
    else if (event.key === 'ArrowUp') nextTeam = Math.max(0, teamIndex - 1);
    else return;
    event.preventDefault();
    const target = document.getElementById(`cell-${state.teams[nextTeam].id}-${state.games[nextGame].id}`) as HTMLInputElement | null;
    target?.focus();
    target?.select();
  }

  const judgeTeams = state.teams.filter((team) =>
    !filter || team.name.toLocaleLowerCase('en-US').includes(filter.toLocaleLowerCase('en-US')) || String(team.id) === filter,
  );

  const tabs: { id: Tab; label: string; directorOnly?: boolean }[] = [
    { id: 'matrix', label: 'Все результаты', directorOnly: true },
    { id: 'judge', label: 'Быстрый ввод' },
    { id: 'bonus', label: 'Корректировки', directorOnly: true },
    { id: 'live', label: 'Эфир', directorOnly: true },
    { id: 'audit', label: 'История / экспорт' },
  ];

  return <div className="race-control">
    <div className="admin-toolbar">
      <p><span className="rc-session-dot"/>Сессия организатора</p>
      <button className="refresh" type="button" onClick={() => void logout()}>Выйти</button>
    </div>

    <div className="race-tabs" role="tablist" aria-label="Race Control">
      {tabs.filter((item) => role === 'director' || !item.directorOnly).map((item) => (
        <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} className={tab === item.id ? 'is-active' : undefined} onClick={() => setTab(item.id)}>
          {item.label}
        </button>
      ))}
    </div>

    <p className="admin-message" role="status">{message}</p>

    {tab === 'matrix' && role === 'director' && <section className="race-card">
      <div className="race-card-head">
        <div>
          <h2>Результаты по этапам</h2>
          <p>Измените баллы в таблице. Стрелки переключают ячейки; изменённые значения выделены.</p>
        </div>
        <button className="save-button" type="button" disabled={busy || dirtyKeys.size === 0} onClick={() => void saveBatch()}>
          Сохранить все изменения ({dirtyKeys.size})
        </button>
      </div>
      <div className="race-matrix-wrap">
        <table className="race-matrix">
          <thead>
            <tr>
              <th>Scuderia</th>
              {state.games.map((game) => <th key={game.id} title={game.name}>{game.stage}</th>)}
              <th>Σ</th>
            </tr>
          </thead>
          <tbody>
            {state.teams.map((team, teamIndex) => <tr key={team.id}>
              <th scope="row"><small>{String(team.id).padStart(2, '0')}</small>{team.name}</th>
              {state.games.map((game, gameIndex) => {
                const key = keyOf(team.id, game.id);
                const dirty = dirtyKeys.has(key);
                return <td key={game.id} className={dirty ? 'is-dirty' : undefined}>
                  <input
                    id={`cell-${team.id}-${game.id}`}
                    type="number"
                    aria-label={`${team.name} / ${game.name}`}
                    min={0}
                    step={1}
                    value={draft[key] ?? '0'}
                    onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.value }))}
                    onKeyDown={(event) => onMatrixKey(event, teamIndex, gameIndex)}
                    onBlur={() => { if (dirty) void saveCell(team.id, game.id); }}
                  />
                </td>;
              })}
              <td className="race-total">{team.score}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </section>}

    {tab === 'judge' && <section className="race-card">
      <div className="race-card-head">
        <div>
          <h2>Ввод по этапу</h2>
          <p>Выберите этап и команду, затем используйте быстрые кнопки для корректировки баллов.</p>
        </div>
        <label className="race-inline-field">Сектор
          <select value={sectorId} onChange={(event) => setSectorId(Number(event.target.value))}>
            {state.games.map((game) => <option key={game.id} value={game.id}>{game.stage} — {game.name}</option>)}
          </select>
        </label>
      </div>
      <input className="race-filter" type="search" placeholder="Название или номер команды" aria-label="Поиск команды для быстрого ввода" value={filter} onChange={(event) => setFilter(event.target.value)} />
      <ul className="race-judge-list">
        {judgeTeams.map((team) => {
          const key = keyOf(team.id, sectorId);
          const score = Number(draft[key] ?? 0);
          return <li key={team.id}>
            <div>
              <strong>{team.name}</strong>
              <small>SCUDERIA {String(team.id).padStart(2, '0')} · сейчас {score}</small>
            </div>
            <div className="race-presets">
              {PRESETS.map((preset) => <button
                key={preset.label}
                type="button"
                disabled={busy}
                onClick={() => {
                  const next = 'absolute' in preset && preset.absolute != null
                    ? preset.absolute
                    : Math.max(0, score + (('delta' in preset ? preset.delta : 0) ?? 0));
                  setDraft((current) => ({ ...current, [key]: String(next) }));
                  void (async () => {
                    setBusy(true);
                    try {
                      const response = await fetch('/api/scores', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ teamId: team.id, gameId: sectorId, score: next }),
                      });
                      const data = await response.json() as RaceState & { error?: string };
                      if (!response.ok) throw new Error(data.error || 'fail');
                      applyState(data);
                      setMessage(`${team.name}: ${next}`);
                    } catch (error) {
                      setMessage(error instanceof Error ? error.message : 'Ошибка');
                    } finally {
                      setBusy(false);
                    }
                  })();
                }}
              >{preset.label}</button>)}
            </div>
          </li>;
        })}
      </ul>
    </section>}

    {tab === 'bonus' && role === 'director' && <section className="race-card">
      <h2>Корректировка результата</h2>
      <div className="race-bonus-form">
        <label>Команда
          <select value={bonusTeam} onChange={(event) => setBonusTeam(Number(event.target.value))}>
            {state.teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
          </select>
        </label>
        <label>Дельта
          <input type="number" value={bonusDelta} onChange={(event) => setBonusDelta(event.target.value)} />
        </label>
        <label>Причина
          <input type="text" value={bonusReason} onChange={(event) => setBonusReason(event.target.value)} placeholder="+15 за лучший пит-стоп" />
        </label>
        <button className="save-button" type="button" disabled={busy || !bonusReason.trim()} onClick={() => void raceAction('bonus', {
          teamId: bonusTeam,
          delta: Number(bonusDelta),
          reason: bonusReason.trim(),
        })}>Начислить</button>
      </div>
    </section>}

    {tab === 'live' && role === 'director' && <section className="race-card">
      <h2>Управление гонкой</h2>
      <div className="race-live-grid">
        <button type="button" className={`race-toggle ${state.freezeTop3 ? 'is-on' : ''}`} disabled={busy} onClick={() => void raceAction('controls', { freezeTop3: !state.freezeTop3, banner: state.banner })}>
          {state.freezeTop3 ? 'Баллы топ-3 скрыты — показать' : 'Скрыть баллы топ-3'}
        </button>
        <label className="race-banner-field">Сообщение участникам
          <textarea value={banner} onChange={(event) => setBanner(event.target.value)} rows={3} placeholder="Через 10 минут старт финального заезда в Главном Паддоке!" />
        </label>
        <div className="race-live-actions">
          <button className="save-button" type="button" disabled={busy} onClick={() => void raceAction('controls', { freezeTop3: state.freezeTop3, banner })}>Опубликовать</button>
          <button className="refresh" type="button" disabled={busy} onClick={() => void raceAction('controls', { freezeTop3: state.freezeTop3, banner: null })}>Убрать сообщение</button>
        </div>
      </div>
    </section>}

    {tab === 'audit' && <section className="race-card">
      <div className="race-card-head">
        <div>
          <h2>История изменений</h2>
          <p>История изменений телеметрии Neo-Tokyo GP.</p>
        </div>
        <div className="race-audit-actions">
          {role === 'director' && <>
            <button className="save-button" type="button" disabled={busy} onClick={() => void raceAction('demo')}>Загрузить демо-результаты</button>
            <button className="refresh" type="button" disabled={busy} onClick={() => void raceAction('reset')}>Сбросить</button>
          </>}
          <button className="refresh" type="button" disabled={busy} onClick={() => void raceAction('undo')}>Отменить</button>
          <a className="refresh" href="/api/race-control?export=csv">CSV</a>
          <a className="refresh" href="/api/race-control?export=json">JSON</a>
        </div>
      </div>
      {state.audit.length===0&&<p className="rc-empty-audit">История появится после первого изменения результатов.</p>}
      <ol className="race-audit-list">
        {state.audit.map((entry: AuditEntry) => <li key={entry.id}>
          <time>{new Date(entry.at).toLocaleString('ru-RU')}</time>
          <strong>{entry.who}</strong>
          <span>{entry.teamName} · {entry.label}</span>
          <em>{entry.from} → {entry.to}</em>
          {entry.reason && <small>{entry.reason}</small>}
        </li>)}
      </ol>
    </section>}
  </div>;
}
