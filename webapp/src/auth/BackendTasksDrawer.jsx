import { useEffect, useMemo, useState } from 'react';
import { backendApi } from '../lib/api-client.js';

const EXECUTION_TYPES = [
  ['review_report','Ծանոթանալ և զեկուցել'],['execute','Ի կատարում'],['prepare_letter','Պատրաստել գրություն'],
  ['organize_meeting','Կազմակերպել հանդիպում'],['prepare_documents','Պատրաստել փաստաթղթեր'],['acknowledge','Ընդունել ի գիտություն'],
];

const emptyForm = () => ({
  title:'', description:'', projectId:'', executionType:'execute', dueDate:new Date().toISOString().slice(0,10), priority:'normal',
  assigneeUserIds:[], primaryAssigneeUserId:'',
});

function nameOf(candidate) {
  return candidate.display_name || candidate.displayName || candidate.username_normalized || candidate.username || candidate.id;
}

function toggleAssignee(form, userId, checked) {
  const nextIds = checked
    ? [...new Set([...form.assigneeUserIds, userId])]
    : form.assigneeUserIds.filter((id) => id !== userId);
  let primary = form.primaryAssigneeUserId;
  if (checked && !primary) primary = userId;
  if (!checked && primary === userId) primary = nextIds[0] || '';
  return { ...form, assigneeUserIds: nextIds, primaryAssigneeUserId: primary };
}

function AssigneePicker({ candidates, value, onChange, disabled=false }) {
  const selected = new Set(value.assigneeUserIds || []);
  return <div className="assignee-picker">
    {candidates.length === 0 && <div className="drawer-empty">Այս նախագծի համար հասանելի կատարողներ չկան։</div>}
    {candidates.map((candidate) => {
      const id = candidate.id;
      const checked = selected.has(id);
      return <div className="assignee-option" key={id}>
        <label><input type="checkbox" disabled={disabled} checked={checked} onChange={(e)=>onChange(toggleAssignee(value,id,e.target.checked))}/><span><b>{nameOf(candidate)}</b><small>{candidate.username_normalized || candidate.username || ''}</small></span></label>
        <label className="primary-assignee"><input type="radio" name="primary-assignee" disabled={disabled || !checked} checked={value.primaryAssigneeUserId===id} onChange={()=>onChange({...value,primaryAssigneeUserId:id})}/><span>Առաջնային</span></label>
      </div>;
    })}
  </div>;
}

function assigneeText(task) {
  const list = Array.isArray(task.assignees) ? task.assignees : [];
  if (!list.length) return 'Կատարող չի նշանակվել';
  return list.map((item)=>`${item.isPrimary?'★ ':''}${item.displayName || item.username || item.id}`).join(', ');
}

