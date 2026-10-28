'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MapPin, ArrowRight, UserRound, ChevronDown } from 'lucide-react';
import { useParticipant } from './participant-context';
import { dayLabel, getAgenda, getAgendaStatus, timeLabel } from './agenda-model';
import { useConferenceClock } from './use-conference-clock';
export default function AgendaNow() {
  const pathname = usePathname();
  const { participant, ready, openFinder } = useParticipant();
  const now = useConferenceClock();
  const ref = useRef<HTMLElement>(null);
  const [height, setHeight] = useState(180);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => setHeight(entry.target.getBoundingClientRect().height));
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [pathname]);
  const { current, next } = now === null ? {} : getAgendaStatus(getAgenda(participant?.teamId), now);
  const event = current ?? next;
  if (pathname === '/tv' || pathname === '/admin' || pathname.startsWith('/admin/')) return null;
  return <>
    <div aria-hidden="true" style={{ height: height + 24 }}/>
    <aside ref={ref} className={`agenda-now ${expanded ? 'is-expanded' : ''} ${event ? '' : 'is-idle'}`} aria-label="Ваш маршрут сейчас">
      <div className="agenda-now-inner">
        <button type="button" className="agenda-person" onClick={openFinder}><UserRound size={19}/><span><strong>{participant?.name ?? 'Найти себя'}</strong><small>{participant ? `Команда ${participant.teamId} · ${participant.teamName} · сменить` : 'Открыть свой маршрут'}</small></span></button>
        {event && <button className="agenda-now-toggle" type="button" aria-expanded={expanded} aria-controls="current-route-details" onClick={() => setExpanded(!expanded)}><span>{expanded ? 'Свернуть маршрут' : current ? 'Сейчас' : 'Далее'}{!expanded && event ? ` · ${event.location || event.title}` : ''}</span><ChevronDown size={18}/></button>}
        {event && <div id="current-route-details" className="agenda-now-event" role="status" aria-live="polite">
          <span className="agenda-now-label">{!ready || now === null ? 'ПРОГРАММА' : current ? 'СЕЙЧАС' : 'ДАЛЕЕ'} <span>· Tokyo, UTC+9</span></span>
          <strong>{event.title}</strong><span><MapPin size={15}/>{event.location || (event.block && !participant ? 'Выберите участника, чтобы увидеть зал' : 'Место уточните у организаторов')}</span><small>{dayLabel(event.date)} · {timeLabel(event)}{current && next?.date === current.date ? ` · Далее в ${next.start}: ${next.location || next.title}` : ''}</small>
        </div>}
        <Link className="agenda-now-link" href="/agenda">{participant ? 'Моя программа' : 'Программа'}<ArrowRight size={17}/></Link>
      </div>
    </aside>
  </>;
}
