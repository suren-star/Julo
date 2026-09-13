import assert from 'node:assert/strict';
import test from 'node:test';
import { createWorkspaceService } from '../src/services/workspace-service.js';

const ACTOR = 'user-12345';

function assignedTask(overrides = {}) {
  return {
    title:'X',
    executionType:'execute',
    dueDate:'2026-09-20',
    assigneeUserIds:[ACTOR],
    primaryAssigneeUserId:ACTOR,
    ...overrides,
  };
}

function repoFor(role, projectRole='editor') {
  const created=[];
  return {
    created,
    async listWorkspacesForUser(){return [{id:'workspace-123',role}]},
    async getWorkspaceMembership(){return {workspace_id:'workspace-123',user_id:ACTOR,role,status:'active'}},
    async getWorkspaceForMember(){return {id:'workspace-123',name:'W',role}},
    async listProjectsForMember(){return []},
    async listTasksForMember(){return [{id:'task-123'}]},
    async getProject(){return {id:'project-123',workspace_id:'workspace-123'}},
    async getProjectMembership(){return projectRole ? {role:projectRole} : null},
    async listEligibleTaskAssignees(){return [{id:ACTOR}]},
    async createTask(input){created.push(input); return input},
  };
}

test('member can create required-field task and server owns createdBy', async () => {
  const repo=repoFor('member'); const service=createWorkspaceService(repo);
  const task=await service.createTask(ACTOR,'workspace-123',assignedTask({title:' Test ',projectId:'project-123'}));
  assert.equal(task.title,'Test');
  assert.equal(task.createdBy,ACTOR);
  assert.equal(task.status,'todo');
});

test('new task accepts a validated initial status', async () => {
  const repo=repoFor('member'); const service=createWorkspaceService(repo);
  const task=await service.createTask(ACTOR,'workspace-123',assignedTask({status:'done'}));
  assert.equal(task.status,'done');
});

test('new task rejects an invalid initial status', async () => {
  const service=createWorkspaceService(repoFor('member'));
  await assert.rejects(
    ()=>service.createTask(ACTOR,'workspace-123',assignedTask({status:'later'})),
    (e)=>e.code==='invalid_status',
  );
});

test('empty project selection is normalized to null', async () => {
  const repo=repoFor('member'); const service=createWorkspaceService(repo);
  const task=await service.createTask(ACTOR,'workspace-123',assignedTask({title:'No project',projectId:''}));
  assert.equal(task.projectId,null);
});

test('viewer cannot create task', async () => {
  const service=createWorkspaceService(repoFor('viewer'));
  await assert.rejects(()=>service.createTask(ACTOR,'workspace-123',assignedTask()),(e)=>e.status===403);
});

test('guest editor can create only inside assigned project', async () => {
  const service=createWorkspaceService(repoFor('guest','editor'));
  await service.createTask(ACTOR,'workspace-123',assignedTask({projectId:'project-123'}));
  await assert.rejects(()=>service.createTask(ACTOR,'workspace-123',assignedTask()),(e)=>e.code==='project_access_required');
});

test('new task requires execution type and due date', async () => {
  const service=createWorkspaceService(repoFor('member'));
  await assert.rejects(()=>service.createTask(ACTOR,'workspace-123',{title:'X',assigneeUserIds:[ACTOR],primaryAssigneeUserId:ACTOR}),(e)=>e.code==='invalid_execution_type');
});

test('new task requires at least one assignee and a primary assignee', async () => {
  const service=createWorkspaceService(repoFor('member'));
  await assert.rejects(()=>service.createTask(ACTOR,'workspace-123',{title:'X',executionType:'execute',dueDate:'2026-09-20'}),(e)=>e.code==='assignee_required');
});
