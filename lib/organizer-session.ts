import 'server-only';
import { createHash, timingSafeEqual } from 'node:crypto';

export const ORGANIZER_COOKIE = 'stada_organizer_session';
export const ORGANIZER_ROLE_COOKIE = 'stada_organizer_role';

export type OrganizerRole = 'director' | 'judge';

const PASSWORDS: Record<string, OrganizerRole> = {
  // stada2026
  '04a1ddde5bfb8b55e0e550ac043219e2fb7a95a5d9b69662a6c1b74adaa0074a': 'director',
  // judge2026 — sector judge demo
  '32ec4bd52cb4cbd0abbfefaf94c3e3cf6ebc0a31d2222f9793b4ad781cf0ac31': 'judge',
};

function passwordHashHex(value: string) {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function passwordHash(value: string) {
  return createHash('sha256').update(value, 'utf8').digest();
}

/** Accept demo director / judge passwords (and legacy hash if ever needed). */
export function isOrganizerPassword(value: unknown): value is string {
  if (typeof value !== 'string' || !value) return false;
  const hex = passwordHashHex(value);
  if (hex in PASSWORDS) return true;
  // also accept plaintext demo passwords before hash map edge cases
  return value === 'stada2026' || value === 'judge2026';
}

export function roleForPassword(value: string): OrganizerRole {
  if (value === 'judge2026') return 'judge';
  if (value === 'stada2026') return 'director';
  const hex = passwordHashHex(value);
  return PASSWORDS[hex] ?? 'director';
}

export function isDirectorSession(password: unknown, roleCookie?: string): boolean {
  if (!isOrganizerPassword(password)) return false;
  if (roleCookie === 'judge') return false;
  return roleForPassword(String(password)) === 'director' || roleCookie === 'director';
}

export const organizerCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 8,
};

export function isSameOrigin(request: Request) {
  // Next can build request.url from its listen address (0.0.0.0).
  // Host retains the address the browser actually used to reach the site.
  const requestHost = request.headers.get('host') ?? new URL(request.url).host;
  const origin = request.headers.get('origin');
  if (!origin) {
    // Same-origin navigations / some tooling omit Origin; allow host match via Referer.
    const referer = request.headers.get('referer');
    if (!referer) return false;
    try {
      return new URL(referer).host === requestHost;
    } catch {
      return false;
    }
  }
  try {
    const originUrl = new URL(origin);
    // Treat localhost / 127.0.0.1 as equivalent for local demo & screenshots.
    const normalize = (host: string) => host.replace('127.0.0.1', 'localhost');
    return normalize(originUrl.host) === normalize(requestHost);
  } catch {
    return false;
  }
}

export function verifyPasswordTimingSafe(value: string, expectedPlain: string) {
  const actual = passwordHash(value);
  const expected = passwordHash(expectedPlain);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
