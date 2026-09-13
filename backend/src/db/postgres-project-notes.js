import { randomUUID } from 'node:crypto';

async function withTransaction(pool, callback) {
  const client = typeof pool.connect === 'function' ? await pool.connect() : pool;
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    throw error;
  } finally {
    if (client !== pool && typeof client.release === 'function') client.release();
  }
}

export function createPostgresProjectNotesRepository(pool) {
  if (!pool || typeof pool.query !== 'function') throw new TypeError('A pg-compatible pool/queryable is required.');
  return {
    async createProject({ id, workspaceId, name, actorUserId }) {
      return withTransaction(pool, async (client) => {
        const result = await client.query(`INSERT INTO projects (id, workspace_id, name, created_by) VALUES ($1,$2,$3,$4) RETURNING id, workspace_id, name, created_by, created_at, updated_at`,[id, workspaceId, name, actorUserId]);
        await client.query(`INSERT INTO audit_events (workspace_id, actor_user_id, action, entity_type, entity_id, metadata) VALUES ($1,$2,'project.created','project',$3,$4::jsonb)`,[workspaceId, actorUserId, id, JSON.stringify({ name })]);
        return result.rows[0];
      });
    },
    async renameProject({ workspaceId, projectId, name, actorUserId }) {
      return withTransaction(pool, async (client) => {
        const result = await client.query(`UPDATE projects SET name=$3, updated_at=now() WHERE workspace_id=$1 AND id=$2 AND archived_at IS NULL RETURNING id, workspace_id, name, created_by, created_at, updated_at`,[workspaceId, projectId, name]);
        if (!result.rows[0]) return null;
        await client.query(`INSERT INTO audit_events (workspace_id, actor_user_id, action, entity_type, entity_id, metadata) VALUES ($1,$2,'project.renamed','project',$3,$4::jsonb)`,[workspaceId, actorUserId, projectId, JSON.stringify({ name })]);
        return result.rows[0];
      });
    },
    async archiveProject({ workspaceId, projectId, actorUserId }) {
      return withTransaction(pool, async (client) => {
        const result = await client.query(`UPDATE projects SET archived_at=now(), updated_at=now() WHERE workspace_id=$1 AND id=$2 AND archived_at IS NULL RETURNING id, name`,[workspaceId, projectId]);
        if (!result.rows[0]) return null;
        await client.query('UPDATE tasks SET project_id=NULL, updated_at=now(), version=version+1 WHERE workspace_id=$1 AND project_id=$2',[workspaceId,projectId]);
        await client.query('DELETE FROM project_memberships WHERE workspace_id=$1 AND project_id=$2',[workspaceId,projectId]);
        await client.query(`INSERT INTO audit_events (workspace_id, actor_user_id, action, entity_type, entity_id, metadata) VALUES ($1,$2,'project.archived','project',$3,$4::jsonb)`,[workspaceId,actorUserId,projectId,JSON.stringify({movedTasksToUnassigned:true})]);
        return result.rows[0];
      });
    },
    async listWorkspaceMembers(workspaceId) {
      const result=await pool.query(`SELECT u.id,u.username_normalized,u.email_normalized,u.display_name,wm.role,wm.status FROM workspace_memberships wm JOIN users u ON u.id=wm.user_id WHERE wm.workspace_id=$1 AND wm.status='active' ORDER BY CASE wm.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 WHEN 'member' THEN 2 WHEN 'viewer' THEN 3 ELSE 4 END,u.display_name,u.id`,[workspaceId]);
      return result.rows;
    },
    async listProjectMembers(workspaceId,projectId) {
      const result=await pool.query(`SELECT u.id,u.username_normalized,u.email_normalized,u.display_name,wm.role AS workspace_role,pm.role AS project_role FROM project_memberships pm JOIN users u ON u.id=pm.user_id JOIN workspace_memberships wm ON wm.workspace_id=pm.workspace_id AND wm.user_id=pm.user_id WHERE pm.workspace_id=$1 AND pm.project_id=$2 AND wm.status='active' ORDER BY u.display_name,u.id`,[workspaceId,projectId]);
      return result.rows;
    },
    async setProjectMembership({workspaceId,projectId,userId,role,actorUserId}) {
      return withTransaction(pool,async(client)=>{
        const member=await client.query(`SELECT role,status FROM workspace_memberships WHERE workspace_id=$1 AND user_id=$2 LIMIT 1`,[workspaceId,userId]);
        if(!member.rows[0]||member.rows[0].status!=='active') return {kind:'member_not_found'};
        const project=await client.query('SELECT id FROM projects WHERE workspace_id=$1 AND id=$2 AND archived_at IS NULL',[workspaceId,projectId]);
        if(!project.rows[0]) return {kind:'project_not_found'};
        const result=await client.query(`INSERT INTO project_memberships (project_id,workspace_id,user_id,role) VALUES ($1,$2,$3,$4) ON CONFLICT (project_id,user_id) DO UPDATE SET role=EXCLUDED.role,updated_at=now() RETURNING project_id,workspace_id,user_id,role`,[projectId,workspaceId,userId,role]);
        await client.query(`INSERT INTO audit_events (workspace_id,actor_user_id,action,entity_type,entity_id,metadata) VALUES ($1,$2,'project.member_assigned','project',$3,$4::jsonb)`,[workspaceId,actorUserId,projectId,JSON.stringify({userId,projectRole:role})]);
        return {kind:'ok',membership:result.rows[0]};
      });
    },
    async removeProjectMembership({workspaceId,projectId,userId,actorUserId}) {
      return withTransaction(pool,async(client)=>{
        const result=await client.query('DELETE FROM project_memberships WHERE workspace_id=$1 AND project_id=$2 AND user_id=$3 RETURNING project_id,user_id,role',[workspaceId,projectId,userId]);
        if(!result.rows[0]) return null;
        await client.query(`INSERT INTO audit_events (workspace_id,actor_user_id,action,entity_type,entity_id,metadata) VALUES ($1,$2,'project.member_removed','project',$3,$4::jsonb)`,[workspaceId,actorUserId,projectId,JSON.stringify({userId})]);
        return result.rows[0];
      });
    },
    async listNotes(workspaceId) {
      const result=await pool.query(`SELECT id,workspace_id,title,description,reminder_date,label,status,converted_task_id,created_by,created_at,updated_at,version FROM notes WHERE workspace_id=$1 ORDER BY status,reminder_date,updated_at DESC,id`,[workspaceId]);
      return result.rows;
    },
    async createNote({id,workspaceId,title,description,reminderDate,label,actorUserId}) {
      return withTransaction(pool,async(client)=>{
        const result=await client.query(`INSERT INTO notes (id,workspace_id,title,description,reminder_date,label,created_by) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,[id,workspaceId,title,description,reminderDate,label,actorUserId]);
        await client.query(`INSERT INTO audit_events (workspace_id,actor_user_id,action,entity_type,entity_id,metadata) VALUES ($1,$2,'note.created','note',$3,'{}'::jsonb)`,[workspaceId,actorUserId,id]);
        return result.rows[0];
      });
    },
    async updateNote({workspaceId,noteId,expectedVersion,title,description,reminderDate,label,actorUserId}) {
      return withTransaction(pool,async(client)=>{
        const result=await client.query(`UPDATE notes SET title=$4,description=$5,reminder_date=$6,label=$7,updated_at=now(),version=version+1 WHERE workspace_id=$1 AND id=$2 AND version=$3 AND status='active' RETURNING *`,[workspaceId,noteId,expectedVersion,title,description,reminderDate,label]);
        if(!result.rows[0]){const current=await client.query('SELECT id,version,status FROM notes WHERE workspace_id=$1 AND id=$2',[workspaceId,noteId]);return current.rows[0]?{kind:'conflict',current:current.rows[0]}:{kind:'not_found'};}
        await client.query(`INSERT INTO audit_events (workspace_id,actor_user_id,action,entity_type,entity_id,metadata) VALUES ($1,$2,'note.updated','note',$3,$4::jsonb)`,[workspaceId,actorUserId,noteId,JSON.stringify({expectedVersion})]);
        return {kind:'ok',note:result.rows[0]};
      });
    },
    async deleteNote({workspaceId,noteId,actorUserId}) {
      return withTransaction(pool,async(client)=>{
        const result=await client.query("DELETE FROM notes WHERE workspace_id=$1 AND id=$2 AND status='active' RETURNING id",[workspaceId,noteId]);
        if(!result.rows[0]) return null;
        await client.query(`INSERT INTO audit_events (workspace_id,actor_user_id,action,entity_type,entity_id,metadata) VALUES ($1,$2,'note.deleted','note',$3,'{}'::jsonb)`,[workspaceId,actorUserId,noteId]);
        return result.rows[0];
      });
    },
    async convertNoteToTask({workspaceId,noteId,expectedVersion,projectId,executionType,dueDate,priority,actorUserId}) {
      return withTransaction(pool,async(client)=>{
        await client.query('SELECT id FROM workspaces WHERE id=$1 FOR UPDATE',[workspaceId]);
        const noteResult=await client.query('SELECT * FROM notes WHERE workspace_id=$1 AND id=$2 FOR UPDATE',[workspaceId,noteId]);
        const note=noteResult.rows[0];
        if(!note) return {kind:'not_found'};
        if(note.status!=='active'||note.converted_task_id) return {kind:'already_converted',taskId:note.converted_task_id};
        if(Number(note.version)!==Number(expectedVersion)) return {kind:'conflict',current:note};
        if(projectId){const project=await client.query('SELECT id FROM projects WHERE workspace_id=$1 AND id=$2 AND archived_at IS NULL',[workspaceId,projectId]);if(!project.rows[0]) return {kind:'project_not_found'};}
        const taskId=randomUUID(); const tags=note.label?[note.label]:[];
        const taskResult=await client.query(`INSERT INTO tasks (id,workspace_id,project_id,title,description,status,execution_type,due_date,priority,created_by,tags,source_note_id) VALUES ($1,$2,$3,$4,$5,'todo',$6,$7,$8,$9,$10,$11) RETURNING *`,[taskId,workspaceId,projectId,note.title,note.description,executionType,dueDate,priority,actorUserId,tags,note.id]);
        await client.query("INSERT INTO task_timers (task_id,workspace_id,state,elapsed_ms) VALUES ($1,$2,'idle',0)",[taskId,workspaceId]);
        const updatedNote=await client.query(`UPDATE notes SET status='converted',converted_task_id=$3,updated_at=now(),version=version+1 WHERE workspace_id=$1 AND id=$2 RETURNING *`,[workspaceId,noteId,taskId]);
        await client.query(`INSERT INTO audit_events (workspace_id,actor_user_id,action,entity_type,entity_id,metadata) VALUES ($1,$2,'note.converted_to_task','note',$3,$4::jsonb)`,[workspaceId,actorUserId,noteId,JSON.stringify({taskId,projectId,executionType,dueDate})]);
        return {kind:'ok',note:updatedNote.rows[0],task:taskResult.rows[0]};
      });
    },
    async seedDevelopmentUsers({workspaceId,workspaceName,users}) {
      return withTransaction(pool,async(client)=>{
        const owner=users.find((user)=>user.role==='owner'); if(!owner) throw new Error('Development seed requires an owner.');
        for(const user of users){
          await client.query(`INSERT INTO users (id,username_normalized,email_normalized,display_name) VALUES ($1,$2,$3,$4) ON CONFLICT (id) DO UPDATE SET username_normalized=EXCLUDED.username_normalized,email_normalized=EXCLUDED.email_normalized,display_name=EXCLUDED.display_name,updated_at=now()`,[user.id,user.username,user.email,user.displayName]);
          await client.query(`INSERT INTO user_credentials (user_id,password_hash) VALUES ($1,$2) ON CONFLICT (user_id) DO UPDATE SET password_hash=EXCLUDED.password_hash,password_changed_at=now()`,[user.id,user.passwordHash]);
        }
        await client.query(`INSERT INTO workspaces (id,name,created_by) VALUES ($1,$2,$3) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,updated_at=now()`,[workspaceId,workspaceName,owner.id]);
        for(const user of users) await client.query(`INSERT INTO workspace_memberships (workspace_id,user_id,role,status) VALUES ($1,$2,$3,'active') ON CONFLICT (workspace_id,user_id) DO UPDATE SET role=EXCLUDED.role,status='active',updated_at=now()`,[workspaceId,user.id,user.role]);
        return {workspaceId,users:users.map(({passwordHash,...user})=>user)};
      });
    },
  };
}
