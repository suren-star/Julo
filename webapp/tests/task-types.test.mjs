import assert from 'node:assert/strict';
import test from 'node:test';
import {
  TASK_EXECUTION_OPTIONS,
  TASK_EXECUTION_TYPES,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  createTaskDraft,
  isTaskExecutionType,
} from '../src/lib/task-types.js';

test('task metadata has one canonical execution-type source', () => {
  assert.equal(TASK_EXECUTION_OPTIONS.length, Object.keys(TASK_EXECUTION_TYPES).length);
  assert.equal(TASK_EXECUTION_TYPES.execute, 'Ի կատարում');
  assert.equal(isTaskExecutionType('execute'), true);
  assert.equal(isTaskExecutionType('unknown'), false);
});

test('task draft follows server-required assignment shape', () => {
  const draft = createTaskDraft({ dueDate: '2026-09-14' });
  assert.deepEqual(draft.assigneeUserIds, []);
  assert.equal(draft.primaryAssigneeUserId, '');
  assert.equal(draft.projectId, '');
  assert.equal(draft.executionType, 'execute');
  assert.equal(draft.priority, 'normal');
  assert.equal(draft.dueDate, '2026-09-14');
});

test('task status and priority labels cover persisted values', () => {
  assert.deepEqual(Object.keys(TASK_STATUS_LABELS).sort(), ['doing', 'done', 'todo']);
  assert.deepEqual(Object.keys(TASK_PRIORITY_LABELS).sort(), ['high', 'low', 'normal']);
});
