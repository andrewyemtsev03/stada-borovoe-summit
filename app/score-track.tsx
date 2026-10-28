import type { CSSProperties } from 'react';
/** Timing bar normalized to the current leader. */
export default function ScoreTrack({ score, max, loaded }: { score: number; max: number; loaded: boolean }) {
  const progress = loaded && max > 0 ? Math.min(1, Math.max(0, score) / max) : 0;
  const pct = Math.round(progress * 100);
  return <div className={`timing-track ${progress > 0 ? 'has-score' : ''}`} aria-hidden="true" style={{ '--track-pct': `${pct}%` } as CSSProperties}>
    <span className="timing-rail"><span/></span><span className="timing-value">{loaded ? `${pct}%` : '—'}</span>
  </div>;
}
