import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertExpectedVersion,
  assertTaskExecutionType,
  assertTaskPriority,
  normalizeProjectId,
  normalizeTaskAssignees,
} from '../src/domain/service-validation.js';

test('shared task validation normalizes optional project ids', () => {
  assert.equal(normalizeProjectId(''), null);
  assert.equal(normalizeProjectId(null), null);
  assert.equal(normalizeProjectId('project-12345678'), 'project-12345678');
});

test('shared task validation enforces one selected primary assignee', () => {
  assert.deepEqual(
    normalizeTaskAssignees({
      assigneeUserIds: ['user-12345678', 'user-12345678', 'user-87654321'],
      primaryAssigneeUserId: 'user-87654321',
    }),
    {
      assigneeUserIds: ['user-12345678', 'user-87654321'],
      primaryAssigneeUserId: 'user-87654321',
    },
  );
  assert.throws(
    () => normalizeTaskAssignees({ assigneeUserIds: ['user-12345678'], primaryAssigneeUserId: 'user-87654321' }),
    (error) => error.code === 'primary_assignee_not_selected',
  );
});

test('shared enum and version validation are consistent', () => {
  assert.equal(assertTaskExecutionType('execute'), 'execute');
  assert.equal(assertTaskPriority('high'), 'high');
  assert.equal(assertExpectedVersion(3), 3);
  assert.throws(() => assertTaskExecutionType('other'), (error) => error.code === 'invalid_execution_type');
  assert.throws(() => assertTaskPriority('urgent'), (error) => error.code === 'invalid_priority');
  assert.throws(() => assertExpectedVersion(0), (error) => error.code === 'invalid_expected_version');
});
