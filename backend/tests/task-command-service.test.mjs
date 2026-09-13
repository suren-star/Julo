import assert from 'node:assert/strict';
import test from 'node:test';
import { createTaskCommandService } from '../src/services/task-command-service.js';

function fakeRepository({ role='member', projectRole=null, taskStatus='doing', version=3, timerState='paused' } = {}) {
  const calls=[];
  return {
    calls,
    async withTaskMutationContext(input, callback) {
      const context={
        membership:{ role, status:'active' },
        projectRole,
        task:{ id:input.taskId, workspace_id:input.workspaceId, project_id:'project-12345678', status:taskStatus, version },
        timer:{ state:timerState, elapsed_ms:1200 },
        tx:{
          async updateTask(changes, expectedVersion){ calls.push(['updateTask',changes,expectedVersion]); return { ...context.task, ...changes, version:expectedVersion+1 }; },
          async completeTimer(){ calls.push(['completeTimer']); return {state:'stopped'}; },
          async reopenTimer(){ calls.push(['reopenTimer']); return {state:'paused'}; },
          async pauseOtherRunningTimers(){ calls.push(['pauseOthers']); },
          async startTimer(){ calls.push(['startTimer']); return {state:'running'}; },
          async pauseTimer(){ calls.push(['pauseTimer']); return {state:'paused'}; },
          async stopTimer(_now,reason){ calls.push(['stopTimer',reason]); return {state:'stopped',stopReason:reason}; },
          async audit(action,metadata){ calls.push(['audit',action,metadata]); },
        },
      };
      return callback(context);
    },
  };
}

test('member updates task with optimistic version and audit', async () => {
  const repository=fakeRepository();
  const service=createTaskCommandService(repository);
  const task=await service.updateTask('user-12345678','workspace-12345678','task-12345678',{expectedVersion:3,title:' Updated '});
  assert.equal(task.title,'Updated');
  assert.equal(task.version,4);
  assert.equal(repository.calls[0][0],'updateTask');
  assert.equal(repository.calls.some(c=>c[1]==='task.updated'),true);
});

test('version mismatch rejects before mutation', async () => {
  const repository=fakeRepository({version:4});
  const service=createTaskCommandService(repository);
  await assert.rejects(()=>service.updateTask('user-12345678','workspace-12345678','task-12345678',{expectedVersion:3,title:'x'}),e=>e.status===409&&e.code==='task_version_conflict');
  assert.equal(repository.calls.length,0);
});

test('completion stops timer as completed', async () => {
  const repository=fakeRepository({role:'member',taskStatus:'doing',timerState:'running'});
  const service=createTaskCommandService(repository);
  await service.updateTask('user-12345678','workspace-12345678','task-12345678',{expectedVersion:3,status:'done'});
  assert.equal(repository.calls[0][0],'completeTimer');
  assert.equal(repository.calls.some(c=>c[1]==='task.status.changed'),true);
});

test('only owner/admin can reopen completed task', async () => {
  const member=fakeRepository({role:'member',taskStatus:'done',timerState:'stopped'});
  await assert.rejects(()=>createTaskCommandService(member).updateTask('user-12345678','workspace-12345678','task-12345678',{expectedVersion:3,status:'doing'}),e=>e.status===409);
  const owner=fakeRepository({role:'owner',taskStatus:'done',timerState:'stopped'});
  await createTaskCommandService(owner).updateTask('user-12345678','workspace-12345678','task-12345678',{expectedVersion:3,status:'doing'});
  assert.equal(owner.calls[0][0],'reopenTimer');
});

test('timer start auto-pauses other workspace timer first', async () => {
  const repository=fakeRepository({timerState:'paused'});
  const timer=await createTaskCommandService(repository).timerCommand('user-12345678','workspace-12345678','task-12345678','start');
  assert.equal(timer.state,'running');
  assert.deepEqual(repository.calls.slice(0,2).map(c=>c[0]),['pauseOthers','startTimer']);
});

test('stopped timer cannot restart normally', async () => {
  const repository=fakeRepository({timerState:'stopped'});
  await assert.rejects(()=>createTaskCommandService(repository).timerCommand('user-12345678','workspace-12345678','task-12345678','start'),e=>e.status===409&&e.code==='invalid_timer_transition');
});

test('viewer cannot control timer', async () => {
  const repository=fakeRepository({role:'viewer',timerState:'runningg});
  await assert.rejects(()=>createTaskCommandService(repository).timerCommand('user-12345678','workspace-12345678','task-12345678','pause'),e=>e.status===403);
});

test('guest editor can control project timer but guest viewer cannot', async () => {
  const editor=fakeRepository({role:'guest',projectRole:'editor',timerState:'running'});
  await createTaskCommandService(editor).timerCommand('user-12345678','workspace-12345678','task-12345678','pause');
  assert.equal(editor.calls[0][0],'pauseTimer');
  const viewer=fakeRepository({role:'guest',projectRole:'viewer',timerState:'running'});
  await assert.rejects(()=>createTaskCommandService(viewer).timerCommand('user-12345678','workspace-12345678','task-12345678','pause'),e=>e.status===403);
});

test('completed tasks reject timer commands until reopened', async () => {
  const repository=fakeRepository({role:'owner',taskStatus:'done',timerState:'stopped'});
  await assert.rejects(()=>createTaskCommandService(repository).timerCommand('user-12345678','workspace-12345678','task-12345678','start'),e=>e.code==='completed_task_timer_forbidden');
});
