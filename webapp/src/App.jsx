import { useEffect, useMemo, useState } from 'react';
import { TaskAssigneeFields, assigneeText, primaryAssigneeText } from './auth/TaskAssigneeFields.jsx';
import { backendApi } from './lib/api-client.js';
import {
  TIMER_STATES,
  WORKSPACE_ROLE_LABELS,
  canProjectAction,
  canReopenCompletedTask,
  canTaskAction,
  formatElapsedTime,
  getTimerElapsedMs,
  normalizeServerTask,
  taskAssigneeDraft,
} from './lib/server-board.js';
import {
  TASK_EXECUTION_TYPES,
  TASK_PRIORITY_LABELS,
} from './lib/task-types.js';

const STATUSES = [
  { id: 'todo', title: 'Առաջադրանք', icon: '○' },
  { id: 'doing', title: 'Ընթացքում', icon: '◐' },
  { id: 'done', title: 'Ավարտված', icon: '●' },
];
const PRIORITIES = {
  low: { label: TASK_PRIORITY_LABELS.low, icon: '↓' },
  normal: { label: TASK_PRIORITY_LABELS.normal, icon: '–' },
  high: { label: TASK_PRIORITY_LABELS.high, icon: '↑' },
};
const todayKey = () => new Date().toISOString().slice(0, 10);

