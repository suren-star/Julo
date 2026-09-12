import { useEffect, useMemo, useState } from 'react';
import { emptyWorkspace, loadWorkspace, saveWorkspace } from './lib/storage.js';

const STATUSES = [
  { id: 'todo', title: 'Անելիք', icon: '○' },
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
  const [editingTask, setEditingTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);

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

  const tasks = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('hy-AM');
    return workspace.tasks.filter((task) => {
      if (activeProject !== 'all' && task.projectId !== activeProject) return false;
      if (view === 'today' && task.dueDate !== todayKey()) return false;
      if (view === 'done' && task.status !== 'done') return false;
      if (view !== 'done' && view !== 'board' && view !== 'today' && task.status === 'done') return false;
      if (view === 'all' && task.status === 'done') return false;
      if (!q) return true;
      return [task.title, task.description, ...(task.tags || [])].join(' ').toLocaleLowerCase('hy-AM').includes(q);
    });
  }, [workspace.tasks, activeProject, view, query]);

  const projectName = (id) => workspace.projects.find((p) => p.id === id)?.name || 'Առանց նախագծի';
  const patchTask = (id, patch) => setWorkspace((s) => ({
    ...s,
    tasks: s.tasks.map((t) => t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t),
  }));
  const deleteTask = (id) => setWorkspace((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));

  const openNewTask = (status = 'todo') => {
    setEditingTask({
      id: null, title: '', description: '', status,
      projectId: activeProject === 'all' ? '' : activeProject,
      priority: 'normal', dueDate: '', tags: [],
    });
    setShowTaskModal(true);
  };

  const saveTask = (task) => {
    const clean = { ...task, title: task.title.trim(), tags: task.tags.filter(Boolean) };
    if (!clean.title) return;
    setWorkspace((s) => clean.id
      ? { ...s, tasks: s.tasks.map((t) => t.id === clean.id ? { ...t, ...clean, updatedAt: new Date().toISOString() } : t) }
      : { ...s, tasks: [...s.tasks, { ...clean, id: uid('task'), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }] });
    setShowTaskModal(false);
  };

  const addProject = () => {
    const name = window.prompt('Նոր նախագծի անունը');
    if (!name?.trim()) return;
    const project = { id: uid('project'), name: name.trim(), createdAt: new Date().toISOString() };
    setWorkspace((s) => ({ ...s, projects: [...s.projects, project] }));
    setActiveProject(project.id);
    setView('board');
  };

  const toggleTheme = () => {
    const theme = workspace.settings?.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    setWorkspace((s) => ({ ...s, settings: { ...s.settings, theme } }));
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">J</div><div><strong>Julo</strong><span>աշխատանքային տարածք</span></div></div>
        <button className="primary full" onClick={() => openNewTask()}>＋ Նոր առաջադրանք</button>
        <nav className="nav-list">
          <Nav active={view === 'board'} onClick={() => setView('board')} icon="▦">Տախտակ</Nav>
          <Nav active={view === 'today'} onClick={() => setView('today')} icon="◷">Այսօր</Nav>
          <Nav active={view === 'all'} onClick={() => setView('all')} icon="☷">Բոլոր առաջադրանքները</Nav>
          <Nav active={view === 'done'} onClick={() => setView('done')} icon="✓">Ավարտված</Nav>
        </nav>
        <div className="section-title"><span>Նախագծեր</span><button onClick={addProject} title="Ավելացնել նախագիծ">＋</button></div>
        <div className="project-list">
          <button className={activeProject === 'all' ? 'project active' : 'project'} onClick={() => setActiveProject('all')}><span className="dot neutral" />Բոլորը</button>
          {workspace.projects.map((project) => (
            <button key={project.id} className={activeProject === project.id ? 'project active' : 'project'} onClick={() => { setActiveProject(project.id); setView('board'); }}><span className="dot" />{project.name}</button>
          ))}
        </div>
        <div className="sidebar-footer"><span>Տվյալները պահվում են այս դիտարկիչում</span></div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">JULO / {activeProject === 'all' ? 'ԱՇԽԱՏԱՆՔԱՅԻՆ ՏԱՐԱԾՔ' : 'ՆԱԽԱԳԻԾ'}</p>
            <h1>{view === 'today' ? 'Այսօրվա աշխատանքը' : view === 'done' ? 'Ավարտված առաջադրանքներ' : view === 'all' ? 'Բոլոր առաջադրանքները' : activeProject === 'all' ? 'Աշխատանքային տախտակ' : projectName(activeProject)}</h1>
          </div>
          <div className="top-actions">
            <label className="search"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Որոնել առաջադրանքներ…" /></label>
            <button className="icon-button" onClick={toggleTheme} title="Փոխել թեման">◐</button>
            <button className="primary" onClick={() => openNewTask()}>＋ Ավելացնել</button>
          </div>
        </header>

        {view === 'board' ? (
          <div className="board">
            {STATUSES.map((status) => (
              <section className="column" key={status.id} onDragOver={(e) => e.preventDefault()} onDrop={(e) => patchTask(e.dataTransfer.getData('text/task-id'), { status: status.id })}>
                <div className="column-head"><div><span className={`status-icon ${status.id}`}>{status.icon}</span><strong>{status.title}</strong><span className="count">{tasks.filter((t) => t.status === status.id).length}</span></div><button onClick={() => openNewTask(status.id)}>＋</button></div>
                <div className="cards">
                  {tasks.filter((t) => t.status === status.id).map((task) => <TaskCard key={task.id} task={task} project={projectName(task.projectId)} onOpen={() => { setEditingTask(task); setShowTaskModal(true); }} onDragStart={(e) => e.dataTransfer.setData('text/task-id', task.id)} />)}
                  <button className="add-card" onClick={() => openNewTask(status.id)}>＋ Ավելացնել առաջադրանք</button>
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="list-view">
            {tasks.length === 0 ? <EmptyState onAdd={() => openNewTask()} /> : tasks.map((task) => (
              <button className="list-task" key={task.id} onClick={() => { setEditingTask(task); setShowTaskModal(true); }}>
                <span className={`check ${task.status === 'done' ? 'checked' : ''}`} onClick={(e) => { e.stopPropagation(); patchTask(task.id, { status: task.status === 'done' ? 'todo' : 'done' }); }}>{task.status === 'done' ? '✓' : ''}</span>
                <span className="list-main"><strong>{task.title}</strong><small>{projectName(task.projectId)}{task.dueDate ? ` · ${task.dueDate}` : ''}</small></span>
                <span className={`priority ${task.priority}`}>{PRIORITIES[task.priority]?.icon}</span>
              </button>
            ))}
          </div>
        )}
      </main>

      {showTaskModal && <TaskModal task={editingTask} projects={workspace.projects} onClose={() => setShowTaskModal(false)} onSave={saveTask} onDelete={(id) => { deleteTask(id); setShowTaskModal(false); }} />}
    </div>
  );
}

function Nav({ active, icon, children, onClick }) { return <button className={active ? 'nav active' : 'nav'} onClick={onClick}><span>{icon}</span>{children}</button>; }

function TaskCard({ task, project, onOpen, onDragStart }) {
  return <article className="task-card" draggable onDragStart={onDragStart} onClick={onOpen}>
    <div className="card-top"><span className={`priority-pill ${task.priority}`}>{PRIORITIES[task.priority]?.label}</span><span className="drag">⋮⋮</span></div>
    <h3>{task.title}</h3>
    {task.description && <p>{task.description}</p>}
    {(task.tags || []).length > 0 && <div className="tags">{task.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>}
    <div className="card-meta"><span>▣ {project}</span>{task.dueDate && <span className={task.dueDate < todayKey() && task.status !== 'done' ? 'overdue' : ''}>◷ {task.dueDate}</span>}</div>
  </article>;
}

function TaskModal({ task, projects, onClose, onSave, onDelete }) {
  const [draft, setDraft] = useState({ ...task, tags: task.tags || [] });
  const set = (key, value) => setDraft((d) => ({ ...d, [key]: value }));
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal" onMouseDown={(e) => e.stopPropagation()}>
    <div className="modal-head"><div><p className="eyebrow">ԱՌԱՋԱԴՐԱՆՔ</p><h2>{draft.id ? 'Խմբագրել առաջադրանքը' : 'Նոր առաջադրանք'}</h2></div><button className="icon-button" onClick={onClose}>×</button></div>
    <label className="field"><span>Վերնագիր</span><input autoFocus value={draft.title} onChange={(e) => set('title', e.target.value)} placeholder="Ի՞նչ պետք է անել" /></label>
    <label className="field"><span>Նկարագրություն</span><textarea rows="4" value={draft.description} onChange={(e) => set('description', e.target.value)} placeholder="Մանրամասներ, հղումներ կամ նշումներ…" /></label>
    <div className="field-grid">
      <label className="field"><span>Նախագիծ</span><select value={draft.projectId} onChange={(e) => set('projectId', e.target.value)}><option value="">Առանց նախագծի</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <label className="field"><span>Կարգավիճակ</span><select value={draft.status} onChange={(e) => set('status', e.target.value)}>{STATUSES.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</select></label>
      <label className="field"><span>Առաջնահերթություն</span><select value={draft.priority} onChange={(e) => set('priority', e.target.value)}>{Object.entries(PRIORITIES).map(([id, p]) => <option key={id} value={id}>{p.label}</option>)}</select></label>
      <label className="field"><span>Վերջնաժամկետ</span><input type="date" value={draft.dueDate} onChange={(e) => set('dueDate', e.target.value)} /></label>
    </div>
    <label className="field"><span>Պիտակներ</span><input value={draft.tags.join(', ')} onChange={(e) => set('tags', e.target.value.split(',').map((x) => x.trim()))} placeholder="օրինակ՝ դիզայն, հաճախորդ" /></label>
    <div className="modal-actions">{draft.id ? <button className="danger" onClick={() => onDelete(draft.id)}>Ջնջել</button> : <span />}<div><button className="ghost" onClick={onClose}>Չեղարկել</button><button className="primary" onClick={() => onSave(draft)}>Պահպանել</button></div></div>
  </div></div>;
}

function EmptyState({ onAdd }) { return <div className="empty"><div>✓</div><h2>Այստեղ դեռ առաջադրանքներ չկան</h2><p>Ստեղծեք առաջին առաջադրանքը և սկսեք կազմակերպել աշխատանքը Julo-ում։</p><button className="primary" onClick={onAdd}>＋ Ստեղծել առաջադրանք</button></div>; }

export default App;
