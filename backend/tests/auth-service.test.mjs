import assert from 'node:assert/strict';
import test from 'node:test';
import { createAuthService } from '../src/auth/auth-service.js';

function memoryRepository() {
  const users = new Map(); const sessions = new Map();
  return {
    async createRegistration(input) {
      if ([...users.values()].some((u) => u.emailNormalized === input.emailNormalized)) { const e = new Error('duplicate'); e.code='23505'; throw e; }
      const user = { id: input.userId, emailNormalized: input.emailNormalized, displayName: input.displayName, passwordHash: input.passwordHash, disabledAt: null };
      users.set(user.id, user);
      return { user, workspace: { id: input.workspaceId, name: input.workspaceName } };
    },
    async findAuthUserByEmail(email) { return [...users.values()].find((u) => u.emailNormalized === email) ?? null; },
    async createSession(s) { sessions.set(s.tokenHash, { ...s, user: users.get(s.userId), revokedAt: null }); },
    async findActiveSessionByTokenHash(hash, at) { const s=sessions.get(hash); return s && !s.revokedAt && s.expiresAt > at ? { id:s.id, expiresAt:s.expiresAt, user:s.user } : null; },
    async touchSession() {},
    async revokeSessionByTokenHash(hash, at) { const s=sessions.get(hash); if (s) s.revokedAt=at; },
  };
}

test('register creates normalized user, workspace and server session', async () => {
  const repo=memoryRepository(); const auth=createAuthService(repo);
  const result=await auth.register({ email:'  USER@Example.COM ', displayName:' Suren ', password:'correct horse battery staple', workspaceName:' Julo Team ' });
  assert.equal(result.user.email,'user@example.com');
  assert.equal(result.user.displayName,'Suren');
  assert.equal(result.workspace.name,'Julo Team');
  assert.ok(result.session.token.length >= 32);
  const session=await auth.getSession(result.session.token);
  assert.equal(session.user.id,result.user.id);
});

test('login rejects wrong password and logout revokes session', async () => {
  const repo=memoryRepository(); const auth=createAuthService(repo);
  await auth.register({ email:'user@example.com', displayName:'User', password:'correct horse battery staple' });
  await assert.rejects(() => auth.login({ email:'user@example.com', password:'incorrect password value' }), (e) => e.code==='invalid_credentials');
  const login=await auth.login({ email:'USER@example.com', password:'correct horse battery staple' });
  assert.ok(await auth.getSession(login.session.token));
  await auth.logout(login.session.token);
  assert.equal(await auth.getSession(login.session.token), null);
});
