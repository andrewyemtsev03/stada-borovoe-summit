import { addBoost, getBoosts } from '@/lib/fan-boost-store';
import { isSameOrigin } from '@/lib/organizer-session';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'no-store' };

export async function GET() {
  try {
    return Response.json({ boosts: await getBoosts() }, { headers });
  } catch {
    return Response.json({ boosts: {} }, { headers });
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return Response.json({ error: 'Недопустимый источник запроса.' }, { status: 403, headers });
  }
  let teamId: unknown;
  try {
    ({ teamId } = await request.json() as { teamId?: unknown });
  } catch {
    return Response.json({ error: 'Некорректный запрос.' }, { status: 400, headers });
  }
  if (typeof teamId !== 'number' || !Number.isInteger(teamId)) {
    return Response.json({ error: 'Укажите команду.' }, { status: 400, headers });
  }
  try {
    const boosts = await addBoost(teamId);
    return Response.json({ ok: true, boosts }, { headers });
  } catch {
    return Response.json({ error: 'Не удалось сохранить буст.' }, { status: 400, headers });
  }
}
