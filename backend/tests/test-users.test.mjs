import assert from 'node:assert/strict';
import test from 'node:test';
import { REQUESTED_TEST_CREDENTIALS, TEST_USERS, seedRequestedTestUsers } from '../src/testing/test-users.js';

test('requested development users match five role fixtures',()=>{
  assert.deepEqual(REQUESTED_TEST_CREDENTIALS.map((u)=>[u.username,u.password,u.role]),[
    ['owner1','12345','owner'],['admin1','12345','admin'],['member1','12345','member'],['viewer1','12345','viewer'],['guest1','12345','guest'],
  ]);
  assert.equal(TEST_USERS.length,5);
});

test('development test seed is blocked without explicit opt-in and in production',async()=>{
  const repository={seedDevelopmentUsers(){throw new Error('should not run')}};
  await assert.rejects(()=>seedRequestedTestUsers(repository,{NODE_ENV:'development'}),/JULO_ALLOW_TEST_SEED/);
  await assert.rejects(()=>seedRequestedTestUsers(repository,{NODE_ENV:'production',JULO_ALLOW_TEST_SEED:'1'}),/production/);
});
