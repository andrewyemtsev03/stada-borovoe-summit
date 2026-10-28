import Link from 'next/link';
import {ArrowRight,CalendarDays} from 'lucide-react';
import PublicShell from './public-shell';
import {teamRosters} from './teams';
import {games} from './games';
const sectors=[{id:'01',x:64,y:15},{id:'02',x:65,y:29},{id:'03',x:81,y:33},{id:'04',x:59,y:51},{id:'05',x:82,y:53},{id:'06',x:47,y:71},{id:'07',x:69,y:64},{id:'08',x:73,y:73},{id:'09',x:49,y:83}];
export default function Home(){
 return <PublicShell className="nt-home"><main id="main-content" className="nt-hero">
  <div className="nt-hero-art" aria-hidden="true">
   {/* eslint-disable-next-line @next/next/no-img-element */}
   <img src="/neo-tokyo-circuit.webp" alt="" width={1672} height={941} fetchPriority="high" data-intro-asset/>
   <div className="nt-technical-grid"/>
   {sectors.map(s=><span className="nt-sector" key={s.id} style={{left:`${s.x}%`,top:`${s.y}%`}}><b>S{s.id}</b><i/></span>)}
  </div>
  <div className="nt-hero-coordinates"><strong>NEO TOKYO CIRCUIT</strong><span>35.6762° N&nbsp; 139.6503° E <b>＋</b></span></div>
  <span className="nt-tokyo-kanji" aria-hidden="true" lang="ja">東京</span>
  <div className="nt-hero-copy">
   <p className="nt-hero-overline"><span>2026</span><i>\</i> TEAMS / GAMES / ONE CHAMPION</p>
   <h1><span>NEO TOKYO</span><em>GRAND PRIX</em></h1>
   <p className="nt-hero-japanese" lang="ja">ネオ東京グランプリ</p>
   <p className="nt-hero-description">A live event platform for racing-inspired<br className="nt-desktop-break"/> team competition.</p>
   <div className="nt-hero-actions"><Link className="nt-button nt-button-red" href="/leaderboard">VIEW LEADERBOARD<ArrowRight size={19}/></Link><Link className="nt-button nt-button-outline" href="/agenda"><CalendarDays size={20}/>LIVE AGENDA</Link></div>
   <dl className="nt-hero-stats"><div><dt>{teamRosters.length}</dt><dd>TEAMS</dd></div><div><dt>{games.length}</dt><dd>GAMES</dd></div><div><dt>1</dt><dd>CHAMPION</dd></div></dl>
  </div>
  <span className="nt-hero-corner nt-hero-corner-top" aria-hidden="true"/><span className="nt-hero-corner nt-hero-corner-bottom" aria-hidden="true"/>
 </main></PublicShell>;
}
