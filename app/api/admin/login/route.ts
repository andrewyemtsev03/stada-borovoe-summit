import { cookies } from 'next/headers';
import {
  ORGANIZER_COOKIE,
  ORGANIZER_ROLE_COOKIE,
  isOrganizerPassword,
  isSameOrigin,
  organizerCookieOptions,
  roleForPassword,
} from '@/lib/organizer-session';

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: 'Недопустимый источник запроса.' }, { status: 403 });
  let password: unknown;
  let role: unknown;
  try {
    ({ password, role } = await request.json() as { password?: unknown; role?: unknown });
  } catch {
    return Response.json({ error: 'Введите пароль.' }, { status: 400 });
  }
  if (!isOrganizerPassword(password)) return Response.json({ error: 'Неверный пароль.' }, { status: 401 });
  const resolved = typeof role === 'string' && (role === 'director' || role === 'judge')
    ? role
    : roleForPassword(String(password));
  const cookieStore = await cookies();
  cookieStore.set(ORGANIZER_COOKIE, String(password), organizerCookieOptions);
  cookieStore.set(ORGANIZER_ROLE_COOKIE, resolved, organizerCookieOptions);
  return Response.json({ ok: true, role: resolved });
}
