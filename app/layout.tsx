import type {Metadata} from 'next';
import { Barlow_Condensed, Exo_2 } from 'next/font/google';
import '@fontsource-variable/noto-sans';
import './globals.css';
import './race-design.css';
import './neo-tokyo.css';
import { ParticipantProvider } from './participant-context';
import AgendaNow from './agenda-now';
import MalukEngineer from './maluk-engineer';
import BroadcastBanner from './broadcast-banner';

const racing = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
  variable: '--font-racing',
  display: 'swap',
});

const grandprix = Exo_2({subsets:['latin'],weight:['600','700','800','900'],style:['normal','italic'],variable:'--font-grandprix',display:'swap'});

export const metadata:Metadata={
  title:'STADA Neo-Tokyo Grand Prix 2026',
  description:'Рейтинг 14 скаудерий, составы участников и программа STADA Neo-Tokyo Grand Prix 2026.',
  icons:{icon:{url:'/favicon-stada.png?v=3',type:'image/png'},apple:'/favicon-stada.png?v=3'},
};

export default function Layout({children}:{children:React.ReactNode}){
  return <html lang="ru" className={`${racing.variable} ${grandprix.variable}`}>
    <body><ParticipantProvider><BroadcastBanner/>{children}<AgendaNow/><MalukEngineer/></ParticipantProvider></body>
  </html>;
}
