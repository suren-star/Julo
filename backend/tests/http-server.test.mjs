import assert from 'node:assert/strict';
import test from 'node:test';
import { once } from 'node:events';
import { createHttpServer } from '../src/http/server.js';

async function withServer(options, fn) {
  const server=createHttpServer(options); server.listen(0,'127.0.0.1'); await once(server,'listening');
  const {port}=server.address();
  try { await fn(`http://127.0.0.1:${port}`); } finally { server.close(); await once(server,'close'); }
}

test('auth HTTP endpoints issue cookie and return session', async () => {
  const token='x'.repeat(43);
  const authService={
    async register(){ return { user:{id:'u1',email:'u@example.com',displayName:'U'}, workspace:{id:'w1',name:'Julo'}, session:{token,maxAgeSeconds:3600} }; },
    async getSession(value){ return value===token ? {user:{id:'u1',email:'u@example.com',displayName:'U'},session:{id:'s1'}} : null; },
    async logout(){},
  };
  await withServer({authService,secureCookies:true}, async (base) => {
    const register=await fetch(base+'/api/auth/register',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({})});
    assert.equal(register.status,201);
    const cookie=register.headers.get('set-cookie'); assert.match(cookie,/^__Host-julo_session=/); assert.match(cookie,/Secure/);
    const session=await fetch(base+'/api/auth/session',{headers:{cookie:`__Host-julo_session=${token}`}});
    assert.equal(session.status,200); assert.equal((await session.json()).user.id,'u1');
  });
});

test('cross-site auth mutation is blocked', async () => {
  const authService={async login(){throw new Error('should not run')},async getSession(){return null},async logout(){}};
  await withServer({authService}, async (base) => {
    const response=await fetch(base+'/api/auth/login',{method:'POST',headers:{'content-type':'application/json','sec-fetch-site':'cross-site'},body:'{}'});
    assert.equal(response.status,403);
    assert.equal((await response.json()).error.code,'cross_site_request_blocked');
  });
});
