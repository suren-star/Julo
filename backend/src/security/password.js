import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const FORMAT = 'scrypt';
const KEY_LENGTH = 64;
const DEFAULTS = Object.freeze({ N: 16384, r: 8, p: 1 });
const MAX_PASSWORD_BYTES = 256;

function assertPasswordInput(password) {
  if (typeof password !== 'string') throw new TypeError('Password must be a string.');
  const byteLength = Buffer.byteLength(password, 'utf8');
  if (byteLength < 12) throw new Error('Password must be at least 12 UTF-8 bytes.');
  if (byteLength > MAX_PASSWORD_BYTES) throw new Error('Password is too long.');
}

export async function hashPassword(password, params = DEFAULTS) {
  assertPasswordInput(password);
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, KEY_LENGTH, {
    N: params.N,
    r: params.r,
    p: params.p,
    maxmem: 64 * 1024 * 1024,
  });
  return [
    FORMAT,
    params.N,
    params.r,
    params.p,
    salt.toString('base64url'),
    Buffer.from(derived).toString('base64url'),
  ].join('$');
}

export async function verifyPassword(password, encoded) {
  if (typeof password !== 'string' || typeof encoded !== 'string') return false;
  const parts = encoded.split('$');
  if (parts.length !== 6 || parts[0] !== FORMAT) return false;

  const [N, r, p] = parts.slice(1, 4).map(Number);
  if (![N, r, p].every(Number.isSafeInteger) || N < 2 || r < 1 || p < 1) return false;

  let salt;
  let expected;
  try {
    salt = Buffer.from(parts[4], 'base64url');
    expected = Buffer.from(parts[5], 'base64url');
  } catch {
    return false;
  }
  if (salt.length < 16 || expected.length !== KEY_LENGTH) return false;

  let actual;
  try {
    actual = Buffer.from(await scrypt(password, salt, expected.length, {
      N,
      r,
      p,
      maxmem: 64 * 1024 * 1024,
    }));
  } catch {
    return false;
  }
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
