'use client';
import {useState} from 'react';
import {ArrowRight,Clock3,MapPin,UserRound,Users} from 'lucide-react';
import PublicShell from '../public-shell';
import PublicHeading from '../public-heading';
import {useParticipant} from '../participant-context';
import {agendaTimezone,dayLabel,eventDays,getAgenda,getAgendaStatus,timeLabel} from '../agenda-model';
import {teamRosters} from '../teams';
import {useConferenceClock} from '../use-conference-clock';
export default function Agenda() {
  const { participant, openFinder } = useParticipant();
  const [chosenDay, setChosenDay] = useState<string | null>(null);
  const [view, setView] = useState<'personal' | 'general'>('personal');
  const now = useConferenceClock();
  const today = now === null ? '' : new Intl.DateTimeFormat('en-CA', { timeZone: agendaTimezone }).format(now);
  const day = chosenDay ?? (eventDays.includes(today) ? today : eventDays[0]);
  const personal = Boolean(participant && view === 'personal');
  const events = getAgenda(personal ? participant?.teamId : null);
  const current = now === null ? undefined : getAgendaStatus(events, now).current;
  const dayEvents=events.filter(event=>event.date===day);
  return <PublicShell active="agenda"><main id="main-content" className="nt-page nt-agenda-page">
    <PublicHeading index="03" kicker="13—16 APRIL / TOKYO UTC+9" title="YOUR RACE" accent="WEEKEND" japanese="レースプログラム" description="От первого брифинга до финального круга. Программа, соперники и маршрут вашей команды."/>
    <section className="nt-agenda-identity" aria-label="Участник и программа"><UserRound size={22}/><div><strong>{participant?.name??'Ваш гоночный уик-энд'}</strong><p>{participant?`${participant.teamName} / SCUDERIA ${String(participant.teamId).padStart(2,'0')}`:'Выберите свой ник, чтобы увидеть личные раунды, залы и соперников.'}</p></div><button type="button" className="nt-small-button" onClick={openFinder}>{participant?'Сменить участника':'Найти себя'}<ArrowRight size={15}/></button></section>
    <div className="nt-agenda-layout"><aside className="nt-agenda-dayrail" aria-label="День программы"><p>RACE DAYS <span>/ 04</span></p>{eventDays.map((date,index)=><button type="button" key={date} aria-pressed={day===date} onClick={()=>setChosenDay(date)}><small>DAY {String(index+1).padStart(2,'0')}</small><strong>{dayLabel(date)}</strong><span>{['Arrival & Paddock','FP & Qualifying','Finals','Victory Lap'][index]}</span><ArrowRight size={15}/></button>)}</aside>
      <section className="nt-timetable"><div className="nt-timetable-top"><div><small>ON THE PROGRAMME</small><h2>{dayLabel(day)}</h2></div>{participant&&<div className="nt-agenda-switch" role="group" aria-label="Вид программы"><button type="button" aria-pressed={view==='personal'} onClick={()=>setView('personal')}>Моя программа</button><button type="button" aria-pressed={view==='general'} onClick={()=>setView('general')}>Общая программа</button></div>}</div>
        <div className="nt-subline"><span>{personal?`МАРШРУТ / ${participant?.teamName}`:'ОБЩАЯ ПРОГРАММА'}</span><span><Clock3 size={12}/>TOKYO / UTC+9</span></div>
        <ol className="nt-timeline">{dayEvents.map(event=><li key={event.id} className={`nt-agenda-event ${event.id===current?.id?'is-current':''}`}>
          <div className="nt-agenda-time">{timeLabel(event)}{event.id===current?.id&&<small>СЕЙЧАС</small>}</div>
          <div className="nt-event-content">{event.round&&<span className="nt-event-round">ROUND {String(event.round).padStart(2,'0')} / 07</span>}<h3>{event.title}</h3>
            <p className="nt-event-location"><MapPin size={14}/>{event.location||'Место уточните у организаторов'}</p>
            {event.opponentId&&<p><Users size={14}/>Соперник: команда {event.opponentId} · {teamRosters.find(team=>team.id===event.opponentId)?.name}</p>}
            {event.note&&<p className="nt-event-note">{event.note}</p>}
            {event.details&&<ol className="nt-event-details" aria-label="Подробная программа тренинга">{event.details.map(detail=><li key={detail.start}><span>{detail.start}—{detail.end}</span><div>{detail.title}</div></li>)}</ol>}
            {event.block&&!personal&&<button type="button" className="nt-inline-action" onClick={()=>{if(participant)setView('personal');else openFinder();}}>Показать мой маршрут<ArrowRight size={14}/></button>}
          </div>
        </li>)}</ol>
      </section>
    </div>
  </main></PublicShell>;
}
