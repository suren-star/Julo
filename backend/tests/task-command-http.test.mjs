import assert from 'node:assert/strict';
import test from 'node:test';
import { once } from 'node:events';
import { createHttpServer } from '../src/http/server.js';

async function withServer(options, fn) {
  const server=createHttpServer(options);
  server.listen(0,'127.0.0.1');
  await once(server,'listening');
  const {port}=server.address();
  try { await fn(`http://127.0.0.1:${port}`); }
  finally { server.close(); await once(server,'close'); }
}

test('task mutation routes use server session identity and expose timer commands', async () => {
  const token='t'.repeat(43);
  const calls=[];
  const authService={async getSession(value){return value===token?{user:{id:'server-user'}}:null},async logout(){}};
  const workspaceService={async listWorkspaces(){return []}};
  const taskCommandService={
    async updateTask(userId,workspaceId,taskId,input){calls.push(['update',userId,workspaceId,taskId,input]);return {id:taskId,version:input.expectedVersion+1};},
    async timerCommand(userId,workspaceId,taskId,command){calls.push(['timer',userId,workspaceId,taskId,command]);return {state:'running'};},
  };
  await withServer({authService,workspaceService,taskCommandService}, async (base) => {
    const headers={cookie:`__Host-julo_session=${token}`};
    const patch=await fetch(base+'/api/workspaces/workspace-12345678/tasks/task-12345678',{
      method:'PATCH',headers:{...headers,'content-type':'application/json'},
      body:JSON.stringify({expectedVersion:3,title:'Updated',currentUserId:'attacker'}),
    });
    assert.equal(patch.status,200);
    assert.equal(calls[0][1],'server-user');
    assert.equal(calls[0][4].currentUserId,'attacker');

    const start=await fetch(base+'/api/workspaces/workspace-12345678/tasks/task-12345678/timer/start',{method:'POST',headers});
    assert.equal(start.status,200);
    assert.equal((await start.json()).timer.state,'running');
    assert.deepEqual(calls[1].slice(0,5),['timer','server-user','workspace-12345678','task-12345678','start']);
  });
});

test('task mutation route requires authentication', async () => {
  const authService={async getSession(){return null},async logout(){}};
  const workspaceService={};
  const taskCommandService={async updateTask(){throw new Error('should not run')}};
  await withServer({authService,workspaceService,taskCommandService}, async (base) => {
    const response=await fetch(base+'/api/workspaces/workspace-12345678/tasks/task-12345678',{
      method:'PATCH',headers:{'content-type':'application/json'},body:'{}',
    });
    assert.equal(response.status,401);
  });
});
