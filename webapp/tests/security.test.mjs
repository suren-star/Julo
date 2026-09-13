import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const appSource = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const mainSource = fs.readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8');
const gatewaySource = fs.readFileSync(new URL('../src/auth/AuthGateway.jsx', import.meta.url), 'utf8');
const projectTeamSource = fs.readFileSync(new URL('../src/auth/ProjectTeamDrawer.jsx', import.meta.url), 'utf8');
const serverBoardSource = fs.readFileSync(new URL('../src/lib/server-board.js', import.meta.url), 'utf8');

test('main Board has no legacy local task engine imports', () => {
  assert.doesNotMatch(appSource, /lib\/storage\.js/);
  assert.doesNotMatch(appSource, /lib\/permissions\.js/);
  assert.doesNotMatch(appSource, /lib\/task-timer\.js/);
  assert.match(appSource, /backendApi\.tasks/);
  assert.match(appSource, /backendApi\.createTask/);
  assert.match(appSource, /backendApi\.updateTask/);
  assert.match(appSource, /backendApi\.deleteTask/);
});

test('new Board task is created with its initial status in one request', () => {
  assert.match(appSource, /backendApi\.createTask\([\s\S]*?status: clean\.status,[\s\S]*?primaryAssigneeUserId: clean\.primaryAssigneeUserId/);
  assert.doesNotMatch(appSource, /if \(clean\.status !== 'todo'\)[\s\S]*?backendApi\.updateTask/);
});

test('editable task project choices follow task permission boundaries', () => {
  assert.match(appSource, /projects\.filter\(\(project\) => canTask\(modalTask\?\.id \? 'update' : 'create', project\.id\)\)/);
  assert.match(appSource, /if \(!canTask\(clean\.id \? 'update' : 'create', clean\.projectId\)\) return false/);
});

test('task project dropdown can create a project only for project creators', () => {
  assert.match(appSource, /canCreateProject=\{canProject\('create'\)\}/);
  assert.match(appSource, /value="__create_project__"/);
  assert.match(appSource, /nextProjectId = await onCreateProject\(\)/);
});

test('project team UI follows workspace role assignment hierarchy', () => {
  assert.match(gatewaySource, /\['owner', 'admin', 'member'\]\.includes\(state\.workspace\.role\)/);
  assert.match(projectTeamSource, /canManageProjectMember\(workspace\?\.role, workspaceRoleOf\(member\)\)/);
  assert.match(projectTeamSource, /availableMembers\.map/);
  assert.doesNotMatch(projectTeamSource, /availableGuests/);
  assert.match(serverBoardSource, /owner: new Set\(\['admin', 'member', 'viewer', 'guest'\]\)/);
  assert.match(serverBoardSource, /admin: new Set\(\['member', 'viewer', 'guest'\]\)/);
  assert.match(serverBoardSource, /member: new Set\(\['viewer', 'guest'\]\)/);
});

test('project roles can add scoped task capability to viewer and guest roles', () => {
  assert.match(serverBoardSource, /if \(projectRole === 'manager'\) return PROJECT_MANAGER_ACTIONS\.has\(action\)/);
  assert.match(serverBoardSource, /if \(projectRole === 'editor'\) return PROJECT_EDITOR_ACTIONS\.has\(action\)/);
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
