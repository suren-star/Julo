import assert from 'node:assert/strict';
import test from 'node:test';
import { ACTIONS, canWorkspace, getRoleDefaults } from '../src/domain/authorization.js';

test('role defaults expose requested workspace capabilities',()=>{
  const roles=getRoleDefaults();
  assert.deepEqual(roles.owner,['*']);
  assert.equal(canWorkspace('admin',ACTIONS.PROJECT_MEMBERS_MANAGE),true);
  assert.equal(canWorkspace('member',ACTIONS.NOTE_CONVERT),true);
  assert.equal(canWorkspace('viewer',ACTIONS.NOTE_READ),true);
  assert.equal(canWorkspace('viewer',ACTIONS.NOTE_UPDATE),false);
  assert.equal(canWorkspace('guest',ACTIONS.NOTE_READ),false);
});
