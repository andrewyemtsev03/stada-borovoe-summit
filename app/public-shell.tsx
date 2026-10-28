import PublicHeader from './public-header';
import PublicFooter from './public-footer';
import EntryIntro from './entry-intro';
export default function PublicShell({children,active='home',className=''}:{children:React.ReactNode;active?:string;className?:string}){
  return <div className={`nt-site ${className}`}><EntryIntro/><PublicHeader active={active}/>{children}<PublicFooter/></div>;
}
