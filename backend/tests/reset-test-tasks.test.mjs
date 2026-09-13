import assert from 'node:assert/strict';
import test from 'node:test';
import { resetTestWorkspaceTasks } from '../src/testing/reset-test-tasks.js';
import { TEST_WORKSPACE_ID } from '../src/testing/test-users.js';

function fakePool() {
  const calls=[];
  const client={
    async query(sql, params=[]) {
      calls.push([sql,params]);
      if (sql.startsWith('DELETE FROM tasks')) return { rowCount:3, rows:[{id:'1'},{id:'2'},{id:'3'}] };
      return { rowCount:1, rows:[] };
    },
    release(){calls.push(['RELEASE',[]]);},
  };
  return { calls, async connect(){return client;} };
}

test('test task reset is opt-in and targets only the stable test workspace', async()=>{
  const pool=fakePool();
  const skipped=await resetTestWorkspaceTasks(pool,{NODE_ENV:'test',JULO_ALLOW_TEST_SEED:'1',JULO_RESET_TEST_TASKS_ON_START:'0'});
  assert.deepEqual(skipped,{reset:false,deletedTaskCount:0});
  assert.equal(pool.calls.length,0);

  const result=await resetTestWorkspaceTasks(pool,{NODE_ENV:'test',JULO_ALLOW_TEST_SEED:'1',JULO_RESET_TEST_TASKS_ON_START:'1'});
  assert.deepEqual(result,{reset:true,deletedTaskCount:3});
  const deleteCall=pool.calls.find(([sql])=>sql.startsWith('DELETE FROM tasks'));
  assert.equal(deleteCall[1][0],TEST_WORKSPACE_ID);
});

test('test task reset is blocked in production', async()=>{
  await assert.rejects(
    ()=>resetTestWorkspaceTasks(fakePool(),{NODE_ENV:'production',JULO_ALLOW_TEST_SEED:'1',JULO_RESET_TEST_TASKS_ON_START:'1'}),
    /disabled in production/,
  );
});
