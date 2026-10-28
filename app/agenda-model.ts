import data from './agenda-data.json';

export type AgendaEvent = {
  id: string; date: string; start: string; end: string; allDay: boolean;
  title: string; location: string; lead?: string; block?: boolean;
  teamId?: number; round?: number; opponentId?: number; note?: string;
  details?: { start: string; end: string; title: string; lead?: string }[];
};

/** Neo-Tokyo GP weekend: arrival → FP/Quali → Finals → Victory lap. */
export const eventDays = ['2026-04-13', '2026-04-14', '2026-04-15', '2026-04-16'];
export const agendaTimezone = 'Asia/Tokyo';
export const agendaUtcOffset = '+09:00';

export function getAgenda(teamId?: number | null): AgendaEvent[] {
  const general: AgendaEvent[] = [...data.general]
    .sort((a, b) => `${a.date}T${a.start}`.localeCompare(`${b.date}T${b.start}`));
  if (!teamId) return general;
  const rounds = data.personal.filter((event) => event.teamId === teamId);
  if (!rounds.length) return general;
  return [
    ...general.filter((event) => !event.block), ...rounds,
  ].sort((a, b) => `${a.date}T${a.start}`.localeCompare(`${b.date}T${b.start}`));
}

export function eventStart(event: AgendaEvent) {
  return Date.parse(`${event.date}T${event.start}:00${agendaUtcOffset}`);
}
export function eventEnd(event: AgendaEvent) {
  return event.allDay
    ? eventStart(event) + 86_400_000
    : Date.parse(`${event.date}T${event.end}:00${agendaUtcOffset}`);
}
export function getAgendaStatus(events: AgendaEvent[], now: number) {
  const timeline = events.flatMap((event) => event.details?.length
    ? event.details.map((detail) => ({ ...event, ...detail, details: undefined }))
    : [event]);
  return {
    current: timeline.find((event) => eventStart(event) <= now && now < eventEnd(event)),
    next: timeline.find((event) => eventStart(event) > now),
  };
}
export function dayLabel(date: string) {
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', timeZone: agendaTimezone }).format(new Date(`${date}T12:00:00${agendaUtcOffset}`));
}
export function timeLabel(event: AgendaEvent) {
  return event.allDay ? 'Весь день' : event.start === event.end ? event.start : `${event.start}–${event.end}`;
}
