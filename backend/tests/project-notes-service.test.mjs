import assert from 'node:assert/strict';
import test from 'node:test';
import { createProjectNotesService } from '../src/services/project-notes-service.js';

function repo(role='owner') {
  const calls=[];
  return { calls,
    async getWorkspaceMembership(){return {role,status:'active'}},
    async getProject(){return {id:'project-12345678'}}, async getProjectMembership(){return {role:'manager'}},
    async createProject(input){calls.push(['createProject',input]);return input}, async renameProject(input){calls.push(['renameProject',input]);return input}, async archiveProject(){return {id:'project-12345678'}},
    async listWorkspaceMembers(){return []}, async listProjectMembers(){return []}, async setProjectMembership(input){calls.push(['setProjectMembership',input]);return {kind:'ok',membership:input}}, async removeProjectMembership(){return {id:'x'}},
    async listNotes(){return []}, async createNote(input){calls.push(['createNote',input]);return {...input,version:1}},
    async updateNote(input){return {kind:'ok',note:{...input,version:input.expectedVersion+1}}}, async deleteNote(){return {id:'note'}},
    async convertNoteToTask(input){calls.push(['convert',input]);return {kind:'ok',note:{id:input.noteId,status:'converted'},task:{id:'task'}}},
  };
}

test('owner can create/rename projects and assign project team members', async()=>{
  const r=repo('owner'); const service=createProjectNotesService(r);
  await service.createProject('user-12345678','workspace-12345678',{name:'Նոր նախագիծ'});
  await service.renameProject('user-12345678','workspace-12345678','project-12345678',{name:'Վերանվանված'});
  await service.setProjectMember('user-12345678','workspace-12345678','project-12345678','member-12345678',{role:'editor'});
  assert.deepEqual(r.calls.map((c)=>c[0]),['createProject','renameProject','setProjectMembership']);
});

test('viewer reads notes but cannot create or convert them', async()=>{
  const r=repo('viewer'); const service=createProjectNotesService(r);
  assert.deepEqual(await service.listNotes('user-12345678','workspace-12345678'),[]);
  await assert.rejects(()=>service.createNote('user-12345678','workspace-12345678',{title:'X',reminderDate:'2026-09-14'}),(e)=>e.status===403);
  await assert.rejects(()=>service.convertNote('user-12345678','workspace-12345678','note-12345678',{expectedVersion:1,executionType:'execute',dueDate:'2026-09-14'}),(e)=>e.status===403);
});

test('member can create Armenian reminder and convert it to task', async()=>{
  const r=repo('member'); const service=createProjectNotesService(r);
  const note=await service.createNote('user-12345678','workspace-12345678',{title:'Զանգահարել գործընկերոջը',description:'Քննարկել փաստաթուղթը',reminderDate:'2026-09-14',label:'Կարևոր'});
  assert.equal(note.title,'Զանգահարել գործընկերոջը');
  const converted=await service.convertNote('user-12345678','workspace-12345678','note-12345678',{expectedVersion:1,executionType:'execute',dueDate:'2026-09-14',priority:'normal'});
  assert.equal(converted.task.id,'task');
});

test('guest has no workspace notes access', async()=>{
  const service=createProjectNotesService(repo('guest'));
  await assert.rejects(()=>service.listNotes('user-12345678','workspace-12345678'),(e)=>e.status===403);
});
