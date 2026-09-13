import { useEffect, useMemo, useRef, useState } from 'react';
import { backendApi } from '../lib/api-client.js';

const EXECUTION_TYPES = [
  ['review_report','Ծանոթանալ և զեկուցել'],['execute','Ի կատարում'],['prepare_letter','Պատրաստել գրություն'],
  ['organize_meeting','Կազմակերպել հանդիպում'],['prepare_documents','Պատրաստել փաստաթղթեր'],['acknowledge','Ընդունել ի գիտություն'],
];
const EXECUTION_LABELS = Object.fromEntries(EXECUTION_TYPES);
const STATUS_LABELS = { todo:'Առաջադրանք', doing:'Ընթացքում', done:'Ավարտված' };
const PRIORITY_LABELS = { low:'Ցածր', normal:'Սովորական', high:'Բարձր' };
const CREATE_PROJECT_VALUE = '__create_project__';
const STATUS_ORDER = { todo:0, doing:1, done:2 };

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

function AssigneeDropdown({ candidates, value, onChange, disabled=false }) {
  const rootRef = useRef(null);
  const [isOpen,setIsOpen] = useState(false);
  const selected = new Set(value.assigneeUserIds || []);
  const selectedNames = candidates.filter((candidate)=>selected.has(candidate.id)).map(nameOf);
  const label = selectedNames.length ? selectedNames.join(', ') : 'Ընտրել կատարողներ';

  useEffect(()=>{
    if(!isOpen)return undefined;
    const closeOnOutsidePointer=(event)=>{
      if(rootRef.current&&!rootRef.current.contains(event.target))setIsOpen(false);
    };
    const closeOnEscape=(event)=>{
      if(event.key==='Escape')setIsOpen(false);
    };
    document.addEventListener('pointerdown',closeOnOutsidePointer);
    document.addEventListener('keydown',closeOnEscape);
    return ()=>{
      document.removeEventListener('pointerdown',closeOnOutsidePointer);
      document.removeEventListener('keydown',closeOnEscape);
    };
  },[isOpen]);

  useEffect(()=>{if(disabled)setIsOpen(false)},[disabled]);

  return <label className="task-field"><span>Կատարողներ *</span><details ref={rootRef} open={isOpen} onToggle={(event)=>setIsOpen(event.currentTarget.open)} className={disabled ? 'assignee-dropdown disabled' : 'assignee-dropdown'}>
    <summary onClick={(event)=>{if(disabled)event.preventDefault()}}><span>{label}</span><b>⌄</b></summary>
    <div className="assignee-dropdown-menu">
      {candidates.length===0&&<div className="dropdown-empty">Հասանելի կատարողներ չկան։</div>}
      {candidates.map((candidate)=>{
        const checked=selected.has(candidate.id);
        return <label className="assignee-dropdown-option" key={candidate.id}>
          <input type="checkbox" disabled={disabled} checked={checked} onChange={(event)=>onChange(toggleAssignee(value,candidate.id,event.target.checked))}/>
          <span><b>{nameOf(candidate)}</b><small>{candidate.username_normalized || candidate.username || ''}</small></span>
        </label>;
      })}
    </div>
  </details></label>;
}

function PrimaryAssigneeSelect({ candidates, value, onChange, disabled=false }) {
  const selectedIds = new Set(value.assigneeUserIds || []);
  const selected = candidates.filter((candidate)=>selectedIds.has(candidate.id));
  return <label className="task-field"><span>Առաջնային կատարող *</span><select required disabled={disabled || selected.length===0} value={value.primaryAssigneeUserId || ''} onChange={(event)=>onChange({...value,primaryAssigneeUserId:event.target.value})}>
    <option value="">Ընտրել առաջնային կատարող</option>
    {selected.map((candidate)=><option key={candidate.id} value={candidate.id}>{nameOf(candidate)}</option>)}
  </select></label>;
}

function assigneeText(task) {
  const list = Array.isArray(task.assignees) ? task.assignees : [];
  if (!list.length) return 'Կատարող չի նշանակվել';
  return list.map((item)=>item.displayName || item.username || item.id).join(', ');
}