export default function BackendTasksDrawer({ workspace, user, open, onClose }) {
  const [tasks,setTasks]=useState([]);
  const [projects,setProjects]=useState([]);
  const [candidates,setCandidates]=useState([]);
  const [form,setForm]=useState(emptyForm());
  const [editing,setEditing]=useState(null);
  const [editCandidates,setEditCandidates]=useState([]);
  const [editAssignment,setEditAssignment]=useState({assigneeUserIds:[],primaryAssigneeUserId:''});
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const canCreate = ['owner','admin','member','guest'].includes(workspace?.role);

  const projectMap = useMemo(()=>new Map(projects.map((p)=>[p.id,p.name])),[projects]);

  const load = async()=>{
    if(!workspace?.id)return;
    try {
      const [taskResult,projectResult] = await Promise.all([backendApi.tasks(workspace.id),backendApi.projects(workspace.id)]);
      setTasks(taskResult.tasks || []); setProjects(projectResult.projects || []); setError('');
    } catch(e){setError(e.message||'Չհաջողվեց բեռնել առաջադրանքները։');}
  };

  const loadCandidates = async(projectId,setter=setCandidates)=>{
    if(!workspace?.id)return;
    try { setter((await backendApi.taskAssignees(workspace.id,projectId)).assignees || []); }
    catch(e){ setter([]); setError(e.message); }
  };

  useEffect(()=>{if(open){load();loadCandidates(form.projectId)}},[open,workspace?.id]);
  useEffect(()=>{if(open)loadCandidates(form.projectId)},[form.projectId]);

  const create = async(e)=>{
    e.preventDefault();
    if(form.assigneeUserIds.length && !form.primaryAssigneeUserId){setError('Ընտրեք առաջնային կատարողին։');return;}
    setBusy(true); setError('');
    try{
      await backendApi.createTask(workspace.id,form);
      setForm(emptyForm()); await load(); await loadCandidates('');
    }catch(err){setError(err.message)}finally{setBusy(false)}
  };

  const beginEdit = async(task)=>{
    const ids=(task.assignees||[]).map((a)=>a.id);
    const primary=(task.assignees||[]).find((a)=>a.isPrimary)?.id || task.assignee_user_id || '';
    setEditing(task); setEditAssignment({assigneeUserIds:ids,primaryAssigneeUserId:primary});
    await loadCandidates(task.project_id || '',setEditCandidates);
  };

  const saveAssignment = async()=>{
    if(!editing)return;
    if(editAssignment.assigneeUserIds.length && !editAssignment.primaryAssigneeUserId){setError('Ընտրեք առաջնային կատարողին։');return;}
    setBusy(true); setError('');
    try{
      await backendApi.updateTask(workspace.id,editing.id,{expectedVersion:Number(editing.version),...editAssignment});
      setEditing(null); await load();
    }catch(err){setError(err.message)}finally{setBusy(false)}
  };

  if(!open)return null;
  return <div className="backend-drawer backend-tasks-drawer">
    <div className="drawer-header"><div><strong>Առաջադրանքներ</strong><span>Server / PostgreSQL · բազմակի կատարողներ</span></div><button onClick={onClose}>×</button></div>
    {error&&<div className="auth-error">{error}</div>}

    {canCreate&&<form className="server-task-form" onSubmit={create}>
      <div className="task-author-line"><span>Ստեղծող</span><strong>{user?.displayName || user?.usernameNormalized || 'Դուք'}</strong></div>
      <input placeholder="Առաջադրանքի վերնագիր" required value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})}/>
      <textarea placeholder="Նկարագրություն" value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})}/>
      <div className="note-form-row"><select value={form.projectId} onChange={(e)=>setForm({...form,projectId:e.target.value,assigneeUserIds:[],primaryAssigneeUserId:''})}><option value="">Առանց նախագծի</option>{projects.map((p)=><option key={p.id} value={p.id}>{p.name}</option>)}</select><input type="date" required value={form.dueDate} onChange={(e)=>setForm({...form,dueDate:e.target.value})}/></div>
      <div className="note-form-row"><select value={form.executionType} onChange={(e)=>setForm({...form,executionType:e.target.value})}>{EXECUTION_TYPES.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select><select value={form.priority} onChange={(e)=>setForm({...form,priority:e.target.value})}><option value="low">Ցածր</option><option value="normal">Սովորական</option><option value="high">Բարձր</option></select></div>
      <div className="assignee-section"><strong>Կատարողներ</strong><span>Կարող եք ընտրել մի քանիսին։ ★ Առաջնային կատարողը պարտադիր է, եթե ընտրություն կա։</span></div>
      <AssigneePicker candidates={candidates} value={form} onChange={setForm}/>
      <button className="primary" disabled={busy}>{busy?'Պահպանում…':'＋ Ստեղծել առաջադրանք'}</button>
    </form>}
    {!canCreate&&<div className="drawer-empty">Ձեր դերը թույլ չի տալիս առաջադրանք ստեղծել։</div>}

    <div className="server-task-list">{tasks.length===0&&<div className="drawer-empty">Server-ում առաջադրանքներ դեռ չկան։</div>}{tasks.map((task)=><article className="server-task-item" key={task.id}>
      <div className="server-task-head"><div><strong>{task.title}</strong><small>{projectMap.get(task.project_id)||'Առանց նախագծի'} · {task.due_date||'Ժամկետ չկա'}</small></div><span>{task.status}</span></div>
      {task.description&&<p>{task.description}</p>}
      <div className="task-people"><div><span>Ստեղծող</span><b>{task.creator_name || task.creator_username || task.created_by}</b></div><div><span>Կատարողներ</span><b>{assigneeText(task)}</b></div></div>
      {workspace?.role!=='viewer'&&<button onClick={()=>beginEdit(task)}>Փոխել կատարողներին</button>}
      {editing?.id===task.id&&<div className="assignment-editor"><AssigneePicker candidates={editCandidates} value={editAssignment} onChange={setEditAssignment} disabled={busy}/><div><button onClick={()=>setEditing(null)}>Չեղարկել</button><button className="primary" onClick={saveAssignment} disabled={busy}>Պահպանել կատարողներին</button></div></div>}
    </article>)}</div>
  </div>;
}
