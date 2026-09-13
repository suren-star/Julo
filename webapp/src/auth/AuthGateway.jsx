import { useEffect, useMemo, useState } from 'react';
import { backendApi } from '../lib/api-client.js';
import BackendTasksDrawer from './BackendTasksDrawer.jsx';

const TEST_LOGINS = [
  ['owner1','Սեփականատեր'],['admin1','Ադմինիստրատոր'],['member1','Անդամ'],['viewer1','Դիտորդ'],['guest1','Հյուր'],
];
const EXECUTION_TYPES = [
  ['review_report','Ծանոթանալ և զեկուցել'],['execute','Ի կատարում'],['prepare_letter','Պատրաստել գրություն'],
  ['organize_meeting','Կազմակերպել հանդիպում'],['prepare_documents','Պատրաստել փաստաթղթեր'],['acknowledge','Ընդունել ի գիտություն'],
];

function AuthPage({ onAuthenticated }) {
  const [mode,setMode]=useState('login');
  const [form,setForm]=useState({identifier:'',password:'',username:'',email:'',displayName:'',workspaceName:'Julo Workspace'});
  const [busy,setBusy]=useState(false); const [error,setError]=useState('');
  const update=(key)=>(event)=>setForm((current)=>({...current,[key]:event.target.value}));
  const submit=async(event)=>{
    event.preventDefault(); setBusy(true); setError('');
    try {
      if(mode==='login') await backendApi.login({identifier:form.identifier,password:form.password});
      else await backendApi.register({username:form.username,email:form.email,displayName:form.displayName,workspaceName:form.workspaceName,password:form.password});
      await onAuthenticated();
    } catch(e){setError(e.message||'Մուտքը չհաջողվեց։');} finally{setBusy(false);}
  };
  const showTests=import.meta.env.VITE_JULO_SHOW_TEST_USERS==='true';
  return <main className="auth-page">
    <section className="auth-card">
      <div className="auth-brand"><div className="brand-mark">J</div><div><strong>Julo</strong><span>աշխատանքային տարածք</span></div></div>
      <div className="auth-tabs">
        <button className={mode==='login'?'active':''} onClick={()=>{setMode('login');setError('')}}>Մուտք</button>
        <button className={mode==='register'?'active':''} onClick={()=>{setMode('register');setError('')}}>Գրանցում</button>
      </div>
      <form className="auth-form" onSubmit={submit}>
        {mode==='login' ? <>
          <label>Օգտանուն կամ էլ․ փոստ<input autoComplete="username" value={form.identifier} onChange={update('identifier')} required /></label>
          <label>Գաղտնաբառ<input type="password" autoComplete="current-password" value={form.password} onChange={update('password')} required /></label>
        </> : <>
          <label>Օգտանուն<input autoComplete="username" value={form.username} onChange={update('username')} required /></label>
          <label>Էլ․ փոստ<input type="email" autoComplete="email" value={form.email} onChange={update('email')} required /></label>
          <label>Անուն<input autoComplete="name" value={form.displayName} onChange={update('displayName')} required /></label>
          <label>Աշխատանքային տարածք<input value={form.workspaceName} onChange={update('workspaceName')} required /></label>
          <label>Գաղտնաբառ <small>առնվազն 12 UTF-8 byte</small><input type="password" autoComplete="new-password" value={form.password} onChange={update('password')} required /></label>
        </>}
        {error&&<div className="auth-error">{error}</div>}
        <button className="primary auth-submit" disabled={busy}>{busy?'Սպասեք…':mode==='login'?'Մուտք գործել':'Ստեղծել հաշիվ'}</button>
      </form>
      {showTests&&<details className="test-logins"><summary>Թեստային մուտքեր</summary>{TEST_LOGINS.map(([username,role])=><button key={username} onClick={()=>setForm((f)=>({...f,identifier:username,password:'12345'}))}><b>{role}</b><span>{username} / 12345</span></button>)}</details>}
    </section>
  </main>;
}

