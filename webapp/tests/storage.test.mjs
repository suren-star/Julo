import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeWorkspace, parseWorkspaceBackup, serializeWorkspace } from '../src/lib/storage.js';

test('normalizes legacy workspace data safely', () => {
  const migrated = normalizeWorkspace({
    version: 1,
    projects: [{ id: 'p1', name: 'Project' }],
    tasks: [
      { id: 't1', title: 'Task', projectId: 'p1', status: 'doing', priority: 'high', tags: ['a', '', 42] },
      { id: 't2', title: 'Other', projectId: 'missing', status: 'unknown', priority: 'unknown' },
    ],
    settings: { theme: 'dark' },
  });

  assert.equal(migrated.version, 2);
  assert.equal(migrated.settings.theme, 'dark');
  assert.equal(migrated.settings.language, 'hy');
  assert.deepEqual(migrated.tasks[0].tags, ['a']);
  assert.equal(migrated.tasks[1].projectId, '');
  assert.equal(migrated.tasks[1].status, 'todo');
  assert.equal(migrated.tasks[1].priority, 'normal');
});

test('round-trips a Julo backup', () => {
  const source = normalizeWorkspace({
    projects: [{ id: 'p1', name: 'Աշխատանք' }],
    tasks: [{ id: 't1', title: 'Փորձ', projectId: 'p1', status: 'todo', priority: 'normal' }],
    settings: { theme: 'light' },
  });

  const restored = parseWorkspaceBackup(serializeWorkspace(source));
  assert.equal(restored.projects[0].name, 'Աշխատանք');
  assert.equal(restored.tasks[0].title, 'Փորձ');
  assert.equal(restored.tasks[0].projectId, 'p1');
});

test('accepts a direct legacy workspace JSON backup', () => {
  const restored = parseWorkspaceBackup(JSON.stringify({ projects: [], tasks: [], settings: {} }));
  assert.equal(restored.version, 2);
  assert.deepEqual(restored.projects, []);
  assert.deepEqual(restored.tasks, []);
});

test('rejects unrelated JSON files', () => {
  assert.throws(() => parseWorkspaceBackup('{"hello":"world"}'), /Julo/);
  assert.throws(() => parseWorkspaceBackup('not-json'), /JSON/);
});
