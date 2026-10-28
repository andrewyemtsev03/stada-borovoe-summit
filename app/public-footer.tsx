import Link from 'next/link';
export default function PublicFooter(){
  return <footer className="nt-footer"><span>NTGP 2026 <b>{'///'}</b></span><div className="nt-footer-line" aria-hidden="true"/><Link href="/tv">Live tv ↗</Link><span className="nt-footer-motto">RACING PEOPLE. GAMES. CULTURE.</span><span className="nt-barcode" aria-hidden="true"/></footer>;
}
