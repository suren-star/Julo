import test from 'node:test';
import assert from 'node:assert/strict';
import { can, canForMember, canManageMemberRole, visibleProjectsForMember } from '../src/lib/permissions.js';

test('workspace roles expose expected permissions', () => {
  assert.equal(can('owner', 'members.manage'), true);
  assert.equal(can('admin', 'members.manage'), true);
  assert.equal(can('member', 'tasks.create'), true);
  assert.equal(can('member', 'tasks.timer'), true);
  assert.equal(can('member', 'members.manage'), false);
  assert.equal(can('viewer', 'tasks.update'), false);
  assert.equal(can('viewer', 'tasks.timer'), false);
  assert.equal(can('viewer', 'tasks.comment'), true);
  assert.equal(can('viewer', 'workspace.export'), true);
  assert.equal(can('guest', 'tasks.comment'), false);
  assert.equal(can('guest', 'projects.create'), false);
});

test('guest permissions are scoped to assigned project role without comment permission', () => {
  const guest = { role: 'guest', projectRoles: { p1: 'editor', p2: 'viewer' } };
  assert.equal(canForMember(guest, 'tasks.create', 'p1'), true);
  assert.equal(canForMember(guest, 'tasks.update', 'p1'), true);
  assert.equal(canForMember(guest, 'tasks.timer', 'p1'), true);
  assert.equal(canForMember(guest, 'tasks.update', 'p2'), false);
  assert.equal(canForMember(guest, 'tasks.timer', 'p2'), false);
  assert.equal(canForMember(guest, 'tasks.comment', 'p1'), false);
  assert.equal(canForMember(guest, 'tasks.comment', 'p2'), false);
  assert.equal(canForMember(guest, 'projects.create', 'p1'), false);
});

test('only owner can promote or demote owner role', () => {
  assert.equal(canManageMemberRole('admin', 'member', 'viewer'), true);
  assert.equal(canManageMemberRole('admin', 'member', 'owner'), false);
  assert.equal(canManageMemberRole('admin', 'owner', 'admin'), false);
  assert.equal(canManageMemberRole('owner', 'owner', 'admin'), true);
  assert.equal(canManageMemberRole('owner', 'member', 'owner'), true);
});

test('guest only sees explicitly assigned projects', () => {
  const workspace = { projects: [{ id: 'p1' }, { id: 'p2' }] };
  const guest = { role: 'guest', projectRoles: { p2: 'viewer' } };
  const member = { role: 'member', projectRoles: {} };
  assert.deepEqual(visibleProjectsForMember(workspace, guest).map((project) => project.id), ['p2']);
  assert.deepEqual(visibleProjectsForMember(workspace, member).map((project) => project.id), ['p1', 'p2']);
});
