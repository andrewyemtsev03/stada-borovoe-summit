'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Megaphone } from 'lucide-react';

export default function BroadcastBanner() {
  const pathname = usePathname();
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    if (pathname === '/admin' || pathname.startsWith('/admin/') || pathname === '/tv') return;
    let alive = true;
    const load = async () => {
      try {
        const response = await fetch('/api/scores', { cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json() as { banner?: string | null };
        if (alive) setBanner(data.banner ?? null);
      } catch { /* ignore */ }
    };
    void load();
    const timer = window.setInterval(load, 10000);
    return () => { alive = false; clearInterval(timer); };
  }, [pathname]);

  if (!banner || pathname === '/admin' || pathname.startsWith('/admin/') || pathname === '/tv') return null;
  return (
    <div className="broadcast-banner" role="status">
      <Megaphone size={18}/>
      <span>{banner}</span>
    </div>
  );
}
