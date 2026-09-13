import assert from 'node:assert/strict';
import test from 'node:test';
import { hashPassword, verifyPassword } from '../src/security/password.js';
import {
  createSessionToken,
  digestSessionToken,
  serializeExpiredSessionCookie,
  serializeSessionCookie,
  sessionTokenMatches,
} from '../src/security/session-token.js';

test('password hashes are salted and verifiable', async () => {
  const password = 'correct horse battery staple';
  const first = await hashPassword(password);
  const second = await hashPassword(password);
  assert.notEqual(first, second);
  assert.equal(await verifyPassword(password, first), true);
  assert.equal(await verifyPassword('wrong password', first), false);
});

test('password hashing rejects short input', async () => {
  await assert.rejects(() => hashPassword('short'), /at least 12/);
});

test('session tokens persist only as digests', () => {
  const session = createSessionToken();
  assert.equal(session.tokenHash, digestSessionToken(session.token));
  assert.equal(sessionTokenMatches(session.token, session.tokenHash), true);
  assert.equal(sessionTokenMatches('x'.repeat(43), session.tokenHash), false);
});

test('session cookie uses secure host-only defaults', () => {
  const cookie = serializeSessionCookie('x'.repeat(43), { maxAgeSeconds: 3600 });
  assert.match(cookie, /^__Host-julo_session=/);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
  assert.match(cookie, /Secure/);
  assert.doesNotMatch(cookie, /Domain=/);
  assert.match(serializeExpiredSessionCookie(), /Max-Age=0/);
});
