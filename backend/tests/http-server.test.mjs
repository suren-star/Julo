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

test('workspace routes derive user id from server session', async () => {
  const token='y'.repeat(43);
  const calls=[];
  const authService={async getSession(value){return value===token?{user:{id:'server-user'}}:null},async logout(){}};
  const workspaceService={
    async listWorkspaces(userId){calls.push(userId);return [{id:'workspace-123'}]},
    async createTask(userId,workspaceId,input){calls.push({userId,workspaceId,input});return {id:'task-1',createdBy:userId}},
  };
  await withServer({authService,workspaceService}, async (base) => {
    const headers={cookie:`__Host-julo_session=${token}`};
    const list=await fetch(base+'/api/workspaces',{headers});
    assert.equal(list.status,200); assert.equal((await list.json()).workspaces[0].id,'workspace-123');
    const create=await fetch(base+'/api/workspaces/workspace-123/tasks',{method:'POST',headers:{...headers,'content-type':'application/json'},body:JSON.stringify({title:'X',currentUserId:'attacker'})});
    assert.equal(create.status,201);
    assert.equal((await create.json()).task.createdBy,'server-user');
    assert.equal(calls[0],'server-user');
    assert.equal(calls[1].userId,'server-user');
  });
});

test('workspace routes reject missing server session', async () => {
  const authService={async getSession(){return null},async logout(){}};
  const workspaceService={async listWorkspaces(){throw new Error('should not run')}};
  await withServer({authService,workspaceService}, async (base) => {
    const response=await fetch(base+'/api/workspaces');
    assert.equal(response.status,401);
    assert.equal((await response.json()).error.code,'not_authenticated');
  });
});
