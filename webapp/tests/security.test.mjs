import test from 'node:test';
import assert from 'node:assert/strict';
import { MAX_BACKUP_TEXT_CHARS, normalizeWorkspace, parseWorkspaceBackup } from '../src/lib/storage.js';

test('rejects oversized backup text before parsing', () => {
  assert.throws(() => parseWorkspaceBackup('x'.repeat(MAX_BACKUP_TEXT_CHARS + 1)), /չափազանց մեծ/);
});

test('rejects unsupported structured backup versions', () => {
  const text = JSON.stringify({
    format: 'julo-workspace',
    formatVersion: 99,
    workspace: { projects: [], tasks: [] },
  });
  assert.throws(() => parseWorkspaceBackup(text), /չի աջակցվում/);
});

test('rejects backups with excessive entity counts', () => {
  const text = JSON.stringify({
    projects: [],
    tasks: Array.from({ length: 10001 }, (_, index) => ({ id: `t${index}`, title: 'x' })),
  });
  assert.throws(() => parseWorkspaceBackup(text), /առաջադրանքների քանակը/);
});

test('rejects tasks with excessive comments', () => {
  const text = JSON.stringify({
    projects: [],
    tasks: [{
      id: 't1',
      title: 'Task',
      comments: Array.from({ length: 501 }, (_, index) => ({ id: `c${index}`, text: 'x' })),
    }],
  });
  assert.throws(() => parseWorkspaceBackup(text), /մեկնաբանությունների քանակը/);
});

test('normalization keeps only approved settings keys', () => {
  const workspace = normalizeWorkspace({
    projects: [],
    tasks: [],
    settings: { theme: 'dark', language: 'hy', injected: { admin: true } },
  });
  assert.deepEqual(workspace.settings, { theme: 'dark', language: 'hy' });
});
