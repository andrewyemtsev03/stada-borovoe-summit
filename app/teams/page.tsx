'use client';
import {useState} from 'react';
import {Plus,Search,UserRound,X} from 'lucide-react';
import PublicShell from '../public-shell';
import PublicHeading from '../public-heading';
import {teamRosters} from '../teams';
import {useParticipant} from '../participant-context';
export default function TeamsPage() {
  const [query, setQuery] = useState('');
  const [expandedTeams,setExpandedTeams] = useState<Set<number>>(new Set());
  function updateQuery(value:string){setQuery(value);setExpandedTeams(value?new Set(teamRosters.map(team=>team.id)):new Set());}
  function toggleTeam(id:number){setExpandedTeams(current=>{const next=new Set(current);if(next.has(id))next.delete(id);else next.add(id);return next;});}
  const { participant, openFinder } = useParticipant();
  const normalize = (value: string) => value.toLocaleLowerCase('ru-RU').replaceAll('ё', 'е').trim();
  const term = normalize(query);
  const filteredTeams = teamRosters.flatMap(team => {
    const members = !term || normalize(team.name).includes(term) || String(team.id) === term
      ? team.members : team.members.filter(member => normalize(member).includes(term));
    return members.length ? [{ ...team, members }] : [];
  });
  const total = teamRosters.reduce((sum, team) => sum + team.members.length, 0);
  return <PublicShell active="teams"><main id="main-content" className="nt-page nt-teams-page">
    <PublicHeading index="02" kicker="THE STARTING GRID" title="FOURTEEN" accent="SCUDERIAS" japanese="チームとドライバー" description="Одна команда — один характер. Откройте карточку, чтобы увидеть состав пилотов."/>
    <div className="nt-toolbar"><label className="nt-search"><Search size={18}/><span className="sr-only">Поиск по нику или команде</span><input type="search" value={query} onChange={event=>updateQuery(event.target.value)} placeholder="Ник, название или номер команды"/>{query&&<button type="button" aria-label="Очистить поиск" onClick={()=>updateQuery('')}><X size={17}/></button>}</label><button type="button" className="nt-small-button" onClick={openFinder}><UserRound size={16}/>{participant?'Сменить участника':'Найти себя'}</button></div>
    <div className="nt-subline"><span role="status">{term?`Найдено пилотов: ${filteredTeams.reduce((sum,team)=>sum+team.members.length,0)}`:'ALL SCUDERIAS'}</span><span>{teamRosters.length} TEAMS / {total} DRIVERS</span></div>
    {filteredTeams.length===0&&<div className="nt-empty"><Search size={26}/><h2>Участники не найдены</h2><p>Попробуйте другой ник или название команды.</p><button className="nt-small-button" type="button" onClick={()=>updateQuery('')}>Сбросить поиск</button></div>}
    <section className="nt-team-grid" aria-label="Составы команд">{filteredTeams.map(team=>{
      const expanded=expandedTeams.has(team.id);
      return <article className={`nt-team-card ${expanded?'is-expanded ':''}${participant?.teamId===team.id?'is-own':''}`} id={`team-roster-${team.id}`} key={team.id}>
        <button type="button" className="nt-team-toggle" aria-expanded={expanded} aria-controls={`roster-${team.id}`} onClick={()=>toggleTeam(team.id)}><span>{String(team.id).padStart(2,'0')}</span><h2>{team.name}</h2><Plus size={17}/></button>
        {expanded&&<ul id={`roster-${team.id}`} className="nt-team-members">{team.members.map(member=><li key={member} className={participant?.name===member?'is-you':''}>{member}</li>)}</ul>}
      </article>;
    })}</section>
  </main></PublicShell>;
}
