import { cookies } from 'next/headers';
import {
  ORGANIZER_COOKIE,
  isOrganizerPassword,
  isSameOrigin,
  roleForPassword,
} from '@/lib/organizer-session';
import {
  getAdminScoreboard,
  getPublicScoreboard,
  setCell,
  setManyCells,
} from '@/lib/race-store';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'no-store' };

export async function GET(request: Request) {
  const url = new URL(request.url);
  const admin = url.searchParams.get('admin') === '1';
  try {
    if (admin) {
      const cookieStore = await cookies();
      const password = cookieStore.get(ORGANIZER_COOKIE)?.value;
      if (!isOrganizerPassword(password)) {
        return Response.json({ error: 'Сессия истекла.' }, { status: 401, headers });
      }
      const state = await getAdminScoreboard();
      return Response.json(state, { headers });
    }
    const board = await getPublicScoreboard();
    return Response.json(board, { headers });
  } catch (error) {
    console.error('Load scores failed', error);
    return Response.json({ error: 'Результаты временно недоступны.' }, { status: 503, headers });
  }
}

export async function PATCH(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: 'Недопустимый источник запроса.' }, { status: 403, headers });
  const cookieStore = await cookies();
  const password = cookieStore.get(ORGANIZER_COOKIE)?.value;
  if (!isOrganizerPassword(password)) return Response.json({ error: 'Сессия истекла. Войдите снова.' }, { status: 401, headers });
  const who = roleForPassword(password) === 'judge' ? 'Судья сектора' : 'Главный директор';

  let body: unknown;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Некорректный запрос.' }, { status: 400, headers });
  }

  try {
    const payload = body as {
      teamId?: number; gameId?: number; score?: number; previous?: number; reason?: string;
      changes?: { teamId: number; gameId: number; score: number }[];
    };

    if (Array.isArray(payload.changes)) {
      const state = await setManyCells({ changes: payload.changes, who });
      return Response.json(state, { headers });
    }

    if (typeof payload.teamId !== 'number' || typeof payload.gameId !== 'number' || typeof payload.score !== 'number') {
      return Response.json({ error: 'Укажите teamId, gameId и score.' }, { status: 400, headers });
    }
    const state = await setCell({
      teamId: payload.teamId,
      gameId: payload.gameId,
      score: payload.score,
      who,
      reason: payload.reason,
    });
    return Response.json(state, { headers });
  } catch (error) {
    console.error('Save score failed', error);
    return Response.json({ error: error instanceof Error ? error.message : 'Не удалось сохранить.' }, { status: 400, headers });
  }
}
