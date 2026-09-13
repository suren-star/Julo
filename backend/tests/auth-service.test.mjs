import assert from 'node:assert/strict';
import test from 'node:test';
import { createAuthService } from '../src/auth/auth-service.js';

function memoryRepository() {
  const users = new Map(); const sessions = new Map();
  return {
    async createRegistration(input) {
      if ([...users.values()].some((u) => u.emailNormalized === input.emailNormalized || u.usernameNormalized === input.usernameNormalized)) { const e = new Error('duplicate'); e.code='23505'; throw e; }
      const user = { id: input.userId, usernameNormalized:input.usernameNormalized, emailNormalized: input.emailNormalized, displayName: input.displayName, passwordHash: input.passwordHash, disabledAt: null };
      users.set(user.id, user); return { user, workspace: { id: input.workspaceId, name: input.workspaceName } };
    },
    async findAuthUserByIdentifier(identifier,kind) { return [...users.values()].find((u) => kind==='username' ? u.usernameNormalized===identifier : u.emailNormalized===identifier) ?? null; },
    async findAuthUserByEmail(email) { return [...users.values()].find((u) => u.emailNormalized === email) ?? null; },
    async createSession(s) { sessions.set(s.tokenHash, { ...s, user: users.get(s.userId), revokedAt: null }); },
    async findActiveSessionByTokenHash(hash, at) { const s=sessions.get(hash); return s && !s.revokedAt && s.expiresAt > at ? { id:s.id, expiresAt:s.expiresAt, user:s.user } : null; },
    async touchSession() {}, async revokeSessionByTokenHash(hash, at) { const s=sessions.get(hash); if (s) s.revokedAt=at; },
  };
}

test('register creates normalized username/email user, workspace and server session', async () => {
  const repo=memoryRepository(); const auth=createAuthService(repo);
  const result=await auth.register({ username:' Owner.One ', email:'  USER@Example.COM ', displayName:' Suren ', password:'correct horse battery staple', workspaceName:' Julo Team ' });
  assert.equal(result.user.username,'owner.one'); assert.equal(result.user.email,'user@example.com');
  assert.equal(result.user.displayName,'Suren'); assert.equal(result.workspace.name,'Julo Team'); assert.ok(result.session.token.length >= 32);
  assert.equal((await auth.getSession(result.session.token)).user.id,result.user.id);
});

test('login accepts username or email and logout revokes session', async () => {
  const repo=memoryRepository(); const auth=createAuthService(repo);
  await auth.register({ username:'member1', email:'user@example.com', displayName:'User', password:'correct horse battery staple' });
  await assert.rejects(() => auth.login({ identifier:'member1', password:'incorrect password value' }), (e) => e.code==='invalid_credentials');
  const byUsername=await auth.login({ identifier:'MEMBER1', password:'correct horse battery staple' });
  assert.ok(await auth.getSession(byUsername.session.token));
  await auth.logout(byUsername.session.token); assert.equal(await auth.getSession(byUsername.session.token), null);
  const byEmail=await auth.login({ email:'USER@example.com', password:'correct horse battery staple' });
  assert.equal(byEmail.user.username,'member1');
});
