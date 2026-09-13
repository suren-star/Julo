import assert from 'node:assert/strict';
import test from 'node:test';
import { createPostgresRepository } from '../src/db/postgres-repository.js';

test('findAuthUserByEmail uses parameterized query', async () => {
  const calls=[];
  const pool={ async query(sql, params){ calls.push({sql,params}); return {rows:[{id:'u1',email_normalized:'a@example.com',display_name:'A',disabled_at:null,password_hash:'hash'}]}; } };
  const repo=createPostgresRepository(pool);
  const user=await repo.findAuthUserByEmail('a@example.com');
  assert.equal(user.id,'u1');
  assert.deepEqual(calls[0].params,['a@example.com']);
  assert.match(calls[0].sql,/\$1/);
});

test('createTask persists initial done status and completed timer in one transaction', async () => {
  const calls=[];
  const pool={
    async query(sql, params){
      calls.push({sql,params});
      if (/INSERT INTO tasks/.test(sql)) return {rows:[{id:'task-123',status:params[5],version:1}]};
      return {rows:[]};
    },
  };
  const repo=createPostgresRepository(pool);
  const task=await repo.createTask({
    id:'task-123',
    workspaceId:'workspace-123',
    projectId:null,
    title:'Done now',
    description:'',
    status:'done',
    executionType:'execute',
    dueDate:'2026-09-20',
    priority:'normal',
    createdBy:'user-12345',
    assigneeUserIds:['user-12345'],
    primaryAssigneeUserId:'user-12345',
    tags:[],
  });

  assert.equal(task.status,'done');
  assert.equal(calls[0].sql,'BEGIN');
  assert.equal(calls.at(-1).sql,'COMMIT');

  const taskInsert=calls.find((call)=>/INSERT INTO tasks/.test(call.sql));
  assert.equal(taskInsert.params[5],'done');

  const timerInsert=calls.find((call)=>/INSERT INTO task_timers/.test(call.sql));
  assert.equal(timerInsert.params[2],'stopped');
  assert.ok(timerInsert.params[3] instanceof Date);
  assert.equal(timerInsert.params[4],'completed');

  const auditInsert=calls.find((call)=>/INSERT INTO audit_events/.test(call.sql));
  const metadata=JSON.parse(auditInsert.params[3]);
  assert.equal(metadata.status,'done');
});
