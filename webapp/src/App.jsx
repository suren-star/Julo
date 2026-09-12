import { useEffect, useMemo, useRef, useState } from 'react';
import {
  emptyWorkspace,
  loadWorkspace,
  parseWorkspaceBackup,
  saveWorkspace,
  serializeWorkspace,
} from './lib/storage.js';
import {
  PROJECT_ROLES,
  WORKSPACE_ROLES,
  canForMember,
  canManageMemberRole,
  visibleProjectsForMember,
} from './lib/permissions.js';
import { TASK_EXECUTION_TYPES } from './lib/task-types.js';

const STATUSES = [
  { id: 'todo', title: 'Առաջադրանք', icon: '○' },
  { id: 'doing', title: 'Ընթացքում', icon: '◐' },
  { id: 'done', title: 'Ավարտված', icon: '●' },
];
const PRIORITIES = {
  low: { label: 'Ցածր', icon: '↓' },
  normal: { label: 'Սովորական', icon: '–' },
  high: { label: 'Բարձր', icon: '↑' },
  urgent: { label: 'Շտապ', icon: '!' },
};
const uid = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const todayKey = () => new Date().toISOString().slice(0, 10);

function App() {
  const [workspace, setWorkspace] = useState(emptyWorkspace());
  const [ready, setReady] = useState(false);
  const [view, setView] = useState('board');
  const [activeProject, setActiveProject] = useState('all');
  const [query, setQuery] = useState('');
  const [executionTypeFilter, setExecutionTypeFilter] = useState('all');
  const [editingTask, setEditingTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const importInputRef = useRef(null);

  useEffect(() => {
    loadWorkspace().then((data) => {
      setWorkspace(data);
      document.documentElement.dataset.theme = data.settings?.theme || 'light';
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (ready) saveWorkspace(workspace);
  }, [workspace, ready]);

  const currentMember = useMemo(
    () => workspace.members.find((member) => member.id === workspace.currentUserId) || workspace.members[0],
    [workspace.members, workspace.currentUserId],
  );

  const visibleProjects = useMemo(
    () => visibleProjectsForMember(workspace, currentMember),
    [workspace.projects, currentMember],
  );
  const visibleProjectIds = useMemo(() => new Set(visibleProjects.map((project) => project.id)), [visibleProjects]);

  useEffect(() => {
    if (activeProject !== 'all' && !visibleProjectIds.has(activeProject)) setActiveProject('all');
  }, [activeProject, visibleProjectIds]);

  const tasks = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('hy-AM');
    return workspace.tasks.filter((task) => {
      if (currentMember?.role === 'guest' && !visibleProjectIds.has(task.projectId)) return false;
      if (activeProject !== 'all' && task.projectId !== activeProject) return false;
      if (executionTypeFilter !== 'all' && task.executionType !== executionTypeFilter) return false;
      if (view === 'today' && task.dueDate !== todayKey()) return false;
      if (view === 'done' && task.status !== 'done') return false;
      if (view !== 'done' && view !== 'board' && view !== 'today' && view !== 'team' && task.status === 'done') return false;
      if (view === 'all' && task.status === 'done') return false;
      if (!q) return true;
      return [
        task.title,
        task.description,
        TASK_EXECUTION_TYPES[task.executionType] || '',
        ...(task.tags || []),
        ...(task.comments || []).map((comment) => comment.text),
      ].join(' ').toLocaleLowerCase('hy-AM').includes(q);
    });
  }, [workspace.tasks, currentMember, visibleProjectIds, activeProject, executionTypeFilter, view, query]);

  const projectName = (id) => workspace.projects.find((p) => p.id === id)?.name || 'Առանց նախագծի';
  const projectTaskCount = (id) => workspace.tasks.filter((task) => task.projectId === id && task.status !== 'done').length;
  const canManageMembers = canForMember(currentMember, 'members.manage');
  const canExport = canForMember(currentMember, 'workspace.export');
  const canImport = canForMember(currentMember, 'workspace.import');
  const canCreateProject = canForMember(currentMember, 'projects.create');
  const canCreateTask = (projectId = '') => canForMember(currentMember, 'tasks.create', projectId);

  const patchTask = (id, patch) => {
    const task = workspace.tasks.find((item) => item.id === id);
    if (!task || !canForMember(currentMember, 'tasks.update', task.projectId)) return;
    setWorkspace((s) => ({
      ...s,
      tasks: s.tasks.map((t) => t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t),
    }));
  };

  const deleteTask = (id) => {
    const task = workspace.tasks.find((item) => item.id === id);
    if (!task || !canForMember(currentMember, 'tasks.delete', task.projectId)) return;
    setWorkspace((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));
  };

  const addTaskComment = (taskId, text) => {
    const cleanText = text.trim();
    const task = workspace.tasks.find((item) => item.id === taskId);
    if (!cleanText || !task || !canForMember(currentMember, 'tasks.comment', task.projectId)) return false;

    const comment = {
      id: uid('comment'),
      authorId: currentMember?.id || '',
      authorName: currentMember?.name || 'Օգտատեր',
      text: cleanText,
      createdAt: new Date().toISOString(),
    };

    setWorkspace((s) => ({
      ...s,
      tasks: s.tasks.map((item) => item.id === taskId
        ? { ...item, comments: [...(item.comments || []), comment], updatedAt: new Date().toISOString() }
        : item),
    }));
    setEditingTask((current) => current?.id === taskId
      ? { ...current, comments: [...(current.comments || []), comment], updatedAt: new Date().toISOString() }
      : current);
    return true;
  };

  const openNewTask = (status = 'todo') => {
    const projectId = activeProject === 'all' ? '' : activeProject;
    if (!canCreateTask(projectId)) {
      window.alert('Ձեր դերը թույլ չի տալիս այստեղ առաջադրանք ստեղծել։');
      return;
    }
    setEditingTask({
      id: null,
      title: '',
      description: '',
      status,
      projectId,
      priority: 'normal',
      executionType: '',
      dueDate: '',
      tags: [],
      comments: [],
    });
    setShowTaskModal(true);
  };

  const saveTask = (task) => {
    const clean = {
      ...task,
      title: task.title.trim(),
      tags: Array.isArray(task.tags) ? task.tags.filter(Boolean) : [],
    };
    if (!clean.title) {
      window.alert('Լրացրեք առաջադրանքի վերնագիրը։');
      return;
    }
    if (!TASK_EXECUTION_TYPES[clean.executionType]) {
      window.alert('Ընտրեք առաջադրանքի կատարման տեսակը։');
      return;
    }
    if (!clean.dueDate) {
      window.alert('Նշեք առաջադրանքի կատարման ժամկետը։');
      return;
    }

    const existing = clean.id ? workspace.tasks.find((item) => item.id === clean.id) : null;
    if (existing && !canForMember(currentMember, 'tasks.update', existing.projectId)) return;
    if (!existing && !canCreateTask(clean.projectId)) return;
    if (existing && clean.projectId !== existing.projectId && !canForMember(currentMember, 'tasks.update', clean.projectId)) return;

    setWorkspace((s) => clean.id
      ? {
        ...s,
        tasks: s.tasks.map((t) => t.id === clean.id
          ? { ...t, ...clean, comments: t.comments || [], updatedAt: new Date().toISOString() }
          : t),
      }
      : {
        ...s,
        tasks: [...s.tasks, { ...clean, comments: [], id: uid('task'), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }],
      });
    setShowTaskModal(false);
  };

  const addProject = () => {
    if (!canCreateProject) return;
    const name = window.prompt('Նոր նախագծի անունը');
    if (!name?.trim()) return;
    const project = { id: uid('project'), name: name.trim(), createdAt: new Date().toISOString() };
    setWorkspace((s) => ({ ...s, projects: [...s.projects, project] }));
    setActiveProject(project.id);
    setView('board');
  };

  const renameProject = (project) => {
    if (!canForMember(currentMember, 'projects.update', project.id)) return;
    const name = window.prompt('Նախագծի նոր անունը', project.name);
    if (!name?.trim() || name.trim() === project.name) return;
    setWorkspace((s) => ({
      ...s,
      projects: s.projects.map((item) => item.id === project.id ? { ...item, name: name.trim() } : item),
    }));
  };

  const removeProject = (project) => {
    if (!canForMember(currentMember, 'projects.delete', project.id)) return;
    const count = workspace.tasks.filter((task) => task.projectId === project.id).length;
    const message = count
      ? `Ջնջե՞լ «${project.name}» նախագիծը։ ${count} առաջադրանք չի ջնջվի և կտեղափոխվի «Առանց նախագծի»։`
      : `Ջնջե՞լ «${project.name}» նախագիծը։`;
    if (!window.confirm(message)) return;
    setWorkspace((s) => ({
      ...s,
      projects: s.projects.filter((item) => item.id !== project.id),
      tasks: s.tasks.map((task) => task.projectId === project.id ? { ...task, projectId: '', updatedAt: new Date().toISOString() } : task),
      members: s.members.map((member) => {
        if (!member.projectRoles?.[project.id]) return member;
        const projectRoles = { ...member.projectRoles };
        delete projectRoles[project.id];
        return { ...member, projectRoles };
      }),
    }));
    if (activeProject === project.id) {
      setActiveProject('all');
      setView('board');
    }
  };

  const addMember = () => {
    if (!canManageMembers) return;
    const name = window.prompt('Անդամի անունը');
    if (!name?.trim()) return;
    const email = window.prompt('Էլ․ փոստը (կարող եք թողնել դատարկ)') || '';
    const member = {
      id: uid('member'),
      name: name.trim(),
      email: email.trim(),
      role: 'member',
      status: 'active',
      projectRoles: {},
      createdAt: new Date().toISOString(),
    };
    setWorkspace((s) => ({ ...s, members: [...s.members, member] }));
  };

  const changeMemberRole = (memberId, nextRole) => {
    if (!WORKSPACE_ROLES[nextRole]) return;
    const target = workspace.members.find((member) => member.id === memberId);
    if (!target || memberId === workspace.currentUserId) return;
    if (!canManageMemberRole(currentMember?.role, target.role, nextRole)) return;
    setWorkspace((s) => ({
      ...s,
      members: s.members.map((member) => member.id === memberId ? { ...member, role: nextRole, projectRoles: nextRole === 'guest' ? member.projectRoles : {} } : member),
    }));
  };

  const removeMember = (memberId) => {
    if (!canManageMembers || memberId === workspace.currentUserId) return;
    const target = workspace.members.find((member) => member.id === memberId);
    if (!target || target.role === 'owner') return;
    if (!window.confirm(`Հեռացնե՞լ «${target.name}» անդամին աշխատանքային տարածքից։`)) return;
    setWorkspace((s) => ({ ...s, members: s.members.filter((member) => member.id !== memberId) }));
  };

  const setGuestProjectRole = (memberId, projectId, projectRole) => {
    if (!canManageMembers) return;
    setWorkspace((s) => ({
      ...s,
      members: s.members.map((member) => {
        if (member.id !== memberId || member.role !== 'guest') return member;
        const projectRoles = { ...(member.projectRoles || {}) };
        if (projectRole && PROJECT_ROLES[projectRole]) projectRoles[projectId] = projectRole;
        else delete projectRoles[projectId];
        return { ...member, projectRoles };
      }),
    }));
  };

  const exportBackup = () => {
    if (!canExport) return;
    const blob = new Blob([serializeWorkspace(workspace)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `julo-backup-${todayKey()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const importBackup = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !canImport) return;
    try {
      const restored = parseWorkspaceBackup(await file.text());
      if (!window.confirm('Ներմուծումը կփոխարինի այս դիտարկիչում գտնվող Julo տվյալները։ Շարունակե՞լ։')) return;
      setWorkspace(restored);
      setActiveProject('all');
      setView('board');
      setQuery('');
      setExecutionTypeFilter('all');
      document.documentElement.dataset.theme = restored.settings?.theme || 'light';
      window.alert('Julo-ի պահուստային պատճենը հաջողությամբ ներմուծվեց։');
    } catch (error) {
      window.alert(error?.message || 'Չհաջողվեց ներմուծել պահուստային պատճենը։');
    }
  };

  const toggleTheme = () => {
    const theme = workspace.settings?.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    setWorkspace((s) => ({ ...s, settings: { ...s.settings, theme } }));
  };

  const headerTitle = view === 'team'
    ? 'Թիմ և դերեր'
    : view === 'today'
      ? 'Այսօրվա աշխատանքը'
      : view === 'done'
        ? 'Ավարտված առաջադրանքներ'
        : view === 'all'
          ? 'Բոլոր առաջադրանքները'
          : activeProject === 'all' ? 'Աշխատանքային տախտակ' : projectName(activeProject);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">J</div><div><strong>Julo</strong><span>աշխատանքային տարածք</span></div></div>
        <button className="primary full" onClick={() => openNewTask()} disabled={!canCreateTask(activeProject === 'all' ? '' : activeProject)}>＋ Նոր առաջադրանք</button>
        <nav className="nav-list">
          <Nav active={view === 'board'} onClick={() => setView('board')} icon="▦">Տախտակ</Nav>
          <Nav active={view === 'today'} onClick={() => setView('today')} icon="◷">Այսօր</Nav>
          <Nav active={view === 'all'} onClick={() => setView('all')} icon="☷">Բոլոր առաջադրանքները</Nav>
          <Nav active={view === 'done'} onClick={() => setView('done')} icon="✓">Ավարտված</Nav>
          <Nav active={view === 'team'} onClick={() => setView('team')} icon="♙">Թիմ և դերեր</Nav>
        </nav>
        <div className="section-title"><span>Նախագծեր</span>{canCreateProject && <button onClick={addProject} title="Ավելացնել նախագիծ">＋</button>}</div>
        <div className="project-list">
          <button className={activeProject === 'all' ? 'project active' : 'project'} onClick={() => setActiveProject('all')}><span className="dot neutral" />Բոլորը</button>
          {visibleProjects.map((project) => (
            <div className="project-row" key={project.id}>
              <button className={activeProject === project.id ? 'project active' : 'project'} onClick={() => { setActiveProject(project.id); setView('board'); }}>
                <span className="dot" />
                <span className="project-name">{project.name}</span>
                <span className="project-count">{projectTaskCount(project.id)}</span>
              </button>
              {(canForMember(currentMember, 'projects.update', project.id) || canForMember(currentMember, 'projects.delete', project.id)) && (
                <div className="project-actions">
                  {canForMember(currentMember, 'projects.update', project.id) && <button onClick={() => renameProject(project)} title="Վերանվանել նախագիծ">✎</button>}
                  {canForMember(currentMember, 'projects.delete', project.id) && <button onClick={() => removeProject(project)} title="Ջնջել նախագիծ">×</button>}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="sidebar-footer">
          <div className="current-role"><strong>{currentMember?.name || 'Օգտատեր'}</strong><span>{WORKSPACE_ROLES[currentMember?.role]?.label || ''}</span></div>
          <span>Տվյալները պահվում են այս դիտարկիչում</span>
          {(canExport || canImport) && <div className="data-actions">
            {canExport && <button onClick={exportBackup}>⇩ Արտահանել</button>}
            {canImport && <button onClick={() => importInputRef.current?.click()}>⇧ Ներմուծել</button>}
          </div>}
          <input ref={importInputRef} className="hidden-input" type="file" accept="application/json,.json" onChange={importBackup} />
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">JULO / {view === 'team' ? 'ԹԻՄ' : activeProject === 'all' ? 'ԱՇԽԱՏԱՆՔԱՅԻՆ ՏԱՐԱԾՔ' : 'ՆԱԽԱԳԻԾ'}</p>
            <h1>{headerTitle}</h1>
          </div>
          {view !== 'team' && <div className="top-actions">
            <label className="search"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Որոնել առաջադրանքներ…" /></label>
            <select className="type-filter" value={executionTypeFilter} onChange={(e) => setExecutionTypeFilter(e.target.value)} title="Ֆիլտրել ըստ կատարման տեսակի">
              <option value="all">Բոլոր կատարման տեսակները</option>
              {Object.entries(TASK_EXECUTION_TYPES).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
            <button className="icon-button" onClick={toggleTheme} title="Փոխել թեման">◐</button>
            <button className="primary" onClick={() => openNewTask()} disabled={!canCreateTask(activeProject === 'all' ? '' : activeProject)}>＋ Ավելացնել</button>
          </div>}
          {view === 'team' && <div className="top-actions">
            <button className="icon-button" onClick={toggleTheme} title="Փոխել թեման">◐</button>
            {canManageMembers && <button className="primary" onClick={addMember}>＋ Ավելացնել անդամ</button>}
          </div>}
        </header>

        {view === 'team' ? (
          <TeamView
            members={workspace.members}
            projects={workspace.projects}
            currentUserId={workspace.currentUserId}
            actorRole={currentMember?.role}
            canManage={canManageMembers}
            onRoleChange={changeMemberRole}
            onRemove={removeMember}
            onGuestProjectRole={setGuestProjectRole}
            onAdd={addMember}
          />
        ) : view === 'board' ? (
          <div className="board">
            {STATUSES.map((status) => (
              <section
                className="column"
                key={status.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => patchTask(e.dataTransfer.getData('text/task-id'), { status: status.id })}
              >
                <div className="column-head"><div><span className={`status-icon ${status.id}`}>{status.icon}</span><strong>{status.title}</strong><span className="count">{tasks.filter((t) => t.status === status.id).length}</span></div>{canCreateTask(activeProject === 'all' ? '' : activeProject) && <button onClick={() => openNewTask(status.id)}>＋</button>}</div>
                <div className="cards">
                  {tasks.filter((t) => t.status === status.id).map((task) => <TaskCard key={task.id} task={task} project={projectName(task.projectId)} onOpen={() => { setEditingTask(task); setShowTaskModal(true); }} onDragStart={(e) => e.dataTransfer.setData('text/task-id', task.id)} draggable={canForMember(currentMember, 'tasks.update', task.projectId)} />)}
                  {canCreateTask(activeProject === 'all' ? '' : activeProject) && <button className="add-card" onClick={() => openNewTask(status.id)}>＋ Ավելացնել առաջադրանք</button>}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="list-view">
            {tasks.length === 0 ? <EmptyState onAdd={() => openNewTask()} canAdd={canCreateTask(activeProject === 'all' ? '' : activeProject)} /> : tasks.map((task) => (
              <button className="list-task" key={task.id} onClick={() => { setEditingTask(task); setShowTaskModal(true); }}>
                <span className={`check ${task.status === 'done' ? 'checked' : ''}`} onClick={(e) => { e.stopPropagation(); patchTask(task.id, { status: task.status === 'done' ? 'todo' : 'done' }); }}>{task.status === 'done' ? '✓' : ''}</span>
                <span className="list-main">
                  <strong>{task.title}</strong>
                  <small>{projectName(task.projectId)} · {TASK_EXECUTION_TYPES[task.executionType] || 'Կատարման տեսակ չի նշված'} · {task.dueDate || 'Ժամկետ չի նշված'}{task.comments?.length ? ` · 💬 ${task.comments.length}` : ''}</small>
                </span>
                <span className={`priority ${task.priority}`}>{PRIORITIES[task.priority]?.icon}</span>
              </button>
            ))}
          </div>
        )}
      </main>

      {showTaskModal && <TaskModal
        task={editingTask}
        projects={visibleProjects}
        readOnly={editingTask?.id ? !canForMember(currentMember, 'tasks.update', editingTask.projectId) : false}
        canDelete={editingTask?.id ? canForMember(currentMember, 'tasks.delete', editingTask.projectId) : false}
        canComment={editingTask?.id ? canForMember(currentMember, 'tasks.comment', editingTask.projectId) : false}
        onAddComment={addTaskComment}
        onClose={() => setShowTaskModal(false)}
        onSave={saveTask}
        onDelete={(id) => { deleteTask(id); setShowTaskModal(false); }}
      />}
    </div>
  );
}

function Nav({ active, icon, children, onClick }) { return <button className={active ? 'nav active' : 'nav'} onClick={onClick}><span>{icon}</span>{children}</button>; }

function TaskCard({ task, project, onOpen, onDragStart, draggable }) {
  return <article className="task-card" draggable={draggable} onDragStart={draggable ? onDragStart : undefined} onClick={onOpen}>
    <div className="card-top"><span className={`priority-pill ${task.priority}`}>{PRIORITIES[task.priority]?.label}</span><span className="drag">{draggable ? '⋮⋮' : '◦'}</span></div>
    <h3>{task.title}</h3>
    <div className={`execution-type ${task.executionType ? '' : 'missing'}`}>{TASK_EXECUTION_TYPES[task.executionType] || 'Կատարման տեսակ չի նշված'}</div>
    {task.description && <p>{task.description}</p>}
    {(task.tags || []).length > 0 && <div className="tags">{task.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>}
    <div className="card-meta">
      <span>▣ {project}{task.comments?.length ? ` · 💬 ${task.comments.length}` : ''}</span>
      <span className={!task.dueDate || (task.dueDate < todayKey() && task.status !== 'done') ? 'overdue' : ''}>◷ {task.dueDate || 'Ժամկետ չի նշված'}</span>
    </div>
  </article>;
}

function TaskModal({ task, projects, readOnly, canDelete, canComment, onAddComment, onClose, onSave, onDelete }) {
  const [draft, setDraft] = useState({
    ...task,
    executionType: task.executionType || '',
    dueDate: task.dueDate || '',
    tags: task.tags || [],
  });
  const [commentText, setCommentText] = useState('');
  const set = (key, value) => setDraft((d) => ({ ...d, [key]: value }));
  const canSave = Boolean(draft.title.trim() && TASK_EXECUTION_TYPES[draft.executionType] && draft.dueDate);
  const comments = task.comments || [];

  const submitComment = () => {
    const text = commentText.trim();
    if (!text || !task.id || !canComment) return;
    if (onAddComment(task.id, text)) setCommentText('');
  };

  return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal" onMouseDown={(e) => e.stopPropagation()}>
    <div className="modal-head"><div><p className="eyebrow">ԱՌԱՋԱԴՐԱՆՔ</p><h2>{draft.id ? readOnly ? 'Դիտել առաջադրանքը' : 'Խմբագրել առաջադրանքը' : 'Նոր առաջադրանք'}</h2></div><button className="icon-button" onClick={onClose}>×</button></div>
    <label className="field"><span>Վերնագիր *</span><input autoFocus={!readOnly} disabled={readOnly} required value={draft.title} onChange={(e) => set('title', e.target.value)} placeholder="Ի՞նչ պետք է անել" /></label>
    <label className="field"><span>Նկարագրություն</span><textarea rows="4" disabled={readOnly} value={draft.description} onChange={(e) => set('description', e.target.value)} placeholder="Մանրամասներ, հղումներ կամ նշումներ…" /></label>
    <div className="field-grid">
      <label className="field"><span>Նախագիծ</span><select disabled={readOnly} value={draft.projectId} onChange={(e) => set('projectId', e.target.value)}><option value="">Առանց նախագծի</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <label className="field"><span>Կարգավիճակ</span><select disabled={readOnly} value={draft.status} onChange={(e) => set('status', e.target.value)}>{STATUSES.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</select></label>
      <label className="field"><span>Կատարման տեսակ *</span><select disabled={readOnly} required value={draft.executionType} onChange={(e) => set('executionType', e.target.value)}><option value="">Ընտրել կատարման տեսակը</option>{Object.entries(TASK_EXECUTION_TYPES).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      <label className="field"><span>Առաջնահերթություն</span><select disabled={readOnly} value={draft.priority} onChange={(e) => set('priority', e.target.value)}>{Object.entries(PRIORITIES).map(([id, p]) => <option key={id} value={id}>{p.label}</option>)}</select></label>
      <label className="field"><span>Կատարման ժամկետ *</span><input disabled={readOnly} required type="date" value={draft.dueDate} onChange={(e) => set('dueDate', e.target.value)} /></label>
    </div>
    {!readOnly && <p className="required-note">* Պարտադիր լրացվող դաշտեր</p>}
    <label className="field"><span>Պիտակներ</span><input disabled={readOnly} value={draft.tags.join(', ')} onChange={(e) => set('tags', e.target.value.split(',').map((x) => x.trim()))} placeholder="օրինակ՝ դիզայն, հաճախորդ" /></label>

    <section className="comments-section">
      <div className="comments-head"><strong>Մեկնաբանություններ</strong><span>{comments.length}</span></div>
      {comments.length > 0 ? <div className="comment-list">
        {comments.map((comment) => <article className="comment" key={comment.id}>
          <div className="comment-meta"><strong>{comment.authorName || 'Օգտատեր'}</strong><time>{new Date(comment.createdAt).toLocaleString('hy-AM')}</time></div>
          <p>{comment.text}</p>
        </article>)}
      </div> : <p className="comments-empty">Այս առաջադրանքի համար դեռ մեկնաբանություններ չկան։</p>}
      {task.id && canComment && <div className="comment-compose">
        <textarea rows="3" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Գրել մեկնաբանություն…" />
        <button className="primary" disabled={!commentText.trim()} onClick={submitComment}>Ուղարկել</button>
      </div>}
      {!task.id && <p className="comments-hint">Մեկնաբանություն ավելացնելու համար նախ պահպանեք առաջադրանքը։</p>}
      {task.id && !canComment && <p className="comments-hint">Ձեր դերը թույլ չի տալիս մեկնաբանություն ավելացնել։</p>}
    </section>

    <div className="modal-actions">{draft.id && canDelete ? <button className="danger" onClick={() => onDelete(draft.id)}>Ջնջել</button> : <span />}<div><button className="ghost" onClick={onClose}>{readOnly ? 'Փակել' : 'Չեղարկել'}</button>{!readOnly && <button className="primary" disabled={!canSave} onClick={() => onSave(draft)}>Պահպանել</button>}</div></div>
  </div></div>;
}

function TeamView({ members, projects, currentUserId, actorRole, canManage, onRoleChange, onRemove, onGuestProjectRole, onAdd }) {
  return <div className="team-view">
    <section className="role-grid">
      {Object.entries(WORKSPACE_ROLES).map(([id, role]) => <article className="role-card" key={id}>
        <div className="role-card-head"><strong>{role.label}</strong><span>{members.filter((member) => member.role === id).length}</span></div>
        <p>{role.description}</p>
      </article>)}
    </section>

    <section className="team-panel">
      <div className="team-panel-head"><div><h2>Անդամներ</h2><p>Workspace դերերը կիրառվում են ամբողջ Julo-ի վրա։ Հյուրերի հասանելիությունը սահմանվում է նախագծերով։</p></div>{canManage && <button className="primary" onClick={onAdd}>＋ Ավելացնել անդամ</button>}</div>
      <div className="member-list">
        {members.map((member) => {
          const isCurrent = member.id === currentUserId;
          const canChange = canManage && !isCurrent;
          return <article className="member-card" key={member.id}>
            <div className="member-main">
              <div className="avatar">{member.name.slice(0, 1).toLocaleUpperCase('hy-AM')}</div>
              <div><strong>{member.name}{isCurrent ? ' · Դուք' : ''}</strong><span>{member.email || 'Էլ․ փոստ նշված չէ'}</span></div>
            </div>
            <div className="member-controls">
              <select
                value={member.role}
                disabled={!canChange}
                onChange={(e) => onRoleChange(member.id, e.target.value)}
                title={isCurrent ? 'Ձեր սեփական դերը այս փուլում չի փոխվում այստեղից' : 'Փոխել դերը'}
              >
                {Object.entries(WORKSPACE_ROLES).map(([id, role]) => <option key={id} value={id} disabled={!canManageMemberRole(actorRole, member.role, id)}>{role.label}</option>)}
              </select>
              {canManage && !isCurrent && member.role !== 'owner' && <button className="danger subtle" onClick={() => onRemove(member.id)}>Հեռացնել</button>}
            </div>

            {member.role === 'guest' && <div className="guest-access">
              <div className="guest-access-title"><strong>Նախագծային հասանելիություն</strong><span>Յուրաքանչյուր նախագծի համար ընտրեք հյուրի իրավունքը։</span></div>
              {projects.length === 0 ? <p className="muted">Նախագծեր դեռ չկան։</p> : <div className="guest-projects">
                {projects.map((project) => <label key={project.id}>
                  <span>{project.name}</span>
                  <select disabled={!canManage} value={member.projectRoles?.[project.id] || ''} onChange={(e) => onGuestProjectRole(member.id, project.id, e.target.value)}>
                    <option value="">Հասանելի չէ</option>
                    {Object.entries(PROJECT_ROLES).map(([id, role]) => <option key={id} value={id}>{role.label}</option>)}
                  </select>
                </label>)}
              </div>}
            </div>}
          </article>;
        })}
      </div>
    </section>

    <div className="security-note"><strong>Այս beta փուլում դերերը պահվում և կիրառվում են webapp-ի client-side տվյալներում։</strong><span>Իրական բազմաօգտատեր անվտանգությունը պահանջում է authentication և server-side permission checks, որոնք կկապենք նույն role model-ին backend փուլում։</span></div>
  </div>;
}

function EmptyState({ onAdd, canAdd }) { return <div className="empty"><div>✓</div><h2>Այստեղ դեռ առաջադրանքներ չկան</h2><p>{canAdd ? 'Ստեղծեք առաջին առաջադրանքը և սկսեք կազմակերպել աշխատանքը Julo-ում։' : 'Ձեր դերը թույլ է տալիս դիտել, բայց ոչ ստեղծել առաջադրանքներ։'}</p>{canAdd && <button className="primary" onClick={onAdd}>＋ Ստեղծել առաջադրանք</button>}</div>; }

export default App;
