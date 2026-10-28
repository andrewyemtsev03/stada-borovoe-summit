import { ArrowUpRight, LockKeyhole, MonitorPlay } from 'lucide-react';
import Link from 'next/link';
import BrandEmblem from './brand-emblem';
export default function Header({active='standings'}:{active?:string}) {
  return <>
    <a className="skip-link" href="#main-content">Перейти к содержимому</a>
    <header className="site-header race-header">
      <Link href="/" className="brand" aria-label="STADA Neo Tokyo Grand Prix 2026 — главная"><BrandEmblem/></Link>
      <nav aria-label="Главное меню">
        <Link href="/" aria-current={active==='standings'?'page':undefined}>Главная<span>01</span></Link>
        <Link href="/teams" aria-current={active==='teams'?'page':undefined}>Скаудерии<span>02</span></Link>
        <Link href="/agenda" aria-current={active==='agenda'?'page':undefined}>Программа<span>03</span></Link>
        <Link href="/briefing" aria-current={active==='briefing'?'page':undefined}>Регламент<span>04</span></Link>
      </nav>
      <div className="header-utilities">
        <Link className="header-tv" aria-label="Live tv — открыть трансляцию в новой вкладке" href="/tv" target="_blank" rel="noreferrer"><MonitorPlay size={15}/><span>Live tv</span><ArrowUpRight size={13}/></Link>
        <Link className="organizer" href="/admin" aria-current={active === 'admin' ? 'page' : undefined} aria-label="Race Control"><LockKeyhole size={15}/><span>Race Control</span></Link>
      </div>
    </header>
  </>;
}
