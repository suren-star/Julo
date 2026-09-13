import { useEffect, useMemo, useState } from 'react';
import { backendApi } from '../lib/api-client.js';
import {
  TASK_EXECUTION_OPTIONS,
  TASK_EXECUTION_TYPES,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_LABELS,
  TASK_STATUS_ORDER,
  createTaskDraft,
} from '../lib/task-types.js';
import {
  TaskAssigneeFields,
  assigneeText,
  primaryAssigneeText,
} from './TaskAssigneeFields.jsx';

const CREATE_PROJECT_VALUE = '__create_project__';

function dueSortValue(value) {
  const time = value ? Date.parse(`${value}T00:00:00Z`) : Number.POSITIVE_INFINITY;
  return Number.isFinite(time) ? time : Number.POSITIVE_INFINITY;
}

function canUpdateTask(workspaceRole, projectRole) {
  if (['owner', 'admin', 'member'].includes(workspaceRole)) return true;
  return workspaceRole === 'guest' && ['manager', 'editor'].includes(projectRole);
}

export default function BackendTasksDrawer({ workspace, user, open, onClose }) {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [form, setForm] = useState(createTaskDraft);
  const [editing, setEditing] = useState(null);
  const [editCandidates, setEditCandidates] = useState([]);
  const [editAssignment, setEditAssignment] = useState({ assigneeUserIds: [], primaryAssigneeUserId: '' });
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const canCreate = ['owner', 'admin', 'member', 'guest'].includes(workspace?.role);
  const canCreateProject = ['owner', 'admin', 'member'].includes(workspace?.role);
  const canReopen = ['owner', 'admin'].includes(workspace?.role);
  const guestRequiresProject = workspace?.role === 'guest';

  const projectMap = useMemo(
    () => new Map(projects.map((project) => [project.id, project.name])),
    [projects],
  );
  const projectRoleMap = useMemo(
    () => new Map(projects.map((project) => [project.id, project.project_role || project.projectRole || null])),
    [projects],
  );
  const stats = useMemo(() => ({
    total: tasks.length,
    todo: tasks.filter((task) => task.status === 'todo').length,
    doing: tasks.filter((task) => task.status === 'doing').length,
    done: tasks.filter((task) => task.status === 'done').length,
  }), [tasks]);

  const assigneeOptions = useMemo(() => {
    const map = new Map();
    for (const task of tasks) {
      for (const person of task.assignees || []) {
        map.set(person.id, person.displayName || person.username || person.id);
      }
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], 'hy'));
  }, [tasks]);

  const visibleTasks = useMemo(() => tasks
    .filter((task) => statusFilter === 'all' || task.status === statusFilter)
    .filter((task) => projectFilter === 'all' || (projectFilter === 'none' ? !task.project_id : task.project_id === projectFilter))
    .filter((task) => assigneeFilter === 'all' || (task.assignees || []).some((person) => person.id === assigneeFilter))
    .sort((a, b) => (
      (TASK_STATUS_ORDER[a.status] ?? 9) - (TASK_STATUS_ORDER[b.status] ?? 9)
      || dueSortValue(a.due_date) - dueSortValue(b.due_date)
      || String(b.updated_at || '').localeCompare(String(a.updated_at || ''))
    )), [tasks, statusFilter, projectFilter, assigneeFilter]);

  const load = async () => {
    if (!workspace?.id) return;
    try {
      const [taskResult, projectResult] = await Promise.all([
        backendApi.tasks(workspace.id),
        backendApi.projects(workspace.id),
      ]);
      setTasks(taskResult.tasks || []);
      setProjects(projectResult.projects || []);
      setError('');
    } catch (requestError) {
      setError(requestError.message || 'Չհաջողվեց բեռնել առաջադրանքները։');
    }
  };

  const loadCandidates = async (projectId, setter = setCandidates) => {
    if (!workspace?.id) return;
    if (workspace.role === 'guest' && !projectId) {
      setter([]);
      return;
    }
    try {
      const result = await backendApi.taskAssignees(workspace.id, projectId);
      setter(result.assignees || []);
    } catch (requestError) {
      setter([]);
      setError(requestError.message);
    }
  };

  useEffect(() => {
    if (open) {
      load();
      loadCandidates(form.projectId);
    }
  }, [open, workspace?.id]);

  useEffect(() => {
    if (open) loadCandidates(form.projectId);
  }, [form.projectId]);

  const chooseProject = async (value) => {
    if (value !== CREATE_PROJECT_VALUE) {
      setForm((current) => ({
        ...current,
        projectId: value,
        assigneeUserIds: [],
        primaryAssigneeUserId: '',
      }));
      return;
    }

    if (!canCreateProject) return;
    const name = window.prompt('Նոր նախագծի անունը');
    if (!name?.trim()) return;

    setBusy(true);
    setError('');
    try {
      const result = await backendApi.createProject(workspace.id, { name: name.trim() });
      const project = result.project;
      setProjects((current) => [...current.filter((item) => item.id !== project.id), project]);
      setForm((current) => ({
        ...current,
        projectId: project.id,
        assigneeUserIds: [],
        primaryAssigneeUserId: '',
      }));
      await loadCandidates(project.id);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const create = async (event) => {
    event.preventDefault();
    if (guestRequiresProject && !form.projectId) {
      setError('Guest-ը առաջադրանք կարող է ստեղծել միայն իրեն վերագրված նախագծում։');
      return;
    }
    if (!form.assigneeUserIds.length) {
      setError('Ընտրեք առնվազն մեկ կատարող։');
      return;
    }
    if (!form.primaryAssigneeUserId) {
      setError('Ընտրեք առաջնային կատարողին։');
      return;
    }

    setBusy(true);
    setError('');
    try {
      await backendApi.createTask(workspace.id, form);
      setForm(createTaskDraft());
      await load();
      await loadCandidates('');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const beginEdit = async (task) => {
    const ids = (task.assignees || []).map((assignee) => assignee.id);
    const primary = (task.assignees || []).find((assignee) => assignee.isPrimary)?.id || task.assignee_user_id || '';
    setEditing(task);
    setEditAssignment({ assigneeUserIds: ids, primaryAssigneeUserId: primary });
    await loadCandidates(task.project_id || '', setEditCandidates);
  };

  const saveAssignment = async () => {
    if (!editing) return;
    if (!editAssignment.assigneeUserIds.length) {
      setError('Ընտրեք առնվազն մեկ կատարող։');
      return;
    }
    if (!editAssignment.primaryAssigneeUserId) {
      setError('Ընտրեք առաջնային կատարողին։');
      return;
    }

    setBusy(true);
    setError('');
    try {
      await backendApi.updateTask(workspace.id, editing.id, {
        expectedVersion: Number(editing.version),
        ...editAssignment,
      });
      setEditing(null);
      await load();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = async (task, status) => {
    setBusy(true);
    setError('');
    try {
      await backendApi.updateTask(workspace.id, task.id, {
        expectedVersion: Number(task.version),
        status,
      });
      await load();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;
  const today = new Date().toISOString().slice(0, 10);

  return <div className="backend-drawer backend-tasks-drawer">
    <div className="drawer-header">
      <div><strong>Առաջադրանքներ</strong><span>Server / PostgreSQL · {stats.total} ընդհանուր</span></div>
      <button type="button" onClick={onClose}>×</button>
    </div>
    {error && <div className="auth-error">{error}</div>}

    <div className="task-summary" aria-label="Առաջադրանքների ամփոփում">
      <div><b>{stats.total}</b><span>Բոլորը</span></div>
      <div><b>{stats.todo}</b><span>Առաջադրանք</span></div>
      <div><b>{stats.doing}</b><span>Ընթացքում</span></div>
      <div><b>{stats.done}</b><span>Ավարտված</span></div>
    </div>

    {canCreate && <form className="server-task-form" onSubmit={create}>
      <div className="task-form-title">
        <div><strong>Նոր առաջադրանք</strong><span>Ստեղծող՝ {user?.displayName || user?.usernameNormalized || 'Դուք'}</span></div>
      </div>
      <label className="task-field">
        <span>Առաջադրանքի վերնագիր *</span>
        <input placeholder="Առաջադրանքի վերնագիր" required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
      </label>
      <label className="task-field">
        <span>Նկարագրություն</span>
        <textarea placeholder="Նկարագրություն" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
      </label>
      <div className="note-form-row">
        <label className="task-field">
          <span>Նախագիծ{guestRequiresProject ? ' *' : ''}</span>
          <select value={form.projectId} disabled={busy} onChange={(event) => chooseProject(event.target.value)}>
            {!guestRequiresProject && <option value="">Առանց նախագծի</option>}
            {guestRequiresProject && <option value="">Ընտրեք նախագիծ</option>}
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            {canCreateProject && <option value={CREATE_PROJECT_VALUE}>＋ Ստեղծել նոր նախագիծ…</option>}
          </select>
        </label>
        <label className="task-field">
          <span>Կատարման ժամկետ *</span>
          <input type="date" required value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} />
        </label>
      </div>
      <div className="note-form-row">
        <label className="task-field">
          <span>Կատարման տեսակ</span>
          <select value={form.executionType} onChange={(event) => setForm({ ...form, executionType: event.target.value })}>
            {TASK_EXECUTION_OPTIONS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
        </label>
        <label className="task-field">
          <span>Առաջնահերթություն</span>
          <select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
            {TASK_PRIORITY_OPTIONS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
        </label>
      </div>
      <TaskAssigneeFields candidates={candidates} value={form} onChange={setForm} disabled={busy} />
      <p className="task-required-note">* Կատարողը և առաջնային կատարողը պարտադիր են։</p>
      <button
        className="primary"
        disabled={busy || (guestRequiresProject && !form.projectId) || !form.assigneeUserIds.length || !form.primaryAssigneeUserId}
      >
        {busy ? 'Պահպանում…' : '＋ Ստեղծել առաջադրանք'}
      </button>
    </form>}
    {!canCreate && <div className="drawer-empty">Ձեր դերը թույլ չի տալիս առաջադրանք ստեղծել։</div>}

    <div className="task-filter-bar">
      <label>
        <span>Կարգավիճակ</span>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">Բոլորը</option>
          <option value="todo">Առաջադրանք</option>
          <option value="doing">Ընթացքում</option>
          <option value="done">Ավարտված</option>
        </select>
      </label>
      <label>
        <span>Նախագիծ</span>
        <select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)}>
          <option value="all">Բոլորը</option>
          {!guestRequiresProject && <option value="none">Առանց նախագծի</option>}
          {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
        </select>
      </label>
      <label>
        <span>Կատարող</span>
        <select value={assigneeFilter} onChange={(event) => setAssigneeFilter(event.target.value)}>
          <option value="all">Բոլորը</option>
          {assigneeOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
      </label>
    </div>

    <div className="task-list-heading"><strong>Արդյունքներ</strong><span>{visibleTasks.length} / {stats.total}</span></div>
    <div className="server-task-list">
      {visibleTasks.length === 0 && <div className="drawer-empty">Այս ֆիլտրերով առաջադրանքներ չկան։</div>}
      {visibleTasks.map((task) => {
        const overdue = task.status !== 'done' && task.due_date && task.due_date < today;
        const taskEditable = canUpdateTask(workspace?.role, projectRoleMap.get(task.project_id));
        return <article className={`server-task-item status-${task.status}`} key={task.id}>
          <div className="server-task-head">
            <div>
              <strong>{task.title}</strong>
              <small>{projectMap.get(task.project_id) || 'Առանց նախագծի'} · {TASK_EXECUTION_TYPES[task.execution_type] || task.execution_type || 'Տեսակ նշված չէ'}</small>
            </div>
            <span className={`task-status status-${task.status}`}>{TASK_STATUS_LABELS[task.status] || task.status}</span>
          </div>
          {task.description && <p>{task.description}</p>}
          <div className="task-meta-row">
            <span className={overdue ? 'overdue' : ''}>Ժամկետ՝ {task.due_date || '—'}{overdue ? ' · ուշացած' : ''}</span>
            <span>Առաջնահերթություն՝ {TASK_PRIORITY_LABELS[task.priority] || task.priority}</span>
          </div>
          <div className="task-people task-people-three">
            <div><span>Ստեղծող</span><b>{task.creator_name || task.creator_username || task.created_by}</b></div>
            <div><span>Առաջնային կատարող</span><b>★ {primaryAssigneeText(task)}</b></div>
            <div><span>Բոլոր կատարողները</span><b>{assigneeText(task)}</b></div>
          </div>
          {taskEditable && <div className="task-actions">
            {task.status === 'todo' && <button type="button" disabled={busy} onClick={() => changeStatus(task, 'doing')}>▶ Սկսել</button>}
            {task.status === 'doing' && <button type="button" className="primary" disabled={busy} onClick={() => changeStatus(task, 'done')}>✓ Ավարտել</button>}
            {task.status === 'done' && canReopen && <button type="button" disabled={busy} onClick={() => changeStatus(task, 'doing')}>↻ Վերաբացել</button>}
            <button type="button" disabled={busy} onClick={() => beginEdit(task)}>Փոխել կատարողներին</button>
          </div>}
          {editing?.id === task.id && <div className="assignment-editor">
            <TaskAssigneeFields candidates={editCandidates} value={editAssignment} onChange={setEditAssignment} disabled={busy} />
            <div>
              <button type="button" onClick={() => setEditing(null)}>Չեղարկել</button>
              <button
                type="button"
                className="primary"
                onClick={saveAssignment}
                disabled={busy || !editAssignment.assigneeUserIds.length || !editAssignment.primaryAssigneeUserId}
              >Պահպանել կատարողներին</button>
            </div>
          </div>}
        </article>;
      })}
    </div>
  </div>;
}