function App({ workspace, user }) {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState('board');
  const [activeProject, setActiveProject] = useState('all');
  const [query, setQuery] = useState('');
  const [executionTypeFilter, setExecutionTypeFilter] = useState('all');
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [newTaskDraft, setNewTaskDraft] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [theme, setTheme] = useState(() => window.localStorage.getItem('julo_theme') || 'light');

  const loadBoard = async () => {
    if (!workspace?.id) return [];
    try {
      const [taskResult, projectResult] = await Promise.all([
        backendApi.tasks(workspace.id),
        backendApi.projects(workspace.id),
      ]);
      const nextTasks = (taskResult.tasks || []).map(normalizeServerTask);
      setTasks(nextTasks);
      setProjects(projectResult.projects || []);
      setError('');
      setReady(true);
      return nextTasks;
    } catch (requestError) {
      setError(requestError.message || 'Չհաջողվեց բեռնել աշխատանքային տախտակը։');
      setReady(true);
      return [];
    }
  };

  useEffect(() => {
    loadBoard();
  }, [workspace?.id]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('julo_theme', theme);
  }, [theme]);

  const projectRoleMap = useMemo(
    () => new Map(projects.map((project) => [project.id, project.project_role || project.projectRole || null])),
    [projects],
  );
  const projectNameMap = useMemo(
    () => new Map(projects.map((project) => [project.id, project.name])),
    [projects],
  );

  const projectRole = (projectId) => projectRoleMap.get(projectId) || null;
  const canTask = (action, projectId = '') => canTaskAction(workspace?.role, projectRole(projectId), action);
  const canProject = (action, projectId = '') => canProjectAction(workspace?.role, projectRole(projectId), action);
  const canReopenCompleted = canReopenCompletedTask(workspace?.role);
  const guestRequiresProject = workspace?.role === 'guest';

  useEffect(() => {
    if (activeProject !== 'all' && !projectNameMap.has(activeProject)) setActiveProject('all');
  }, [activeProject, projectNameMap]);

  const visibleTasks = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('hy-AM');
    return tasks.filter((task) => {
      if (activeProject !== 'all' && task.projectId !== activeProject) return false;
      if (executionTypeFilter !== 'all' && task.executionType !== executionTypeFilter) return false;
      if (view === 'today' && task.dueDate !== todayKey()) return false;
      if (view === 'done' && task.status !== 'done') return false;
      if (view === 'all' && task.status === 'done') return false;
      if (!q) return true;
      return [
        task.title,
        task.description,
        TASK_EXECUTION_TYPES[task.executionType] || '',
        task.creatorName,
        ...(task.tags || []),
        ...(task.assignees || []).map((person) => person.displayName || person.username || ''),
        ...(task.comments || []).map((comment) => comment.text),
      ].join(' ').toLocaleLowerCase('hy-AM').includes(q);
    });
  }, [tasks, activeProject, executionTypeFilter, view, query]);

  const projectName = (id) => projectNameMap.get(id) || 'Առանց նախագծի';
  const projectTaskCount = (id) => tasks.filter((task) => task.projectId === id && task.status !== 'done').length;

  const runMutation = async (action) => {
    setBusy(true);
    setError('');
    try {
      await action();
      await loadBoard();
      return true;
    } catch (requestError) {
      setError(requestError.message || 'Գործողությունը չհաջողվեց։');
      if (requestError.status === 409) await loadBoard();
      return false;
    } finally {
      setBusy(false);
    }
  };

  const changeTaskStatus = async (task, nextStatus) => {
    if (!task || !canTask('update', task.projectId)) return false;
    if (task.status === 'done' && nextStatus !== 'done' && !canReopenCompleted) {
      window.alert('Ավարտված առաջադրանքը կարող են վերաբացել միայն Սեփականատերը կամ Ադմինիստրատորը։');
      return false;
    }
    return runMutation(() => backendApi.updateTask(workspace.id, task.id, {
      expectedVersion: task.version,
      status: nextStatus,
    }));
  };

  const openNewTask = (status = 'todo') => {
    const projectId = activeProject === 'all' ? '' : activeProject;
    if (!canTask('create', projectId)) {
      window.alert(guestRequiresProject
        ? 'Guest-ը առաջադրանք կարող է ստեղծել միայն իրեն հասանելի նախագծում։'
        : 'Ձեր դերը թույլ չի տալիս այստեղ առաջադրանք ստեղծել։');
      return;
    }
    setEditingTaskId(null);
    setNewTaskDraft({
      id: null,
      title: '',
      description: '',
      status,
      projectId,
      priority: 'normal',
      executionType: 'execute',
      dueDate: todayKey(),
      tags: [],
      comments: [],
      timer: { state: TIMER_STATES.IDLE, elapsedMs: 0 },
      assignees: [],
      assigneeUserIds: [],
      primaryAssigneeUserId: '',
    });
    setShowTaskModal(true);
  };

  const openTask = (task) => {
    setNewTaskDraft(null);
    setEditingTaskId(task.id);
    setShowTaskModal(true);
  };

  const saveTask = async (draft) => {
    const clean = {
      ...draft,
      title: draft.title.trim(),
      tags: Array.isArray(draft.tags) ? draft.tags.map((tag) => tag.trim()).filter(Boolean) : [],
    };
    if (!clean.title || !TASK_EXECUTION_TYPES[clean.executionType] || !clean.dueDate) return false;
    if (!clean.assigneeUserIds?.length || !clean.primaryAssigneeUserId) return false;
    if (guestRequiresProject && !clean.projectId) return false;
    if (!canTask(clean.id ? 'update' : 'create', clean.projectId)) return false;

    const ok = await runMutation(async () => {
      if (!clean.id) {
        await backendApi.createTask(workspace.id, {
          title: clean.title,
          description: clean.description,
          projectId: clean.projectId,
          executionType: clean.executionType,
          dueDate: clean.dueDate,
          priority: clean.priority,
          status: clean.status,
          tags: clean.tags,
          assigneeUserIds: clean.assigneeUserIds,
          primaryAssigneeUserId: clean.primaryAssigneeUserId,
        });
        return;
      }

      await backendApi.updateTask(workspace.id, clean.id, {
        expectedVersion: clean.version,
        title: clean.title,
        description: clean.description,
        projectId: clean.projectId,
        executionType: clean.executionType,
        dueDate: clean.dueDate,
        priority: clean.priority,
        status: clean.status,
        tags: clean.tags,
        assigneeUserIds: clean.assigneeUserIds,
        primaryAssigneeUserId: clean.primaryAssigneeUserId,
      });
    });
    if (ok) setShowTaskModal(false);
    return ok;
  };

  const deleteTask = async (task) => {
    if (!task || !canTask('delete', task.projectId)) return;
    if (!window.confirm(`Ջնջե՞լ «${task.title}» առաջադրանքը։`)) return;
    const ok = await runMutation(() => backendApi.deleteTask(workspace.id, task.id, task.version));
    if (ok) setShowTaskModal(false);
  };

  const addTaskComment = async (taskId, text) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task || !canTask('comment', task.projectId) || !text.trim()) return false;
    return runMutation(() => backendApi.addTaskComment(workspace.id, taskId, text.trim()));
  };

  const timerCommand = async (task, command) => {
    if (!task || !canTask('timer', task.projectId) || task.status === 'done') return false;
    if (command === 'stop' && !window.confirm('Վստա՞հ եք, որ սեղմում եք Stop։ Հաստատելուց հետո timer-ը այլևս չեք կարող վերագործարկել։')) return false;
    return runMutation(() => backendApi.timerCommand(workspace.id, task.id, command));
  };

  const addProject = async () => {
    if (!canProject('create')) return '';
    const name = window.prompt('Նոր նախագծի անունը');
    if (!name?.trim()) return '';
    let createdId = '';
    const ok = await runMutation(async () => {
      const result = await backendApi.createProject(workspace.id, { name: name.trim() });
      createdId = result.project?.id || '';
    });
    if (ok && createdId) {
      setActiveProject(createdId);
      setView('board');
    }
    return ok ? createdId : '';
  };

  const renameProject = async (project) => {
    if (!canProject('update', project.id)) return;
    const name = window.prompt('Նախագծի նոր անունը', project.name);
    if (!name?.trim() || name.trim() === project.name) return;
    await runMutation(() => backendApi.renameProject(workspace.id, project.id, { name: name.trim() }));
  };

  const removeProject = async (project) => {
    if (!canProject('delete', project.id)) return;
    const count = tasks.filter((task) => task.projectId === project.id).length;
    const message = count
      ? `Արխիվացնե՞լ «${project.name}» նախագիծը։ ${count} առաջադրանք կտեղափոխվի «Առանց նախագծի»։`
      : `Արխիվացնե՞լ «${project.name}» նախագիծը։`;
    if (!window.confirm(message)) return;
    const ok = await runMutation(() => backendApi.deleteProject(workspace.id, project.id));
    if (ok && activeProject === project.id) {
      setActiveProject('all');
      setView('board');
    }
  };

  const modalTask = editingTaskId
    ? tasks.find((task) => task.id === editingTaskId) || null
    : newTaskDraft;
  const modalReadOnly = Boolean(modalTask?.id && !canTask('update', modalTask.projectId));
  const modalProjects = modalReadOnly
    ? projects
    : projects.filter((project) => canTask(modalTask?.id ? 'update' : 'create', project.id));
  const headerTitle = view === 'today'
    ? 'Այսօրվա աշխատանքը'
    : view === 'done'
      ? 'Ավարտված առաջադրանքներ'
      : view === 'all'
        ? 'Բոլոր առաջադրանքները'
        : activeProject === 'all' ? 'Աշխատանքային տախտակ' : projectName(activeProject);

  if (!ready) return <div className="app-shell"><main className="main"><div className="empty-state"><h2>Տախտակը բեռնվում է…</h2></div></main></div>;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">J</div><div><strong>Julo</strong><span>աշխատանքային տարածք</span></div></div>
        <button className="primary full" onClick={() => openNewTask()} disabled={busy || !canTask('create', activeProject === 'all' ? '' : activeProject)}>＋ Նոր առաջադրանք</button>
        <nav className="nav-list">
          <Nav active={view === 'board'} onClick={() => setView('board')} icon="▦">Տախտակ</Nav>
          <Nav active={view === 'today'} onClick={() => setView('today')} icon="◷">Այսօր</Nav>
          <Nav active={view === 'all'} onClick={() => setView('all')} icon="☷">Բոլոր առաջադրանքները</Nav>
          <Nav active={view === 'done'} onClick={() => setView('done')} icon="✓">Ավարտված</Nav>
        </nav>
        <div className="section-title"><span>Նախագծեր</span>{canProject('create') && <button disabled={busy} onClick={addProject} title="Ավելացնել նախագիծ">＋</button>}</div>
        <div className="project-list">
          <button className={activeProject === 'all' ? 'project active' : 'project'} onClick={() => setActiveProject('all')}><span className="dot neutral" />Բոլորը</button>
          {projects.map((project) => (
            <div className="project-row" key={project.id}>
              <button className={activeProject === project.id ? 'project active' : 'project'} onClick={() => { setActiveProject(project.id); setView('board'); }}>
                <span className="dot" />
                <span className="project-name">{project.name}</span>
                <span className="project-count">{projectTaskCount(project.id)}</span>
              </button>
              {(canProject('update', project.id) || canProject('delete', project.id)) && (
                <div className="project-actions">
                  {canProject('update', project.id) && <button disabled={busy} onClick={() => renameProject(project)} title="Վերանվանել նախագիծ">✎</button>}
                  {canProject('delete', project.id) && <button disabled={busy} onClick={() => removeProject(project)} title="Արխիվացնել նախագիծ">×</button>}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="sidebar-footer">
          <div className="current-role"><strong>{user?.displayName || user?.usernameNormalized || 'Օգտատեր'}</strong><span>{WORKSPACE_ROLE_LABELS[workspace?.role] || workspace?.role || ''}</span></div>
          <span>Server / PostgreSQL · տվյալները համաժամեցված են</span>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">JULO / {activeProject === 'all' ? 'ԱՇԽԱՏԱՆՔԱՅԻՆ ՏԱՐԱԾՔ' : 'ՆԱԽԱԳԻԾ'}</p>
            <h1>{headerTitle}</h1>
          </div>
          <div className="top-actions">
            <label className="search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Որոնել առաջադրանքներ…" /></label>
            <select className="type-filter" value={executionTypeFilter} onChange={(event) => setExecutionTypeFilter(event.target.value)} title="Ֆիլտրել ըստ կատարման տեսակի">
              <option value="all">Բոլոր կատարման տեսակները</option>
              {Object.entries(TASK_EXECUTION_TYPES).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
            <button className="icon-button" onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')} title="Փոխել թեման">◐</button>
            <button className="primary" onClick={() => openNewTask()} disabled={busy || !canTask('create', activeProject === 'all' ? '' : activeProject)}>＋ Ավելացնել</button>
          </div>
        </header>

        {error && <div className="auth-error board-error">{error}</div>}

        {view === 'board' ? (
          <div className="board">
            {STATUSES.map((status) => (
              <section
                className="column"
                key={status.id}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  const task = tasks.find((item) => item.id === event.dataTransfer.getData('text/task-id'));
                  if (task) changeTaskStatus(task, status.id);
                }}
              >
                <div className="column-head"><div><span className={`status-icon ${status.id}`}>{status.icon}</span><strong>{status.title}</strong><span className="count">{visibleTasks.filter((task) => task.status === status.id).length}</span></div>{canTask('create', activeProject === 'all' ? '' : activeProject) && <button disabled={busy} onClick={() => openNewTask(status.id)}>＋</button>}</div>
                <div className="cards">
                  {visibleTasks.filter((task) => task.status === status.id).map((task) => <TaskCard key={task.id} task={task} project={projectName(task.projectId)} onOpen={() => openTask(task)} onDragStart={(event) => event.dataTransfer.setData('text/task-id', task.id)} draggable={!busy && canTask('update', task.projectId) && (task.status !== 'done' || canReopenCompleted)} />)}
                  {canTask('create', activeProject === 'all' ? '' : activeProject) && <button className="add-card" disabled={busy} onClick={() => openNewTask(status.id)}>＋ Ավելացնել առաջադրանք</button>}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="list-view">
            {visibleTasks.length === 0 ? <EmptyState onAdd={() => openNewTask()} canAdd={canTask('create', activeProject === 'all' ? '' : activeProject)} /> : visibleTasks.map((task) => (
              <button className="list-task" key={task.id} onClick={() => openTask(task)}>
                <span className={`check ${task.status === 'done' ? 'checked' : ''}`} onClick={(event) => { event.stopPropagation(); changeTaskStatus(task, task.status === 'done' ? 'doing' : 'done'); }}>{task.status === 'done' ? '✓' : ''}</span>
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

      {showTaskModal && modalTask && <TaskModal
        key={modalTask.id || 'new'}
        task={modalTask}
        workspace={workspace}
        projects={modalProjects}
        readOnly={modalReadOnly}
        canDelete={modalTask.id ? canTask('delete', modalTask.projectId) : false}
        canComment={modalTask.id ? canTask('comment', modalTask.projectId) : false}
        canUseTimer={modalTask.id ? canTask('timer', modalTask.projectId) : false}
        canReopenCompleted={canReopenCompleted}
        canCreateProject={canProject('create')}
        guestRequiresProject={guestRequiresProject}
        busy={busy}
        onAddComment={addTaskComment}
        onTimerStart={(task) => timerCommand(task, 'start')}
        onTimerPause={(task) => timerCommand(task, 'pause')}
        onTimerStop={(task) => timerCommand(task, 'stop')}
        onCreateProject={addProject}
        onClose={() => setShowTaskModal(false)}
        onSave={saveTask}
        onDelete={deleteTask}
      />}
    </div>
  );
}

function Nav({ active, icon, children, onClick }) {
  return <button className={active ? 'nav active' : 'nav'} onClick={onClick}><span>{icon}</span>{children}</button>;
}

function TaskCard({ task, project, onOpen, onDragStart, draggable }) {
  const elapsed = getTimerElapsedMs(task.timer, Date.now());
  const showTimer = task.timer?.state !== TIMER_STATES.IDLE || elapsed > 0;
  return <article className="task-card" draggable={draggable} onDragStart={draggable ? onDragStart : undefined} onClick={onOpen}>
    <div className="card-top"><span className={`priority-pill ${task.priority}`}>{PRIORITIES[task.priority]?.label}</span><span className="drag">{draggable ? '⋮⋮' : '◦'}</span></div>
    <h3>{task.title}</h3>
    <div className={`execution-type ${task.executionType ? '' : 'missing'}`}>{TASK_EXECUTION_TYPES[task.executionType] || 'Կատարման տեսակ չի նշված'}</div>
    {showTimer && <div className={`task-timer-chip ${task.timer?.state || TIMER_STATES.IDLE}`}>⏱ {formatElapsedTime(elapsed)} · {task.timer?.state === TIMER_STATES.RUNNING ? 'Աշխատում է' : task.timer?.state === TIMER_STATES.PAUSED ? 'Pause' : 'Stop'}</div>}
    {task.description && <p>{task.description}</p>}
    {(task.tags || []).length > 0 && <div className="tags">{task.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>}
    <div className="card-meta"><span>▣ {project}{task.comments?.length ? ` · 💬 ${task.comments.length}` : ''}</span><span className={!task.dueDate || (task.dueDate < todayKey() && task.status !== 'done') ? 'overdue' : ''}>◷ {task.dueDate || 'Ժամկետ չի նշված'}</span></div>
    <div className="card-meta"><span>★ {primaryAssigneeText(task)}</span><span>{task.creatorName ? `Ստեղծող՝ ${task.creatorName}` : ''}</span></div>
  </article>;
}

function TaskModal({
  task, workspace, projects, readOnly, canDelete, canComment, canUseTimer, canReopenCompleted, canCreateProject,
  guestRequiresProject, busy, onAddComment, onTimerStart, onTimerPause, onTimerStop, onCreateProject, onClose, onSave, onDelete,
}) {
  const assignment = taskAssigneeDraft(task);
  const [draft, setDraft] = useState({
    ...task,
    executionType: task.executionType || 'execute',
    dueDate: task.dueDate || todayKey(),
    tags: task.tags || [],
    ...assignment,
  });
  const [candidates, setCandidates] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [timerNow, setTimerNow] = useState(Date.now());
  const [candidateError, setCandidateError] = useState('');
  const set = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  const canSave = Boolean(
    draft.title.trim()
    && TASK_EXECUTION_TYPES[draft.executionType]
    && draft.dueDate
    && draft.assigneeUserIds?.length
    && draft.primaryAssigneeUserId
    && (!guestRequiresProject || draft.projectId)
  );
  const comments = task.comments || [];
  const timer = task.timer || { state: TIMER_STATES.IDLE, elapsedMs: 0 };
  const timerElapsed = getTimerElapsedMs(timer, timerNow);
  const timerStateLabel = timer.state === TIMER_STATES.RUNNING ? 'Աշխատում է' : timer.state === TIMER_STATES.PAUSED ? 'Pause' : timer.state === TIMER_STATES.STOPPED ? 'Stop' : 'Չմեկնարկած';
  const statusOptions = task.status === 'done'
    ? (canReopenCompleted ? STATUSES.filter((status) => ['doing', 'done'].includes(status.id)) : STATUSES.filter((status) => status.id === 'done'))
    : STATUSES;

  useEffect(() => {
    setTimerNow(Date.now());
    if (timer.state !== TIMER_STATES.RUNNING) return undefined;
    const interval = window.setInterval(() => setTimerNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [timer.state, timer.startedAt]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (guestRequiresProject && !draft.projectId) {
        setCandidates([]);
        return;
      }
      try {
        const result = await backendApi.taskAssignees(workspace.id, draft.projectId || '');
        if (!cancelled) {
          setCandidates(result.assignees || []);
          setCandidateError('');
        }
      } catch (requestError) {
        if (!cancelled) {
          setCandidates([]);
          setCandidateError(requestError.message || 'Չհաջողվեց բեռնել կատարողներին։');
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, [workspace.id, draft.projectId, guestRequiresProject]);

  const submitComment = async () => {
    const text = commentText.trim();
    if (!text || !task.id || !canComment) return;
    if (await onAddComment(task.id, text)) setCommentText('');
  };

  const changeProject = async (projectId) => {
    let nextProjectId = projectId;
    if (projectId === '__create_project__') {
      nextProjectId = await onCreateProject();
      if (!nextProjectId) return;
    }
    setDraft((current) => ({
      ...current,
      projectId: nextProjectId,
      assigneeUserIds: [],
      primaryAssigneeUserId: '',
    }));
  };

  return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal" onMouseDown={(event) => event.stopPropagation()}>
    <div className="modal-head"><div><p className="eyebrow">ԱՌԱՋԱԴՐԱՆՔ · SERVER</p><h2>{draft.id ? readOnly ? 'Դիտել առաջադրանքը' : 'Խմբագրել առաջադրանքը' : 'Նոր առաջադրանք'}</h2></div><button className="icon-button" onClick={onClose}>×</button></div>
    {candidateError && <div className="auth-error">{candidateError}</div>}
    <label className="field"><span>Վերնագիր *</span><input autoFocus={!readOnly} disabled={readOnly || busy} required value={draft.title} onChange={(event) => set('title', event.target.value)} placeholder="Ի՞նչ պետք է անել" /></label>
    <label className="field"><span>Նկարագրություն</span><textarea rows="4" disabled={readOnly || busy} value={draft.description} onChange={(event) => set('description', event.target.value)} placeholder="Մանրամասներ, հղումներ կամ նշումներ…" /></label>
    <div className="field-grid">
      <label className="field"><span>Նախագիծ{guestRequiresProject ? ' *' : ''}</span><select disabled={readOnly || busy} value={draft.projectId} onChange={(event) => changeProject(event.target.value)}>{!guestRequiresProject && <option value="">Առանց նախագծի</option>}{guestRequiresProject && <option value="">Ընտրեք նախագիծ</option>}{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}{canCreateProject && <option value="__create_project__">＋ Ստեղծել նոր նախագիծ</option>}</select></label>
      <label className="field"><span>Կարգավիճակ</span><select disabled={readOnly || busy} value={draft.status} onChange={(event) => set('status', event.target.value)}>{statusOptions.map((status) => <option key={status.id} value={status.id}>{status.title}</option>)}</select></label>
      <label className="field"><span>Կատարման տեսակ *</span><select disabled={readOnly || busy} required value={draft.executionType} onChange={(event) => set('executionType', event.target.value)}>{Object.entries(TASK_EXECUTION_TYPES).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      <label className="field"><span>Առաջնահերթություն</span><select disabled={readOnly || busy} value={draft.priority} onChange={(event) => set('priority', event.target.value)}>{Object.entries(PRIORITIES).map(([id, priority]) => <option key={id} value={id}>{priority.label}</option>)}</select></label>
      <label className="field"><span>Կատարման ժամկետ *</span><input disabled={readOnly || busy} required type="date" value={draft.dueDate} onChange={(event) => set('dueDate', event.target.value)} /></label>
    </div>
    {!readOnly && <>
      <TaskAssigneeFields candidates={candidates} value={draft} onChange={setDraft} disabled={busy} />
      <p className="required-note">* Ժամկետը, կատարողը և առաջնային կատարողը պարտադիր են։</p>
    </>}
    {readOnly && <div className="task-people task-people-three"><div><span>Ստեղծող</span><b>{task.creatorName || '—'}</b></div><div><span>Առաջնային կատարող</span><b>★ {primaryAssigneeText(task)}</b></div><div><span>Կատարողներ</span><b>{assigneeText(task)}</b></div></div>}
    <label className="field"><span>Պիտակներ</span><input disabled={readOnly || busy} value={draft.tags.join(', ')} onChange={(event) => set('tags', event.target.value.split(',').map((value) => value.trim()))} placeholder="օրինակ՝ դիզայն, հաճախորդ" /></label>
    <section className={`timer-panel ${timer.state}`}>
      <div className="timer-panel-head"><div><strong>Կատարման ժամանակ</strong><span className="timer-state">{timerStateLabel}</span></div><div className="timer-display">⏱ {formatElapsedTime(timerElapsed)}</div></div>
      {task.id ? <div className="timer-controls">
        {timer.state === TIMER_STATES.IDLE && canUseTimer && task.status !== 'done' && <button className="primary" disabled={busy} onClick={() => onTimerStart(task)}>▶ Մեկնարկել</button>}
        {timer.state === TIMER_STATES.PAUSED && canUseTimer && task.status !== 'done' && <button className="primary" disabled={busy} onClick={() => onTimerStart(task)}>▶ Շարունակել</button>}
        {timer.state === TIMER_STATES.RUNNING && canUseTimer && <button className="ghost" disabled={busy} onClick={() => onTimerPause(task)}>Ⅱ Pause</button>}
        {[TIMER_STATES.RUNNING, TIMER_STATES.PAUSED].includes(timer.state) && canUseTimer && <button className="danger" disabled={busy} onClick={() => onTimerStop(task)}>■ Stop</button>}
        {timer.state === TIMER_STATES.STOPPED && <span className="timer-locked">Timer-ը վերջնական կանգնեցված է։</span>}
      </div> : <p className="timer-hint">Timer-ը հասանելի կլինի առաջադրանքը պահպանելուց հետո։</p>}
      {task.id && !canUseTimer && <p className="timer-hint">Ձեր դերը թույլ չի տալիս կառավարել timer-ը։</p>}
      {timer.state !== TIMER_STATES.STOPPED && <p className="timer-hint">Մեկ այլ առաջադրանքի timer-ը միացնելիս գործող timer-ը server-ում ավտոմատ կանցնի Pause վիճակի։</p>}
    </section>
    <section className="comments-section">
      <div className="comments-head"><strong>Մեկնաբանություններ</strong><span>{comments.length}</span></div>
      {comments.length > 0 ? <div className="comment-list">{comments.map((comment) => <article className="comment" key={comment.id}><div className="comment-meta"><strong>{comment.authorName || 'Օգտատեր'}</strong><time>{new Date(comment.createdAt).toLocaleString('hy-AM')}</time></div><p>{comment.text}</p></article>)}</div> : <p className="comments-empty">Այս առաջադրանքի համար դեռ մեկնաբանություններ չկան։</p>}
      {task.id && canComment && <div className="comment-compose"><textarea rows="3" disabled={busy} value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="Գրել մեկնաբանություն…" /><button className="primary" disabled={busy || !commentText.trim()} onClick={submitComment}>Ուղարկել</button></div>}
      {!task.id && <p className="comments-hint">Մեկնաբանություն ավելացնելու համար նախ պահպանեք առաջադրանքը։</p>}
      {task.id && !canComment && <p className="comments-hint">Ձեր դերը թույլ չի տալիս մեկնաբանություն ավելացնել։</p>}
    </section>
    <div className="modal-actions">{draft.id && canDelete ? <button className="danger" disabled={busy} onClick={() => onDelete(task)}>Ջնջել</button> : <span />}<div><button className="ghost" disabled={busy} onClick={onClose}>{readOnly ? 'Փակել' : 'Չեղարկել'}</button>{!readOnly && <button className="primary" disabled={busy || !canSave} onClick={() => onSave(draft)}>Պահպանել</button>}</div></div>
  </div></div>;
}

function EmptyState({ onAdd, canAdd }) {
  return <div className="empty-state"><div className="empty-icon">◎</div><h2>Առաջադրանքներ չկան</h2><p>Այս դիտման մեջ դեռ առաջադրանք չկա։</p>{canAdd && <button className="primary" onClick={onAdd}>＋ Ստեղծել առաջադրանք</button>}</div>;
}

export default App;
