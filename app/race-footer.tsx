import Link from 'next/link';
import BrandEmblem from './brand-emblem';
export default function RaceFooter() {
  return <footer className="race-footer">
    <Link href="/" aria-label="STADA Neo Tokyo Grand Prix — главная"><BrandEmblem/></Link>
    <p>TOKYO BAY. AFTER DARK.<small>STADA NEO TOKYO GRAND PRIX © 2026</small></p>
    <span className="footer-jp" lang="ja">限界の、その先へ。<small>BEYOND THE LIMIT.</small></span>
  </footer>;
}