function NotesDrawer({workspace,open,onClose}) {
  const [notes,setNotes]=useState([]); const [projects,setProjects]=useState([]); const [error,setError]=useState('');
  const [form,setForm]=useState({title:'',description:'',reminderDate:new Date().toISOString().slice(0,10),label:''});
  const canWrite=['owner','admin','member'].includes(workspace?.role);
  const load=async()=>{
    if(!workspace?.id)return;
    try{const [n,p]=await Promise.all([backendApi.notes(workspace.id),backendApi.projects(workspace.id)]);setNotes(n.notes||[]);setProjects(p.projects||[]);setError('');}
    catch(e){setError(e.message);}
  };
  useEffect(()=>{if(open)load()},[open,workspace?.id]);
  const create=async(e)=>{e.preventDefault();try{await backendApi.createNote(workspace.id,form);setForm({...form,title:'',description:'',label:''});await load()}catch(err){setError(err.message)}};
  const edit=async(note)=>{
    const title=window.prompt('Հիշեցման վերնագիր',note.title); if(!title?.trim())return;
    const description=window.prompt('Նկարագիր',note.description||''); if(description===null)return;
    const label=window.prompt('Պիտակ',note.label||''); if(label===null)return;
    const reminderDate=window.prompt('Ամսաթիվ (YYYY-MM-DD)',String(note.reminder_date||note.reminderDate||'').slice(0,10)); if(!reminderDate)return;
    try{await backendApi.updateNote(workspace.id,note.id,{expectedVersion:Number(note.version),title:title.trim(),description,reminderDate,label});await load()}catch(e){setError(e.message)}
  };
  const remove=async(note)=>{if(!window.confirm(`Ջնջե՞լ «${note.title}» հիշեցումը։`))return;try{await backendApi.deleteNote(workspace.id,note.id);await load()}catch(e){setError(e.message)}};
  const convert=async(note)=>{
    const type=window.prompt(`Կատարման տեսակ՝ ${EXECUTION_TYPES.map(([id,label])=>`${id} = ${label}`).join(', ')}`,'execute'); if(!type)return;
    const dueDate=window.prompt('Կատարման ժամկետ (YYYY-MM-DD)',String(note.reminder_date||note.reminderDate||'').slice(0,10)); if(!dueDate)return;
    const projectId=window.prompt(`Նախագծի ID (դատարկ = Առանց նախագծի)\n${projects.map((p)=>`${p.id} — ${p.name}`).join('\n')}`,'')||null;
    try{await backendApi.convertNote(workspace.id,note.id,{expectedVersion:Number(note.version),executionType:type,dueDate,projectId,priority:'normal'});await load();window.alert('Հիշեցումը վերափոխվեց առաջադրանքի։')}catch(e){setError(e.message)}
  };
  if(!open)return null;
  return <div className="backend-drawer"><div className="drawer-header"><div><strong>Հիշեցումներ</strong><span>Առաջադրանքի կարճ տարբերակ</span></div><button onClick={onClose}>×</button></div>
    {error&&<div className="auth-error">{error}</div>}
    {canWrite&&<form className="note-form" onSubmit={create}>
      <input placeholder="Վերնագիր" value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} required />
      <textarea placeholder="Նկարագիր" value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})} />
      <div className="note-form-row"><input type="date" value={form.reminderDate} onChange={(e)=>setForm({...form,reminderDate:e.target.value})} required /><input placeholder="Պիտակ" value={form.label} onChange={(e)=>setForm({...form,label:e.target.value})} /></div>
      <button className="primary">＋ Ավելացնել հիշեցում</button>
    </form>}
    <div className="note-list">{notes.length===0&&<div className="drawer-empty">Հիշեցումներ չկան։</div>}{notes.map((note)=><article className={note.status==='converted'?'note-item converted':'note-item'} key={note.id}>
      <div className="note-meta"><time>{String(note.reminder_date||note.reminderDate||'').slice(0,10)}</time>{note.label&&<span>{note.label}</span>}</div><h4>{note.title}</h4>{note.description&&<p>{note.description}</p>}
      {note.status==='converted'?<small>Վերափոխված է առաջադրանքի</small>:canWrite&&<div className="note-actions"><button onClick={()=>edit(note)}>Խմբագրել</button><button onClick={()=>convert(note)}>Դարձնել առաջադրանք</button><button className="danger-text" onClick={()=>remove(note)}>Ջնջել</button></div>}
    </article>)}</div>
  </div>;
}

