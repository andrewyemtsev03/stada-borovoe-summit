'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import ParticipantFinder from './participant-finder';
import { participants } from './teams';
type Participant = (typeof participants)[number];
const cookieName = 'stada_participant';
const skippedCookieName = 'stada_participant_skipped';
function expireCookie(name: string) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax${secure}`;
}
function rememberSkippedParticipant() {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${skippedCookieName}=1; Max-Age=${60 * 60 * 24 * 180}; Path=/; SameSite=Lax${secure}`;
}
function readSavedParticipant() {
  const entry = document.cookie.split('; ').find((cookie) => cookie.startsWith(`${cookieName}=`));
  if (!entry) return null;
  try {
    const saved = JSON.parse(decodeURIComponent(entry.slice(cookieName.length + 1)));
    return participants.find((person) => person.name === saved.name && person.teamId === saved.teamId)
      ?? participants.find((person) => person.name === saved.name)
      ?? null;
  } catch { return null; }
}
const ParticipantContext = createContext<{
  participant: Participant | null; ready: boolean; openFinder: () => void;
}>({ participant: null, ready: false, openFinder: () => {} });
export function ParticipantProvider({ children }: { children: React.ReactNode }) {
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = readSavedParticipant();
      setParticipant(saved);
      setReady(true);
    }, 0);
    const restore = () => setParticipant(readSavedParticipant());
    const visible = () => { if (document.visibilityState === 'visible') restore(); };
    window.addEventListener('focus', restore);
    document.addEventListener('visibilitychange', visible);
    return () => { clearTimeout(timer); window.removeEventListener('focus', restore); document.removeEventListener('visibilitychange', visible); };
  }, []);
  return <ParticipantContext.Provider value={{ participant, ready, openFinder: () => setOpen(true) }}>
    {children}
    <ParticipantFinder
      open={open}
      onOpenChange={setOpen}
      selectedParticipantName={participant?.name}
      onSkip={() => { rememberSkippedParticipant(); setOpen(false); }}
      onClear={() => {
        expireCookie(cookieName);
        rememberSkippedParticipant();
        setParticipant(null);
        setOpen(false);
      }}
      onSelect={(teamId, name) => {
      const person = participants.find((entry) => entry.teamId === teamId && entry.name === name);
      if (!person) return;
      const secure = window.location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = `${cookieName}=${encodeURIComponent(JSON.stringify({ teamId, name }))}; Max-Age=${60 * 60 * 24 * 180}; Path=/; SameSite=Lax${secure}`;
      expireCookie(skippedCookieName);
      setParticipant(person); setOpen(false);
    }}/>
  </ParticipantContext.Provider>;
}
export const useParticipant = () => useContext(ParticipantContext);
