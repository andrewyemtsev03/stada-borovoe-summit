import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import '../race-control.css';
import RaceControl from '../race-control';
import { ORGANIZER_COOKIE, ORGANIZER_ROLE_COOKIE, isOrganizerPassword, roleForPassword } from '@/lib/organizer-session';
import { getAdminScoreboard } from '@/lib/race-store';

export const dynamic = 'force-dynamic';

export default async function Control() {
  const cookieStore = await cookies();
  const password = cookieStore.get(ORGANIZER_COOKIE)?.value;
  if (!isOrganizerPassword(password)) redirect('/admin');
  const roleCookie = cookieStore.get(ORGANIZER_ROLE_COOKIE)?.value;
  const role = roleCookie === 'judge' || roleCookie === 'director' ? roleCookie : roleForPassword(password);
  const state = await getAdminScoreboard();

  return <div className="rc-shell is-authenticated">
    <header className="rc-header"><Link href="/" className="rc-brand" aria-label="STADA Neo Tokyo — главная"><span className="rc-mark">S</span><span><strong>Race Control</strong><small>STADA NEO TOKYO / 2026</small></span></Link><nav aria-label="Навигация организатора"><Link href="/"><ArrowLeft size={14}/><span>На сайт</span></Link><Link href="/tv" className="rc-tv-link" target="_blank" rel="noreferrer"><i/>Live tv<ArrowUpRight size={14}/></Link></nav></header>
    <main id="main-content" className="rc-workspace"><div className="rc-workspace-heading"><p>EVENT OPERATIONS / 2026</p><h1>Race Control<span>管理室</span></h1><div className="rc-workspace-meta"><span>{state.teams.length} КОМАНД</span><i/><span>{state.games.length} ЭТАПОВ</span></div></div><RaceControl initial={state} role={role}/></main>
  </div>;
}
