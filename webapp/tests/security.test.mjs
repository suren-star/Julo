import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const appSource = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const mainSource = fs.readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8');
const gatewaySource = fs.readFileSync(new URL('../src/auth/AuthGateway.jsx', import.meta.url), 'utf8');

test('main Board has no legacy local task engine imports', () => {
  assert.doesNotMatch(appSource, /lib\/storage\.js/);
  assert.doesNotMatch(appSource, /lib\/permissions\.js/);
  assert.doesNotMatch(appSource, /lib\/task-timer\.js/);
  assert.match(appSource, /backendApi\.tasks/);
  assert.match(appSource, /backendApi\.createTask/);
  assert.match(appSource, /backendApi\.updateTask/);
  assert.match(appSource, /backendApi\.deleteTask/);
});

test('all web routes enter through AuthGateway', () => {
  assert.match(mainSource, /<AuthGateway>/);
  assert.doesNotMatch(mainSource, /isLoginRoute/);
  assert.match(mainSource, /<App workspace=\{workspace\} user=\{user\}/);
});

test('duplicate Tasks drawer is removed from authenticated toolbar', () => {
  assert.doesNotMatch(gatewaySource, /BackendTasksDrawer/);
  assert.equal(fs.existsSync(new URL('../src/auth/BackendTasksDrawer.jsx', import.meta.url)), false);
});

test('only theme preference may remain in browser localStorage', () => {
  const localStorageUses = [...appSource.matchAll(/localStorage\.[A-Za-z]+\(([^\n]+)\)/g)].map((match) => match[0]);
  assert.ok(localStorageUses.length > 0);
  assert.ok(localStorageUses.every((entry) => entry.includes('julo_theme')));
});
