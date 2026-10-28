import { cookies } from 'next/headers';
import {
  ORGANIZER_COOKIE,
  ORGANIZER_ROLE_COOKIE,
  isDirectorSession,
  isOrganizerPassword,
  isSameOrigin,
  roleForPassword,
} from '@/lib/organizer-session';
import {
  applyBonus,
  getAdminScoreboard,
  loadDemo,
  resetScores,
  setControls,
  toCsv,
  undoLast,
} from '@/lib/race-store';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'no-store' };

async function requireOrganizer() {
  const cookieStore = await cookies();
  const password = cookieStore.get(ORGANIZER_COOKIE)?.value;
  const role = cookieStore.get(ORGANIZER_ROLE_COOKIE)?.value;
  if (!isOrganizerPassword(password)) return null;
  return { password: password!, role: role || roleForPassword(password!), cookieStore };
}

export async function GET(request: Request) {
  const auth = await requireOrganizer();
  if (!auth) return Response.json({ error: 'Сессия истекла.' }, { status: 401, headers });
  const format = new URL(request.url).searchParams.get('export');
  const state = await getAdminScoreboard();
  if (format === 'csv') {
    return new Response(toCsv(state), {
      headers: {
        ...headers,
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="neo-tokyo-scores.csv"',
      },
    });
  }
  if (format === 'json') {
    return new Response(JSON.stringify(state, null, 2), {
      headers: {
        ...headers,
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': 'attachment; filename="neo-tokyo-scores.json"',
      },
    });
  }
  return Response.json(state, { headers });
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: 'Недопустимый источник.' }, { status: 403, headers });
  const auth = await requireOrganizer();
  if (!auth) return Response.json({ error: 'Сессия истекла.' }, { status: 401, headers });
  const who = auth.role === 'judge' ? 'Судья сектора' : 'Главный директор';
  const director = isDirectorSession(auth.password, auth.role);

  let body: { action?: string; [key: string]: unknown };
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Некорректный запрос.' }, { status: 400, headers });
  }

  try {
    switch (body.action) {
      case 'bonus': {
        if (typeof body.teamId !== 'number' || typeof body.delta !== 'number' || typeof body.reason !== 'string') {
          return Response.json({ error: 'Нужны teamId, delta, reason.' }, { status: 400, headers });
        }
        const state = await applyBonus({
          teamId: body.teamId,
          delta: body.delta,
          reason: body.reason,
          who,
          gameId: typeof body.gameId === 'number' ? body.gameId : undefined,
        });
        return Response.json(state, { headers });
      }
      case 'controls': {
        if (!director) return Response.json({ error: 'Только главный директор.' }, { status: 403, headers });
        const state = await setControls({
          freezeTop3: typeof body.freezeTop3 === 'boolean' ? body.freezeTop3 : undefined,
          banner: body.banner === null || typeof body.banner === 'string' ? body.banner as string | null : undefined,
          who,
        });
        return Response.json(state, { headers });
      }
      case 'demo': {
        if (!director) return Response.json({ error: 'Только главный директор.' }, { status: 403, headers });
        return Response.json(await loadDemo(who), { headers });
      }
      case 'reset': {
        if (!director) return Response.json({ error: 'Только главный директор.' }, { status: 403, headers });
        return Response.json(await resetScores(who), { headers });
      }
      case 'undo': {
        return Response.json(await undoLast(who), { headers });
      }
      default:
        return Response.json({ error: 'Неизвестное действие.' }, { status: 400, headers });
    }
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Ошибка Race Control.' }, { status: 400, headers });
  }
}