function ProjectTeamDrawer({workspace,open,onClose}) {
  const [projects,setProjects]=useState([]); const [members,setMembers]=useState([]); const [assigned,setAssigned]=useState([]); const [selected,setSelected]=useState(''); const [error,setError]=useState('');
  const loadBase=async()=>{try{const [p,m]=await Promise.all([backendApi.projects(workspace.id),backendApi.members(workspace.id)]);setProjects(p.projects||[]);setMembers(m.members||[]);setSelected((value)=>value||(p.projects?.[0]?.id||''));setError('')}catch(e){setError(e.message)}};
  const loadAssigned=async()=>{if(!selected)return setAssigned([]);try{setAssigned((await backendApi.projectMembers(workspace.id,selected)).members||[])}catch(e){setError(e.message)}};
  useEffect(()=>{if(open)loadBase()},[open,workspace?.id]); useEffect(()=>{if(open)loadAssigned()},[open,selected]);
  const createProject=async()=>{const name=window.prompt('Նոր նախագծի անունը');if(!name?.trim())return;try{await backendApi.createProject(workspace.id,{name:name.trim()});await loadBase()}catch(e){setError(e.message)}};
  const renameProject=async()=>{const p=projects.find((item)=>item.id===selected);if(!p)return;const name=window.prompt('Նախագծի նոր անունը',p.name);if(!name?.trim())return;try{await backendApi.renameProject(workspace.id,p.id,{name:name.trim()});await loadBase()}catch(e){setError(e.message)}};
  const assign=async(userId,role)=>{try{await backendApi.setProjectMember(workspace.id,selected,userId,role);await loadAssigned()}catch(e){setError(e.message)}};
  const remove=async(userId)=>{try{await backendApi.removeProjectMember(workspace.id,selected,userId);await loadAssigned()}catch(e){setError(e.message)}};
  const assignedIds=useMemo(()=>new Set(assigned.map((m)=>m.id)),[assigned]);
  if(!open)return null;
  return <div className="backend-drawer"><div className="drawer-header"><div><strong>Նախագծի թիմ</strong><span>Նոր նախագիծը սկսվում է 0 բացահայտ վերագրումից</span></div><button onClick={onClose}>×</button></div>
    {error&&<div className="auth-error">{error}</div>}
    <div className="project-tools"><button className="primary" onClick={createProject}>＋ Նոր նախագիծ</button><button onClick={renameProject} disabled={!selected}>Վերանվանել</button></div>
    <select value={selected} onChange={(e)=>setSelected(e.target.value)}><option value="">Ընտրեք նախագիծ</option>{projects.map((p)=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
    <h4>Վերագրված թիմ</h4><div className="assignment-list">{assigned.map((m)=><div key={m.id}><span><b>{m.display_name||m.displayName}</b><small>{m.username_normalized||m.username} · {m.project_role||m.projectRole}</small></span><button onClick={()=>remove(m.id)}>Հեռացնել</button></div>)}{selected&&assigned.length===0&&<div className="drawer-empty">Այս նախագծին դեռ ոչ ոք բացահայտ վերագրված չէ։</div>}</div>
    <h4>Ավելացնել թիմից</h4><div className="assignment-list">{members.filter((m)=>!assignedIds.has(m.id)).map((m)=><div key={m.id}><span><b>{m.display_name||m.displayName}</b><small>{m.username_normalized||m.username} · {m.role}</small></span><select defaultValue="editor" onChange={(e)=>assign(m.id,e.target.value)} disabled={!selected}><option value="">Վերագրել…</option><option value="manager">Կառավարիչ</option><option value="editor">Խմբագիր</option><option value="viewer">Դիտորդ</option></select></div>)}</div>
  </div>;
}

export default function AuthGateway({children}) {
  const [state,setState]=useState({loading:true,session:null,workspace:null,error:''}); const [drawer,setDrawer]=useState('');
  const refresh=async()=>{
    try{const session=await backendApi.session();const workspaces=await backendApi.workspaces();setState({loading:false,session,workspace:workspaces.workspaces?.[0]||null,error:''})}
    catch(e){if(e.status===401)setState({loading:false,session:null,workspace:null,error:''});else setState({loading:false,session:null,workspace:null,error:e.message})}
  };
  useEffect(()=>{refresh()},[]);
  if(state.loading)return <main className="auth-page"><div className="auth-card">Julo-ը բեռնվում է…</div></main>;
  if(!state.session)return <AuthPage onAuthenticated={refresh}/>;
  const canManageProjects=['owner','admin'].includes(state.workspace?.role);
  return <div className="backend-gateway">{children}<div className="backend-toolbar"><span>{state.session.user.displayName} · {state.workspace?.role||'—'}</span><button onClick={()=>setDrawer(drawer==='tasks'?'':'tasks')}>☷ Առաջադրանքներ</button><button onClick={()=>setDrawer(drawer==='notes'?'':'notes')}>◷ Հիշեցումներ</button>{canManageProjects&&<button onClick={()=>setDrawer(drawer==='team'?'':'team')}>♙ Նախագծի թիմ</button>}<button onClick={async()=>{await backendApi.logout();setDrawer('');await refresh()}}>Ելք</button></div>
    {state.workspace&&<BackendTasksDrawer workspace={state.workspace} user={state.session.user} open={drawer==='tasks'} onClose={()=>setDrawer('')}/>} {state.workspace&&<NotesDrawer workspace={state.workspace} open={drawer==='notes'} onClose={()=>setDrawer('')}/>} {state.workspace&&canManageProjects&&<ProjectTeamDrawer workspace={state.workspace} open={drawer==='team'} onClose={()=>setDrawer('')}/>} 
  </div>;
}
