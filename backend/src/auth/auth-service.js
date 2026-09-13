import { randomUUID } from 'node:crypto';
import { hashPassword, verifyPassword } from '../security/password.js';
import { createSessionToken, digestSessionToken, DEFAULT_SESSION_TTL_SECONDS } from '../security/session-token.js';

export class AuthError extends Error {
  constructor(status, code, message) { super(message); this.name = 'AuthError'; this.status = status; this.code = code; }
}

export function normalizeEmail(value) {
  if (typeof value !== 'string') throw new AuthError(400, 'invalid_email', 'Email is required.');
  const email = value.trim().toLowerCase();
  if (email.length < 3 || email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AuthError(400, 'invalid_email', 'Email is invalid.');
  }
  return email;
}

export function normalizeUsername(value) {
  if (typeof value !== 'string') throw new AuthError(400, 'invalid_username', 'Username is required.');
  const username = value.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(username)) {
    throw new AuthError(400, 'invalid_username', 'Username must be 3-32 characters using letters, numbers, dot, underscore or dash.');
  }
  return username;
}

function cleanText(value, { field, min = 1, max }) {
  if (typeof value !== 'string') throw new AuthError(400, `invalid_${field}`, `${field} is required.`);
  const cleaned = value.trim();
  if (cleaned.length < min || cleaned.length > max) throw new AuthError(400, `invalid_${field}`, `${field} is invalid.`);
  return cleaned;
}

function publicUser(row) {
  return { id: row.id, username: row.usernameNormalized ?? null, email: row.emailNormalized, displayName: row.displayName };
}

export function createAuthService(repository, { now = () => new Date(), sessionTtlSeconds = DEFAULT_SESSION_TTL_SECONDS } = {}) {
  if (!repository) throw new TypeError('repository is required');
  if (!Number.isSafeInteger(sessionTtlSeconds) || sessionTtlSeconds <= 0) throw new TypeError('sessionTtlSeconds must be positive');
  let dummyHashPromise;
  const getDummyHash = () => (dummyHashPromise ??= hashPassword('julo-dummy-password-for-timing'));

  async function issueSession(userId) {
    const created = createSessionToken();
    const createdAt = now();
    const expiresAt = new Date(createdAt.getTime() + sessionTtlSeconds * 1000);
    await repository.createSession({ id: created.sessionId, userId, tokenHash: created.tokenHash, createdAt, expiresAt });
    return { token: created.token, expiresAt, maxAgeSeconds: sessionTtlSeconds };
  }

  return {
    async register(input) {
      const usernameNormalized = normalizeUsername(input?.username);
      const emailNormalized = normalizeEmail(input?.email);
      const displayName = cleanText(input?.displayName, { field: 'display_name', max: 160 });
      const workspaceName = cleanText(input?.workspaceName ?? 'Julo Workspace', { field: 'workspace_name', max: 160 });
      const passwordHash = await hashPassword(input?.password);
      const userId = randomUUID();
      const workspaceId = randomUUID();
      let result;
      try {
        result = await repository.createRegistration({ userId, usernameNormalized, emailNormalized, displayName, passwordHash, workspaceId, workspaceName, createdAt: now() });
      } catch (error) {
        if (error?.code === '23505') throw new AuthError(409, 'identity_already_registered', 'Username or email is already registered.');
        throw error;
      }
      const session = await issueSession(userId);
      return { user: publicUser(result.user), workspace: result.workspace, session };
    },

    async login(input) {
      const rawIdentifier = input?.identifier ?? input?.username ?? input?.email;
      if (typeof rawIdentifier !== 'string' || !rawIdentifier.trim()) throw new AuthError(400, 'invalid_identifier', 'Username or email is required.');
      const kind = rawIdentifier.includes('@') ? 'email' : 'username';
      const identifier = kind === 'email' ? normalizeEmail(rawIdentifier) : normalizeUsername(rawIdentifier);
      const user = repository.findAuthUserByIdentifier
        ? await repository.findAuthUserByIdentifier(identifier, kind)
        : await repository.findAuthUserByEmail(identifier);
      const passwordHash = user?.passwordHash ?? await getDummyHash();
      const passwordValid = await verifyPassword(input?.password ?? '', passwordHash);
      const valid = Boolean(user && !user.disabledAt && passwordValid);
      if (!valid) throw new AuthError(401, 'invalid_credentials', 'Username/email or password is invalid.');
      const session = await issueSession(user.id);
      return { user: publicUser(user), session };
    },

    async getSession(token) {
      if (!token) return null;
      let tokenHash;
      try { tokenHash = digestSessionToken(token); } catch { return null; }
      const session = await repository.findActiveSessionByTokenHash(tokenHash, now());
      if (!session) return null;
      await repository.touchSession(session.id, now());
      return { user: publicUser(session.user), session: { id: session.id, expiresAt: session.expiresAt } };
    },

    async logout(token) {
      if (!token) return;
      let tokenHash;
      try { tokenHash = digestSessionToken(token); } catch { return; }
      await repository.revokeSessionByTokenHash(tokenHash, now());
    },
  };
}
