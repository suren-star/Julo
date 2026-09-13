import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';

export const SESSION_TOKEN_BYTES = 32;
export const DEFAULT_SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
export const SESSION_COOKIE_NAME = '__Host-julo_session';

export function digestSessionToken(token) {
  if (typeof token !== 'string' || token.length < 32 || token.length > 256) throw new Error('Invalid session token.');
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

export function createSessionToken() {
  const token = randomBytes(SESSION_TOKEN_BYTES).toString('base64url');
  return { sessionId: randomUUID(), token, tokenHash: digestSessionToken(token) };
}

export function sessionTokenMatches(token, tokenHash) {
  if (typeof tokenHash !== 'string' || !/^[a-f0-9]{64}$/i.test(tokenHash)) return false;
  let actual;
  try { actual = Buffer.from(digestSessionToken(token), 'hex'); } catch { return false; }
  const expected = Buffer.from(tokenHash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function normalizeSameSite(value) {
  const normalized = String(value || 'Lax').trim().toLowerCase();
  if (normalized === 'none') return 'None';
  if (normalized === 'strict') return 'Strict';
  return 'Lax';
}

export function serializeSessionCookie(token, { maxAgeSeconds = DEFAULT_SESSION_TTL_SECONDS, secure = true, cookieName = SESSION_COOKIE_NAME, sameSite = 'Lax' } = {}) {
  if (!Number.isSafeInteger(maxAgeSeconds) || maxAgeSeconds <= 0) throw new Error('maxAgeSeconds must be a positive integer.');
  if (cookieName.startsWith('__Host-') && !secure) throw new Error('__Host- cookies require Secure.');
  const normalizedSameSite = normalizeSameSite(sameSite);
  if (normalizedSameSite === 'None' && !secure) throw new Error('SameSite=None cookies require Secure.');
  const attributes = [`${cookieName}=${token}`, 'Path=/', 'HttpOnly', `SameSite=${normalizedSameSite}`, `Max-Age=${maxAgeSeconds}`];
  if (secure) attributes.push('Secure');
  return attributes.join('; ');
}

export function serializeExpiredSessionCookie({ secure = true, cookieName = SESSION_COOKIE_NAME, sameSite = 'Lax' } = {}) {
  if (cookieName.startsWith('__Host-') && !secure) throw new Error('__Host- cookies require Secure.');
  const normalizedSameSite = normalizeSameSite(sameSite);
  if (normalizedSameSite === 'None' && !secure) throw new Error('SameSite=None cookies require Secure.');
  const attributes = [`${cookieName}=`, 'Path=/', 'HttpOnly', `SameSite=${normalizedSameSite}`, 'Max-Age=0'];
  if (secure) attributes.push('Secure');
  return attributes.join('; ');
}
