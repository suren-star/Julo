import assert from 'node:assert/strict';
import test from 'node:test';
import { createWorkspaceService } from '../src/services/workspace-service.js';

function repoFor(role, projectRole='editor') {
  const created=[];
  return {
    created,
    async listWorkspacesForUser(){return [{id:'workspace-123',role}]},
    async getWorkspaceMembership(){return {workspace_id:'workspace-123',user_id:'user-12345',role,status:'active'}},
    async getWorkspaceForMember(){return {id:'workspace-123',name:'W',role}},
    async listProjectsForMember(){return []},
    async listTasksForMember(){return [{id:'task-123'}]},
    async getProject(){return {id:'project-123',workspace_id:'workspace-123'}},
    async getProjectMembership(){return projectRole ? {role:projectRole} : null},
    async createTask(input){created.push(input); return input},
  };
}

test('member can create required-field task and server owns createdBy', async () => {
  const repo=repoFor('member'); const service=createWorkspaceService(repo);
  const task=await service.createTask('user-12345','workspace-123',{title:' Test ',executionType:'execute',dueDate:'2026-09-20',projectId:'project-123'});
  assert.equal(task.title,'Test');
  assert.equal(task.createdBy,'user-12345');
});

test('empty project selection is normalized to null', async () => {
  const repo=repoFor('member'); const service=createWorkspaceService(repo);
  const task=await service.createTask('user-12345','workspace-123',{title:'No project',executionType:'execute',dueDate:'2026-09-20',projectId:''});
  assert.equal(task.projectId,null);
});

test('viewer cannot create task', async () => {
  const service=createWorkspaceService(repoFor('viewer'));
  await assert.rejects(()=>service.createTask('user-12345','workspace-123',{title:'X',executionType:'execute',dueDate:'2026-09-20'}),(e)=>e.status===403);
});

test('guest editor can create only inside assigned project', async () => {
  const service=createWorkspaceService(repoFor('guest','editor'));
  await service.createTask('user-12345','workspace-123',{title:'X',executionType:'execute',dueDate:'2026-09-20',projectId:'project-123'});
  await assert.rejects(()=>service.createTask('user-12345','workspace-123',{title:'X',executionType:'execute',dueDate:'2026-09-20'}),(e)=>e.code==='project_access_required');
});

test('new task requires execution type and due date', async () => {
  const service=createWorkspaceService(repoFor('member'));
  await assert.rejects(()=>service.createTask('user-12345','workspace-123',{title:'X'}),(e)=>e.code==='invalid_execution_type');
});
