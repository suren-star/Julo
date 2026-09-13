import { randomUUID } from 'node:crypto';
import { ACTIONS, PROJECT_ROLES, requireProjectPermission, requireWorkspacePermission } from '../domain/authorization.js';

const EXECUTION_TYPES = new Set(['review_report','execute','prepare_letter','organize_meeting','prepare_documents','acknowledge']);
const PRIORITIES = new Set(['low','normal','high']);

function serviceError(status, code, message) { const error=new Error(message); error.status=status; error.code=code; return error; }
function uuidish(value, field) { if (typeof value !== 'string' || value.length < 8 || value.length > 80) throw serviceError(400, `invalid_${field}`, `${field} is invalid.`); return value; }
function clean(value, field, max, required=true) {
  const text = typeof value === 'string' ? value.trim() : '';
  if ((required && !text) || text.length > max) throw serviceError(400, `invalid_${field}`, `${field} is invalid.`);
  return text;
}
function dateOnly(value, field) { if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw serviceError(400, `invalid_${field}`, `${field} is invalid.`); return value; }

export function createProjectNotesService(repository) {
  if (!repository) throw new TypeError('repository is required');
  async function membership(userId, workspaceId) {
    const item = await repository.getWorkspaceMembership(workspaceId, userId);
    if (!item || item.status !== 'active') throw serviceError(404, 'workspace_not_found', 'Workspace not found.');
    return item;
  }
  async function guestProjectRole(userId, workspaceId, projectId) {
    const project = await repository.getProject(workspaceId, projectId);
    if (!project) throw serviceError(404, 'project_not_found', 'Project not found.');
    const pm = await repository.getProjectMembership(projectId, userId);
    return pm?.role ?? null;
  }
  function noteInput(input) {
    return {
      title: clean(input?.title, 'title', 500),
      description: typeof input?.description === 'string' && input.description.length <= 20000 ? input.description : '',
      reminderDate: dateOnly(input?.reminderDate, 'reminder_date'),
      label: clean(input?.label ?? '', 'label', 200, false),
    };
  }
  return {
    async createProject(userId, workspaceId, input) {
      const wid=uuidish(workspaceId,'workspace_id'); const wm=await membership(userId,wid);
      requireWorkspacePermission(wm.role,ACTIONS.PROJECT_CREATE);
      return repository.createProject({id:randomUUID(),workspaceId:wid,name:clean(input?.name,'project_name',200),actorUserId:userId});
    },
    async renameProject(userId, workspaceId, projectId, input) {
      const wid=uuidish(workspaceId,'workspace_id'); const pid=uuidish(projectId,'project_id'); const wm=await membership(userId,wid);
      if (wm.role==='guest') { const role=await guestProjectRole(userId,wid,pid); requireProjectPermission({workspaceRole:wm.role,projectRole:role,action:ACTIONS.PROJECT_UPDATE}); }
      else requireWorkspacePermission(wm.role,ACTIONS.PROJECT_UPDATE);
      const result=await repository.renameProject({workspaceId:wid,projectId:pid,name:clean(input?.name,'project_name',200),actorUserId:userId});
      if (!result) throw serviceError(404,'project_not_found','Project not found.'); return result;
    },
    async deleteProject(userId, workspaceId, projectId) {
      const wid=uuidish(workspaceId,'workspace_id'); const pid=uuidish(projectId,'project_id'); const wm=await membership(userId,wid);
      requireWorkspacePermission(wm.role,ACTIONS.PROJECT_DELETE);
      const result=await repository.archiveProject({workspaceId:wid,projectId:pid,actorUserId:userId});
      if (!result) throw serviceError(404,'project_not_found','Project not found.'); return result;
    },
    async listWorkspaceMembers(userId, workspaceId) {
      const wid=uuidish(workspaceId,'workspace_id'); const wm=await membership(userId,wid); requireWorkspacePermission(wm.role,ACTIONS.PROJECT_MEMBERS_MANAGE); return repository.listWorkspaceMembers(wid);
    },
    async listProjectMembers(userId, workspaceId, projectId) {
      const wid=uuidish(workspaceId,'workspace_id'); const pid=uuidish(projectId,'project_id'); const wm=await membership(userId,wid); requireWorkspacePermission(wm.role,ACTIONS.PROJECT_MEMBERS_MANAGE);
      if (!await repository.getProject(wid,pid)) throw serviceError(404,'project_not_found','Project not found.'); return repository.listProjectMembers(wid,pid);
    },
    async setProjectMember(userId, workspaceId, projectId, targetUserId, input) {
      const wid=uuidish(workspaceId,'workspace_id'); const pid=uuidish(projectId,'project_id'); const uid=uuidish(targetUserId,'user_id'); const wm=await membership(userId,wid); requireWorkspacePermission(wm.role,ACTIONS.PROJECT_MEMBERS_MANAGE);
      if (!PROJECT_ROLES.includes(input?.role)) throw serviceError(400,'invalid_project_role','Project role is invalid.');
      const result=await repository.setProjectMembership({workspaceId:wid,projectId:pid,userId:uid,role:input.role,actorUserId:userId});
      if (result.kind==='project_not_found') throw serviceError(404,'project_not_found','Project not found.');
      if (result.kind==='member_not_found') throw serviceError(404,'member_not_found','Workspace member not found.'); return result.membership;
    },
    async removeProjectMember(userId, workspaceId, projectId, targetUserId) {
      const wid=uuidish(workspaceId,'workspace_id'); const pid=uuidish(projectId,'project_id'); const uid=uuidish(targetUserId,'user_id'); const wm=await membership(userId,wid); requireWorkspacePermission(wm.role,ACTIONS.PROJECT_MEMBERS_MANAGE);
      return Boolean(await repository.removeProjectMembership({workspaceId:wid,projectId:pid,userId:uid,actorUserId:userId}));
    },
    async listNotes(userId, workspaceId) {
      const wid=uuidish(workspaceId,'workspace_id'); const wm=await membership(userId,wid); requireWorkspacePermission(wm.role,ACTIONS.NOTE_READ); return repository.listNotes(wid);
    },
    async createNote(userId, workspaceId, input) {
      const wid=uuidish(workspaceId,'workspace_id'); const wm=await membership(userId,wid); requireWorkspacePermission(wm.role,ACTIONS.NOTE_CREATE); const note=noteInput(input);
      return repository.createNote({id:randomUUID(),workspaceId:wid,...note,actorUserId:userId});
    },
    async updateNote(userId, workspaceId, noteId, input) {
      const wid=uuidish(workspaceId,'workspace_id'); const nid=uuidish(noteId,'note_id'); const wm=await membership(userId,wid); requireWorkspacePermission(wm.role,ACTIONS.NOTE_UPDATE);
      if (!Number.isSafeInteger(input?.expectedVersion) || input.expectedVersion < 1) throw serviceError(400,'invalid_expected_version','expectedVersion is required.');
      const result=await repository.updateNote({workspaceId:wid,noteId:nid,expectedVersion:input.expectedVersion,...noteInput(input),actorUserId:userId});
      if (result.kind==='not_found') throw serviceError(404,'note_not_found','Note not found.'); if (result.kind==='conflict') throw serviceError(409,'note_version_conflict','Note has changed. Refresh and retry.'); return result.note;
    },
    async deleteNote(userId, workspaceId, noteId) {
      const wid=uuidish(workspaceId,'workspace_id'); const nid=uuidish(noteId,'note_id'); const wm=await membership(userId,wid); requireWorkspacePermission(wm.role,ACTIONS.NOTE_DELETE);
      if (!await repository.deleteNote({workspaceId:wid,noteId:nid,actorUserId:userId})) throw serviceError(404,'note_not_found','Note not found.'); return true;
    },
    async convertNote(userId, workspaceId, noteId, input) {
      const wid=uuidish(workspaceId,'workspace_id'); const nid=uuidish(noteId,'note_id'); const wm=await membership(userId,wid); requireWorkspacePermission(wm.role,ACTIONS.NOTE_CONVERT); requireWorkspacePermission(wm.role,ACTIONS.TASK_CREATE);
      if (!Number.isSafeInteger(input?.expectedVersion) || input.expectedVersion < 1) throw serviceError(400,'invalid_expected_version','expectedVersion is required.');
      if (!EXECUTION_TYPES.has(input?.executionType)) throw serviceError(400,'invalid_execution_type','Execution type is required.');
      const dueDate=dateOnly(input?.dueDate,'due_date'); const priority=input?.priority ?? 'normal'; if (!PRIORITIES.has(priority)) throw serviceError(400,'invalid_priority','Priority is invalid.');
      const projectId=input?.projectId || null; if (projectId) { uuidish(projectId,'project_id'); if (!await repository.getProject(wid,projectId)) throw serviceError(404,'project_not_found','Project not found.'); }
      const result=await repository.convertNoteToTask({workspaceId:wid,noteId:nid,expectedVersion:input.expectedVersion,projectId,executionType:input.executionType,dueDate,priority,actorUserId:userId});
      if (result.kind==='not_found') throw serviceError(404,'note_not_found','Note not found.'); if (result.kind==='conflict') throw serviceError(409,'note_version_conflict','Note has changed. Refresh and retry.'); if (result.kind==='already_converted') throw serviceError(409,'note_already_converted','Note was already converted to a task.'); if (result.kind==='project_not_found') throw serviceError(404,'project_not_found','Project not found.');
      return {note:result.note,task:result.task};
    },
  };
}
