/** The rising sun, cut by two apex lines. */
export default function BrandEmblem({ className = '' }: { className?: string }) {
  return <span className={`brand-emblem ${className}`.trim()} aria-hidden="true">
    <svg viewBox="0 0 224 56" width="224" height="56" fill="none" focusable="false">
      <path d="M27 4a24 24 0 1 0 0 48 24 24 0 0 0 0-48Z" fill="#F3293E"/>
      <path d="M0 32 26 12h13L14 32H0Zm13 12 26-20h13L27 44H13Z" fill="#080B10"/>
      <path d="m8 32 26-20h5L14 32H8Zm13 12 26-20h5L27 44h-6Z" fill="#F5F6F8"/>
      <text x="65" y="27" fill="#F5F6F8" fontFamily="Arial, sans-serif" fontWeight="900" fontStyle="italic" fontSize="26" letterSpacing="2">STADA</text>
      <text x="66" y="43" fill="#B7BDC7" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="7.7" letterSpacing="2.2">NEO TOKYO GRAND PRIX</text>
      <path d="M65 51h146" stroke="#F3293E" strokeWidth="2"/>
    </svg>
  </span>;
}
