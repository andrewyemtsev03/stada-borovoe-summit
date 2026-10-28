import Link from 'next/link';
import {ArrowUpRight} from 'lucide-react';
import PublicLogo from './public-logo';

const links = [{href:'/leaderboard',label:'Leaderboard',id:'leaderboard'},{href:'/teams',label:'Teams',id:'teams'},{href:'/agenda',label:'Agenda',id:'agenda'},{href:'/briefing',label:'Rules',id:'rules'},{href:'/admin',label:'Race Control',id:'admin'}];
export default function PublicHeader({active='home'}:{active?:string}) {
  return <><a href="#main-content" className="nt-skip">Skip to content</a><header className="nt-header">
    <Link href="/" className="nt-home-link" aria-label="STADA Neo Tokyo Grand Prix — Home"><PublicLogo/></Link>
    <nav aria-label="Main navigation">{links.map(link=><Link key={link.id} href={link.href} aria-current={active===link.id?'page':undefined}>{link.label}</Link>)}</nav>
    <Link href="/tv" className="nt-event-signal nt-live-tv" target="_blank" rel="noreferrer" aria-label="Live tv — открыть трансляцию"><i/><span>Live tv</span><ArrowUpRight size={14}/></Link>
  </header></>;
}
