import { cookies } from 'next/headers';
import { ORGANIZER_COOKIE, ORGANIZER_ROLE_COOKIE, isSameOrigin } from '@/lib/organizer-session';

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: 'Недопустимый источник запроса.' }, { status: 403 });
  const cookieStore = await cookies();
  cookieStore.delete(ORGANIZER_COOKIE);
  cookieStore.delete(ORGANIZER_ROLE_COOKIE);
  return Response.json({ ok: true });
}