function primaryAssigneeText(task) {
  const primary=(task.assignees||[]).find((item)=>item.isPrimary);
  return primary?.displayName || primary?.username || task.primary_assignee_name || task.primary_assignee_username || '—';
}

function dueSortValue(value) {
  const time = value ? Date.parse(`${value}T00:00:00Z`) : Number.POSITIVE_INFINITY;
  return Number.isFinite(time) ? time : Number.POSITIVE_INFINITY;
}

export default function BackendTasksDrawer({ workspace, user, open, onClose }) {
  const [tasks,setTasks]=useState([]);
  const [projects,setProjects]=useState([]);
  const [candidates,setCandidates]=useState([]);
  const [form,setForm]=useState(emptyForm());
  const [editing,setEditing]=useState(null);
  const [editCandidates,setEditCandidates]=useState([]);
  const [editAssignment,setEditAssignment]=useState({assigneeUserIds:[],primaryAssigneeUserId:''});
  const [statusFilter,setStatusFilter]=useState('all');
  const [projectFilter,setProjectFilter]=useState('all');
  const [assigneeFilter,setAssigneeFilter]=useState('all');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const canCreate = ['owner','admin','member','guest'].includes(workspace?.role);
  const canCreateProject = ['owner','admin','member'].includes(workspace?.role);
  const canReopen = ['owner','admin'].includes(workspace?.role);
  const canUpdate = workspace?.role !== 'viewer';

  const projectMap = useMemo(()=>new Map(projects.map((p)=>[p.id,p.name])),[projects]);
  const stats = useMemo(()=>({
    total:tasks.length,
    todo:tasks.filter((task)=>task.status==='todo').length,
    doing:tasks.filter((task)=>task.status==='doing').length,
    done:tasks.filter((task)=>task.status==='done').length,
  }),[tasks]);
  const assigneeOptions = useMemo(()=>{
    const map=new Map();
    for(const task of tasks)for(const person of task.assignees||[])map.set(person.id,person.displayName||person.username||person.id);
    return [...map.entries()].sort((a,b)=>a[1].localeCompare(b[1],'hy'));
  },[tasks]);
  const visibleTasks = useMemo(()=>tasks
    .filter((task)=>statusFilter==='all'||task.status===statusFilter)
    .filter((task)=>projectFilter==='all'||(projectFilter==='none'?!task.project_id:task.project_id===projectFilter))
    .filter((task)=>assigneeFilter==='all'||(task.assignees||[]).some((person)=>person.id===assigneeFilter))
    .sort((a,b)=>(STATUS_ORDER[a.status]??9)-(STATUS_ORDER[b.status]??9)||dueSortValue(a.due_date)-dueSortValue(b.due_date)||String(b.updated_at||'').localeCompare(String(a.updated_at||''))),
  [tasks,statusFilter,projectFilter,assigneeFilter]);

  const load = async()=>{
    if(!workspace?.id)return;
    try {
      const [taskResult,projectResult] = await Promise.all([backendApi.tasks(workspace.id),backendApi.projects(workspace.id)]);
      setTasks(taskResult.tasks || []); setProjects(projectResult.projects || []); setError('');
    } catch(e){setError(e.message||'Չհաջողվեց բեռնել առաջադրանքները։');}
  };

  const loadCandidates = async(projectId,setter=setCandidates)=>{
    if(!workspace?.id)return;
    if(workspace?.role==='guest'&&!projectId){setter([]);return;}
    try { setter((await backendApi.taskAssignees(workspace.id,projectId)).assignees || []); }
    catch(e){ setter([]); setError(e.message); }
  };

  useEffect(()=>{if(open){load();loadCandidates(form.projectId)}},[open,workspace?.id]);
  useEffect(()=>{if(open)loadCandidates(form.projectId)},[form.projectId]);

  const chooseProject = async(value)=>{
    if(value!==CREATE_PROJECT_VALUE){
      setForm((current)=>({...current,projectId:value,assigneeUserIds:[],primaryAssigneeUserId:''}));
      return;
    }
    if(!canCreateProject)return;
    const name=window.prompt('Նոր նախագծի անունը');
    if(!name?.trim())return;
    setBusy(true); setError('');
    try{
      const result=await backendApi.createProject(workspace.id,{name:name.trim()});
      const project=result.project;
      setProjects((current)=>[...current.filter((item)=>item.id!==project.id),project]);
      setForm((current)=>({...current,projectId:project.id,assigneeUserIds:[],primaryAssigneeUserId:''}));
      await loadCandidates(project.id);
    }catch(err){setError(err.message)}finally{setBusy(false)}
  };

  const create = async(e)=>{
    e.preventDefault();
    if(!form.assigneeUserIds.length){setError('Ընտրեք առնվազն մեկ կատարող։');return;}
    if(!form.primaryAssigneeUserId){setError('Ընտրեք առաջնային կատարողին։');return;}
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
    if(!editAssignment.assigneeUserIds.length){setError('Ընտրեք առնվազն մեկ կատարող։');return;}
    if(!editAssignment.primaryAssigneeUserId){setError('Ընտրեք առաջնային կատարողին։');return;}
    setBusy(true); setError('');
    try{
      await backendApi.updateTask(workspace.id,editing.id,{expectedVersion:Number(editing.version),...editAssignment});
      setEditing(null); await load();
    }catch(err){setError(err.message)}finally{setBusy(false)}
  };

  const changeStatus = async(task,status)=>{
    setBusy(true); setError('');
    try{
      await backendApi.updateTask(workspace.id,task.id,{expectedVersion:Number(task.version),status});
      await load();
    }catch(err){setError(err.message)}finally{setBusy(false)}
  };

  if(!open)return null;
  const today=new Date().toISOString().slice(0,10);
  return <div className="backend-drawer backend-tasks-drawer">
    <div className="drawer-header"><div><strong>Առաջադրանքներ</strong><span>Server / PostgreSQL · {stats.total} ընդհանուր</span></div><button onClick={onClose}>×</button></div>
    {error&&<div className="auth-error">{error}</div>}

    <div className="task-summary" aria-label="Առաջադրանքների ամփոփում">
      <div><b>{stats.total}</b><span>Բոլորը</span></div><div><b>{stats.todo}</b><span>Առաջադրանք</span></div><div><b>{stats.doing}</b><span>Ընթացքում</span></div><div><b>{stats.done}</b><span>Ավարտված</span></div>
    </div>

    {canCreate&&<form className="server-task-form" onSubmit={create}>
      <div className="task-form-title"><div><strong>Նոր առաջադրանք</strong><span>Ստեղծող՝ {user?.displayName || user?.usernameNormalized || 'Դուք'}</span></div></div>
      <label className="task-field"><span>Առաջադրանքի վերնագիր *</span><input placeholder="Առաջադրանքի վերնագիր" required value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})}/></label>
      <label className="task-field"><span>Նկարագրություն</span><textarea placeholder="Նկարագրություն" value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})}/></label>
      <div className="note-form-row">
        <label className="task-field"><span>Նախագիծ</span><select value={form.projectId} disabled={busy} onChange={(event)=>chooseProject(event.target.value)}><option value="">Առանց նախագծի</option>{projects.map((p)=><option key={p.id} value={p.id}>{p.name}</option>)}{canCreateProject&&<option value={CREATE_PROJECT_VALUE}>＋ Ստեղծել նոր նախագիծ…</option>}</select></label>
        <label className="task-field"><span>Կատարման ժամկետ *</span><input type="date" required value={form.dueDate} onChange={(e)=>setForm({...form,dueDate:e.target.value})}/></label>
      </div>
      <div className="note-form-row">
        <label className="task-field"><span>Կատարման տեսակ</span><select value={form.executionType} onChange={(e)=>setForm({...form,executionType:e.target.value})}>{EXECUTION_TYPES.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
        <label className="task-field"><span>Առաջնահերթություն</span><select value={form.priority} onChange={(e)=>setForm({...form,priority:e.target.value})}><option value="low">Ցածր</option><option value="normal">Սովորական</option><option value="high">Բարձր</option></select></label>
      </div>
      <div className="performer-grid">
        <AssigneeDropdown candidates={candidates} value={form} onChange={setForm} disabled={busy}/>
        <PrimaryAssigneeSelect candidates={candidates} value={form} onChange={setForm} disabled={busy}/>
      </div>
      <p className="task-required-note">* Կատարողը և առաջնային կատարողը պարտադիր են։</p>
      <button className="primary" disabled={busy||!form.assigneeUserIds.length||!form.primaryAssigneeUserId}>{busy?'Պահպանում…':'＋ Ստեղծել առաջադրանք'}</button>
    </form>}
    {!canCreate&&<div className="drawer-empty">Ձեր դերը թույլ չի տալիս առաջադրանք ստեղծել։</div>}

    <div className="task-filter-bar">
      <label><span>Կարգավիճակ</span><select value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)}><option value="all">Բոլորը</option><option value="todo">Առաջադրանք</option><option value="doing">Ընթացքում</option><option value="done">Ավարտված</option></select></label>
      <label><span>Նախագիծ</span><select value={projectFilter} onChange={(e)=>setProjectFilter(e.target.value)}><option value="all">Բոլորը</option><option value="none">Առանց նախագծի</option>{projects.map((p)=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <label><span>Կատարող</span><select value={assigneeFilter} onChange={(e)=>setAssigneeFilter(e.target.value)}><option value="all">Բոլորը</option>{assigneeOptions.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>
    </div>

    <div className="task-list-heading"><strong>Արդյունքներ</strong><span>{visibleTasks.length} / {stats.total}</span></div>
    <div className="server-task-list">
      {visibleTasks.length===0&&<div className="drawer-empty">Այս ֆիլտրերով առաջադրանքներ չկան։</div>}
      {visibleTasks.map((task)=>{
        const overdue=task.status!=='done'&&task.due_date&&task.due_date<today;
        return <article className={`server-task-item status-${task.status}`} key={task.id}>
          <div className="server-task-head"><div><strong>{task.title}</strong><small>{projectMap.get(task.project_id)||'Առանց նախագծի'} · {EXECUTION_LABELS[task.execution_type]||task.execution_type||'Տեսակ նշված չէ'}</small></div><span className={`task-status status-${task.status}`}>{STATUS_LABELS[task.status]||task.status}</span></div>
          {task.description&&<p>{task.description}</p>}
          <div className="task-meta-row"><span className={overdue?'overdue':''}>Ժամկետ՝ {task.due_date||'—'}{overdue?' · ուշացած':''}</span><span>Առաջնահերթություն՝ {PRIORITY_LABELS[task.priority]||task.priority}</span></div>
          <div className="task-people task-people-three"><div><span>Ստեղծող</span><b>{task.creator_name || task.creator_username || task.created_by}</b></div><div><span>Առաջնային կատարող</span><b>★ {primaryAssigneeText(task)}</b></div><div><span>Բոլոր կատարողները</span><b>{assigneeText(task)}</b></div></div>
          {canUpdate&&<div className="task-actions">
            {task.status==='todo'&&<button disabled={busy} onClick={()=>changeStatus(task,'doing')}>▶ Սկսել</button>}
            {task.status==='doing'&&<button className="primary" disabled={busy} onClick={()=>changeStatus(task,'done')}>✓ Ավարտել</button>}
            {task.status==='done'&&canReopen&&<button disabled={busy} onClick={()=>changeStatus(task,'doing')}>↻ Վերաբացել</button>}
            <button disabled={busy} onClick={()=>beginEdit(task)}>Փոխել կատարողներին</button>
          </div>}
          {editing?.id===task.id&&<div className="assignment-editor">
            <div className="performer-grid"><AssigneeDropdown candidates={editCandidates} value={editAssignment} onChange={setEditAssignment} disabled={busy}/><PrimaryAssigneeSelect candidates={editCandidates} value={editAssignment} onChange={setEditAssignment} disabled={busy}/></div>
            <div><button onClick={()=>setEditing(null)}>Չեղարկել</button><button className="primary" onClick={saveAssignment} disabled={busy||!editAssignment.assigneeUserIds.length||!editAssignment.primaryAssigneeUserId}>Պահպանել կատարողներին</button></div>
          </div>}
        </article>;
      })}
    </div>
  </div>;
}