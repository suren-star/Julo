import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const appPath = 'webapp/src/App.jsx';
const storagePath = 'webapp/src/lib/storage.js';
const permissionsPath = 'webapp/src/lib/permissions.js';
const storageTestPath = 'webapp/tests/storage.test.mjs';
const permissionsTestPath = 'webapp/tests/permissions.test.mjs';
const managementCssPath = 'webapp/src/management.css';
const mobileCssPath = 'webapp/src/mobile.css';

const read = (path) => fs.readFileSync(path, 'utf8');
const write = (path, content) => fs.writeFileSync(path, content, 'utf8');

function mustReplace(content, from, to, label) {
  if (!content.includes(from)) throw new Error(`Missing replacement marker: ${label}`);
  return content.replace(from, to);
}

function replaceBetween(content, start, end, replacement, label) {
  const startIndex = content.indexOf(start);
  const endIndex = content.indexOf(end, startIndex + start.length);
  if (startIndex < 0 || endIndex < 0) throw new Error(`Missing block marker: ${label}`);
  return content.slice(0, startIndex) + replacement + content.slice(endIndex);
}

const timerModule = `export const TIMER_STATES = Object.freeze({
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  STOPPED: 'stopped',
});

const VALID_TIMER_STATES = new Set(Object.values(TIMER_STATES));
const VALID_STOP_REASONS = new Set(['', 'manual', 'completed']);

const toMs = (value) => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
};

const toTimestampMs = (value) => {
  if (!value) return NaN;
  const parsed = typeof value === 'number' ? value : Date.parse(value);
  return Number.isFinite(parsed) ? parsed : NaN;
};

const toIso = (value) => new Date(value).toISOString();

export const emptyTaskTimer = () => ({
  state: TIMER_STATES.IDLE,
  elapsedMs: 0,
  startedAt: '',
  stoppedAt: '',
  stopReason: '',
});

export const normalizeTaskTimer = (source) => {
  if (!source || typeof source !== 'object' || Array.isArray(source)) return emptyTaskTimer();

  let state = VALID_TIMER_STATES.has(source.state) ? source.state : TIMER_STATES.IDLE;
  const elapsedMs = toMs(source.elapsedMs);
  let startedAt = typeof source.startedAt === 'string' ? source.startedAt : '';
  const stoppedAt = typeof source.stoppedAt === 'string' ? source.stoppedAt : '';
  const stopReason = VALID_STOP_REASONS.has(source.stopReason) ? source.stopReason : '';

  if (state === TIMER_STATES.RUNNING && !Number.isFinite(toTimestampMs(startedAt))) {
    state = TIMER_STATES.PAUSED;
    startedAt = '';
  }

  if (state !== TIMER_STATES.RUNNING) startedAt = '';

  return {
    state,
    elapsedMs,
    startedAt,
    stoppedAt: state === TIMER_STATES.STOPPED ? stoppedAt : '',
    stopReason: state === TIMER_STATES.STOPPED ? stopReason : '',
  };
};

export const getTimerElapsedMs = (timer, nowMs = Date.now()) => {
  const normalized = normalizeTaskTimer(timer);
  if (normalized.state !== TIMER_STATES.RUNNING) return normalized.elapsedMs;
  const startedMs = toTimestampMs(normalized.startedAt);
  if (!Number.isFinite(startedMs)) return normalized.elapsedMs;
  return normalized.elapsedMs + Math.max(0, Math.floor(nowMs - startedMs));
};

export const startTaskTimer = (timer, nowMs = Date.now()) => {
  const normalized = normalizeTaskTimer(timer);
  if (normalized.state === TIMER_STATES.STOPPED || normalized.state === TIMER_STATES.RUNNING) return normalized;
  return {
    ...normalized,
    state: TIMER_STATES.RUNNING,
    startedAt: toIso(nowMs),
    stoppedAt: '',
    stopReason: '',
  };
};

export const pauseTaskTimer = (timer, nowMs = Date.now()) => {
  const normalized = normalizeTaskTimer(timer);
  if (normalized.state !== TIMER_STATES.RUNNING) return normalized;
  return {
    ...normalized,
    state: TIMER_STATES.PAUSED,
    elapsedMs: getTimerElapsedMs(normalized, nowMs),
    startedAt: '',
  };
};

export const stopTaskTimer = (timer, nowMs = Date.now(), reason = 'manual') => {
  const normalized = normalizeTaskTimer(timer);
  if (normalized.state === TIMER_STATES.STOPPED) return normalized;
  return {
    ...normalized,
    state: TIMER_STATES.STOPPED,
    elapsedMs: getTimerElapsedMs(normalized, nowMs),
    startedAt: '',
    stoppedAt: toIso(nowMs),
    stopReason: reason === 'completed' ? 'completed' : 'manual',
  };
};

export const reopenTaskTimer = (timer) => {
  const normalized = normalizeTaskTimer(timer);
  return {
    ...normalized,
    state: TIMER_STATES.PAUSED,
    startedAt: '',
    stoppedAt: '',
    stopReason: '',
  };
};

export const startExclusiveTimer = (tasks, taskId, nowMs = Date.now()) => {
  const target = tasks.find((task) => task.id === taskId);
  if (!target || normalizeTaskTimer(target.timer).state === TIMER_STATES.STOPPED) return tasks;

  return tasks.map((task) => {
    if (task.id === taskId) {
      const timer = startTaskTimer(task.timer, nowMs);
      return timer.state === normalizeTaskTimer(task.timer).state && timer.startedAt === normalizeTaskTimer(task.timer).startedAt
        ? task
        : { ...task, timer };
    }
    if (normalizeTaskTimer(task.timer).state === TIMER_STATES.RUNNING) {
      return { ...task, timer: pauseTaskTimer(task.timer, nowMs) };
    }
    return task;
  });
};

export const transitionTaskStatus = (task, nextStatus, options = {}) => {
  const { canReopenCompleted = false, nowMs = Date.now() } = options;
  if (!task || nextStatus === task.status) return { task, changed: false, blocked: false };

  if (task.status === 'done' && nextStatus !== 'done') {
    if (!canReopenCompleted || nextStatus !== 'doing') {
      return { task, changed: false, blocked: true };
    }
    return {
      task: { ...task, status: 'doing', timer: reopenTaskTimer(task.timer) },
      changed: true,
      blocked: false,
    };
  }

  if (nextStatus === 'done') {
    return {
      task: { ...task, status: 'done', timer: stopTaskTimer(task.timer, nowMs, 'completed') },
      changed: true,
      blocked: false,
    };
  }

  return {
    task: { ...task, status: nextStatus },
    changed: true,
    blocked: false,
  };
};

export const formatElapsedTime = (milliseconds) => {
  const totalSeconds = Math.floor(Math.max(0, Number(milliseconds) || 0) / 1000);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
};
`;

write('webapp/src/lib/task-timer.js', timerModule);

const timerTests = `import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TIMER_STATES,
  emptyTaskTimer,
  getTimerElapsedMs,
  pauseTaskTimer,
  reopenTaskTimer,
  startExclusiveTimer,
  startTaskTimer,
  stopTaskTimer,
  transitionTaskStatus,
} from '../src/lib/task-timer.js';

const T0 = Date.parse('2026-09-12T10:00:00.000Z');

test('timer starts, pauses and preserves accumulated time', () => {
  const running = startTaskTimer(emptyTaskTimer(), T0);
  assert.equal(running.state, TIMER_STATES.RUNNING);
  assert.equal(getTimerElapsedMs(running, T0 + 5000), 5000);

  const paused = pauseTaskTimer(running, T0 + 5000);
  assert.equal(paused.state, TIMER_STATES.PAUSED);
  assert.equal(paused.elapsedMs, 5000);

  const resumed = startTaskTimer(paused, T0 + 10000);
  assert.equal(getTimerElapsedMs(resumed, T0 + 12000), 7000);
});

test('starting one timer automatically pauses every other running timer', () => {
  const first = { id: 'a', timer: startTaskTimer(emptyTaskTimer(), T0) };
  const second = { id: 'b', timer: emptyTaskTimer() };
  const next = startExclusiveTimer([first, second], 'b', T0 + 3000);

  assert.equal(next[0].timer.state, TIMER_STATES.PAUSED);
  assert.equal(next[0].timer.elapsedMs, 3000);
  assert.equal(next[1].timer.state, TIMER_STATES.RUNNING);
});

test('manual stop is final until a privileged completed-task reopen occurs', () => {
  const running = startTaskTimer(emptyTaskTimer(), T0);
  const stopped = stopTaskTimer(running, T0 + 4000, 'manual');
  assert.equal(stopped.state, TIMER_STATES.STOPPED);
  assert.equal(stopped.elapsedMs, 4000);
  assert.equal(startTaskTimer(stopped, T0 + 8000).state, TIMER_STATES.STOPPED);

  const reopened = reopenTaskTimer(stopped);
  assert.equal(reopened.state, TIMER_STATES.PAUSED);
  assert.equal(reopened.elapsedMs, 4000);
});

test('completing a task stops timer without clearing time', () => {
  const task = { id: 'a', status: 'doing', timer: startTaskTimer(emptyTaskTimer(), T0) };
  const result = transitionTaskStatus(task, 'done', { nowMs: T0 + 9000 });
  assert.equal(result.task.status, 'done');
  assert.equal(result.task.timer.state, TIMER_STATES.STOPPED);
  assert.equal(result.task.timer.elapsedMs, 9000);
  assert.equal(result.task.timer.stopReason, 'completed');
});

test('only privileged transition can reopen done task and timer becomes paused', () => {
  const stoppedTask = {
    id: 'a',
    status: 'done',
    timer: stopTaskTimer(startTaskTimer(emptyTaskTimer(), T0), T0 + 5000, 'completed'),
  };

  const blocked = transitionTaskStatus(stoppedTask, 'doing', { canReopenCompleted: false, nowMs: T0 + 6000 });
  assert.equal(blocked.blocked, true);
  assert.equal(blocked.task.status, 'done');

  const reopened = transitionTaskStatus(stoppedTask, 'doing', { canReopenCompleted: true, nowMs: T0 + 6000 });
  assert.equal(reopened.blocked, false);
  assert.equal(reopened.task.status, 'doing');
  assert.equal(reopened.task.timer.state, TIMER_STATES.PAUSED);
  assert.equal(reopened.task.timer.elapsedMs, 5000);
});
`;
write('webapp/tests/timer.test.mjs', timerTests);

let permissions = read(permissionsPath);
permissions = mustReplace(permissions, "'tasks.create', 'tasks.update', 'tasks.delete', 'tasks.comment',", "'tasks.create', 'tasks.update', 'tasks.delete', 'tasks.comment', 'tasks.timer',", 'admin timer permission');
permissions = mustReplace(permissions, "'tasks.create', 'tasks.update', 'tasks.delete', 'tasks.comment',\n    'workspace.export',", "'tasks.create', 'tasks.update', 'tasks.delete', 'tasks.comment', 'tasks.timer',\n    'workspace.export',", 'member timer permission');
permissions = mustReplace(permissions, "manager: ['projects.update', 'tasks.create', 'tasks.update', 'tasks.delete'],\n  editor: ['tasks.create', 'tasks.update', 'tasks.delete'],", "manager: ['projects.update', 'tasks.create', 'tasks.update', 'tasks.delete', 'tasks.timer'],\n  editor: ['tasks.create', 'tasks.update', 'tasks.delete', 'tasks.timer'],", 'project timer permission');
permissions += "\nexport const canReopenCompletedTask = (member) => member?.role === 'owner' || member?.role === 'admin';\n";
write(permissionsPath, permissions);

let storage = read(storagePath);
storage = mustReplace(storage, "import { isTaskExecutionType } from './task-types.js';", "import { isTaskExecutionType } from './task-types.js';\nimport { TIMER_STATES, normalizeTaskTimer, pauseTaskTimer, stopTaskTimer } from './task-timer.js';", 'storage timer import');
storage = mustReplace(storage, 'const WORKSPACE_VERSION = 5;', 'const WORKSPACE_VERSION = 6;', 'workspace version');
const normalizeTaskBlock = `const normalizeTask = (task, index, projectIds) => {
  const projectId = asText(task?.projectId);
  const status = VALID_STATUSES.has(task?.status) ? task.status : 'todo';
  let timer = normalizeTaskTimer(task?.timer);
  if (status === 'done' && timer.state !== TIMER_STATES.STOPPED) {
    timer = stopTaskTimer(timer, Date.now(), 'completed');
  }
  return {
    id: asText(task?.id, \`task_\${index + 1}\`),
    title: asText(task?.title).trim(),
    description: asText(task?.description),
    status,
    projectId: projectIds.has(projectId) ? projectId : '',
    priority: VALID_PRIORITIES.has(task?.priority) ? task.priority : 'normal',
    executionType: isTaskExecutionType(task?.executionType) ? task.executionType : '',
    dueDate: asText(task?.dueDate),
    tags: Array.isArray(task?.tags) ? task.tags.filter((tag) => typeof tag === 'string').map((tag) => tag.trim()).filter(Boolean) : [],
    comments: Array.isArray(task?.comments)
      ? task.comments.map(normalizeComment).filter((comment) => comment.text)
      : [],
    timer,
    createdAt: asText(task?.createdAt, now()),
    updatedAt: asText(task?.updatedAt, asText(task?.createdAt, now())),
  };
};`;
storage = replaceBetween(storage, 'const normalizeTask = (task, index, projectIds) => {', '\n\nconst normalizeProjectRoles', normalizeTaskBlock, 'normalizeTask');
storage = mustReplace(storage, `  const tasks = Array.isArray(source.tasks)
    ? source.tasks.map((task, index) => normalizeTask(task, index, projectIds)).filter((task) => task.title)
    : [];`, `  let runningTimerSeen = false;
  const tasks = (Array.isArray(source.tasks)
    ? source.tasks.map((task, index) => normalizeTask(task, index, projectIds)).filter((task) => task.title)
    : [])
    .map((task) => {
      if (task.timer.state !== TIMER_STATES.RUNNING) return task;
      if (!runningTimerSeen) {
        runningTimerSeen = true;
        return task;
      }
      return { ...task, timer: pauseTaskTimer(task.timer) };
    });`, 'single running timer normalization');
write(storagePath, storage);

let app = read(appPath);
app = mustReplace(app, "  canForMember,\n  canManageMemberRole,\n  visibleProjectsForMember,", "  canForMember,\n  canManageMemberRole,\n  canReopenCompletedTask,\n  visibleProjectsForMember,", 'permission import');
app = mustReplace(app, "import { TASK_EXECUTION_TYPES } from './lib/task-types.js';", `import { TASK_EXECUTION_TYPES } from './lib/task-types.js';
import {
  TIMER_STATES,
  emptyTaskTimer,
  formatElapsedTime,
  getTimerElapsedMs,
  pauseTaskTimer,
  startExclusiveTimer,
  stopTaskTimer,
  transitionTaskStatus,
} from './lib/task-timer.js';`, 'timer import');
app = mustReplace(app, "  const canCreateTask = (projectId = '') => canForMember(currentMember, 'tasks.create', projectId);", `  const canCreateTask = (projectId = '') => canForMember(currentMember, 'tasks.create', projectId);
  const canReopenCompleted = canReopenCompletedTask(currentMember);
  const canUseTaskTimer = (projectId = '') => canForMember(currentMember, 'tasks.timer', projectId);`, 'timer permission helpers');
const taskActionsBlock = `  const changeTaskStatus = (id, nextStatus) => {
    const task = workspace.tasks.find((item) => item.id === id);
    if (!task || !canForMember(currentMember, 'tasks.update', task.projectId)) return false;
    const nowMs = Date.now();
    const transition = transitionTaskStatus(task, nextStatus, { canReopenCompleted, nowMs });
    if (transition.blocked) {
      window.alert('Ավարտված առաջադրանքը «Ընթացքում» կարող են վերադարձնել միայն Սեփականատերը կամ Ադմինիստրատորը։');
      return false;
    }
    if (!transition.changed) return true;
    const updatedAt = new Date(nowMs).toISOString();
    setWorkspace((s) => ({ ...s, tasks: s.tasks.map((item) => item.id === id ? { ...transition.task, updatedAt } : item) }));
    return true;
  };

  const patchTask = (id, patch) => {
    const task = workspace.tasks.find((item) => item.id === id);
    if (!task || !canForMember(currentMember, 'tasks.update', task.projectId)) return;
    if (patch.status && patch.status !== task.status) {
      changeTaskStatus(id, patch.status);
      return;
    }
    setWorkspace((s) => ({ ...s, tasks: s.tasks.map((t) => t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t) }));
  };

  const startTimerForTask = (id) => {
    const task = workspace.tasks.find((item) => item.id === id);
    if (!task || task.status === 'done' || !canUseTaskTimer(task.projectId)) return;
    if (task.timer?.state === TIMER_STATES.STOPPED) {
      window.alert('Այս timer-ը Stop է արվել և այլևս չի կարող վերագործարկվել։');
      return;
    }
    const nowMs = Date.now();
    const updatedAt = new Date(nowMs).toISOString();
    setWorkspace((s) => {
      const nextTasks = startExclusiveTimer(s.tasks, id, nowMs);
      return { ...s, tasks: nextTasks.map((item, index) => item === s.tasks[index] ? item : { ...item, updatedAt }) };
    });
  };

  const pauseTimerForTask = (id) => {
    const task = workspace.tasks.find((item) => item.id === id);
    if (!task || !canUseTaskTimer(task.projectId) || task.timer?.state !== TIMER_STATES.RUNNING) return;
    const nowMs = Date.now();
    setWorkspace((s) => ({ ...s, tasks: s.tasks.map((item) => item.id === id ? { ...item, timer: pauseTaskTimer(item.timer, nowMs), updatedAt: new Date(nowMs).toISOString() } : item) }));
  };

  const stopTimerForTask = (id) => {
    const task = workspace.tasks.find((item) => item.id === id);
    if (!task || !canUseTaskTimer(task.projectId)) return;
    if (![TIMER_STATES.RUNNING, TIMER_STATES.PAUSED].includes(task.timer?.state)) return;
    if (!window.confirm('Վստա՞հ եք, որ սեղմում եք Stop։ Հաստատելուց հետո timer-ը այլևս չեք կարող վերագործարկել։')) return;
    const nowMs = Date.now();
    setWorkspace((s) => ({ ...s, tasks: s.tasks.map((item) => item.id === id ? { ...item, timer: stopTaskTimer(item.timer, nowMs, 'manual'), updatedAt: new Date(nowMs).toISOString() } : item) }));
  };`;
app = replaceBetween(app, '  const patchTask = (id, patch) => {', '\n\n  const deleteTask', taskActionsBlock, 'task actions');
app = mustReplace(app, `      tags: [],
      comments: [],
    });`, `      tags: [],
      comments: [],
      timer: emptyTaskTimer(),
    });`, 'new task timer');
const saveTaskBlock = `  const saveTask = (task) => {
    const clean = { ...task, title: task.title.trim(), tags: Array.isArray(task.tags) ? task.tags.filter(Boolean) : [] };
    if (!clean.title) { window.alert('Լրացրեք առաջադրանքի վերնագիրը։'); return; }
    if (!TASK_EXECUTION_TYPES[clean.executionType]) { window.alert('Ընտրեք առաջադրանքի կատարման տեսակը։'); return; }
    if (!clean.dueDate) { window.alert('Նշեք առաջադրանքի կատարման ժամկետը։'); return; }
    const existing = clean.id ? workspace.tasks.find((item) => item.id === clean.id) : null;
    if (existing && !canForMember(currentMember, 'tasks.update', existing.projectId)) return;
    if (!existing && !canCreateTask(clean.projectId)) return;
    if (existing && clean.projectId !== existing.projectId && !canForMember(currentMember, 'tasks.update', clean.projectId)) return;
    if (existing && existing.status === 'done' && clean.status !== 'done' && !(canReopenCompleted && clean.status === 'doing')) {
      window.alert('Ավարտված առաջադրանքը «Ընթացքում» կարող են վերադարձնել միայն Սեփականատերը կամ Ադմինիստրատորը։');
      return;
    }
    const nowMs = Date.now();
    const updatedAt = new Date(nowMs).toISOString();
    const { comments: ignoredComments, timer: ignoredTimer, ...editable } = clean;
    setWorkspace((s) => clean.id ? {
      ...s,
      tasks: s.tasks.map((current) => {
        if (current.id !== clean.id) return current;
        const transition = transitionTaskStatus(current, clean.status, { canReopenCompleted, nowMs });
        if (transition.blocked) return current;
        return { ...transition.task, ...editable, status: transition.task.status, timer: transition.task.timer || current.timer || emptyTaskTimer(), comments: current.comments || [], updatedAt };
      }),
    } : {
      ...s,
      tasks: [...s.tasks, { ...editable, comments: [], timer: clean.status === 'done' ? stopTaskTimer(emptyTaskTimer(), nowMs, 'completed') : emptyTaskTimer(), id: uid('task'), createdAt: updatedAt, updatedAt }],
    });
    setShowTaskModal(false);
  };`;
app = replaceBetween(app, '  const saveTask = (task) => {', '\n\n  const addProject', saveTaskBlock, 'saveTask');
app = mustReplace(app, "  const headerTitle = view === 'team'", `  const modalTask = editingTask?.id
    ? workspace.tasks.find((task) => task.id === editingTask.id) || editingTask
    : editingTask;

  const headerTitle = view === 'team'`, 'modal current task');
app = mustReplace(app, "draggable={canForMember(currentMember, 'tasks.update', task.projectId)} />", "draggable={canForMember(currentMember, 'tasks.update', task.projectId) && (task.status !== 'done' || canReopenCompleted)} />", 'completed drag restriction');
app = mustReplace(app, "patchTask(task.id, { status: task.status === 'done' ? 'todo' : 'done' });", "patchTask(task.id, { status: task.status === 'done' ? 'doing' : 'done' });", 'list completion toggle');
app = mustReplace(app, '        task={editingTask}', '        task={modalTask}', 'modal task prop');
app = mustReplace(app, "        readOnly={editingTask?.id ? !canForMember(currentMember, 'tasks.update', editingTask.projectId) : false}", "        readOnly={modalTask?.id ? !canForMember(currentMember, 'tasks.update', modalTask.projectId) : false}", 'modal readonly');
app = mustReplace(app, "        canDelete={editingTask?.id ? canForMember(currentMember, 'tasks.delete', editingTask.projectId) : false}", "        canDelete={modalTask?.id ? canForMember(currentMember, 'tasks.delete', modalTask.projectId) : false}", 'modal delete');
app = mustReplace(app, "        canComment={editingTask?.id ? canForMember(currentMember, 'tasks.comment', editingTask.projectId) : false}", `        canComment={modalTask?.id ? canForMember(currentMember, 'tasks.comment', modalTask.projectId) : false}
        canUseTimer={modalTask?.id ? canUseTaskTimer(modalTask.projectId) : false}
        canReopenCompleted={canReopenCompleted}
        onTimerStart={startTimerForTask}
        onTimerPause={pauseTimerForTask}
        onTimerStop={stopTimerForTask}`, 'modal timer props');
const taskCardBlock = `function TaskCard({ task, project, onOpen, onDragStart, draggable }) {
  const elapsed = getTimerElapsedMs(task.timer, Date.now());
  const showTimer = task.timer?.state !== TIMER_STATES.IDLE || elapsed > 0;
  return <article className="task-card" draggable={draggable} onDragStart={draggable ? onDragStart : undefined} onClick={onOpen}>
    <div className="card-top"><span className={\`priority-pill \${task.priority}\`}>{PRIORITIES[task.priority]?.label}</span><span className="drag">{draggable ? '⋮⋮' : '◦'}</span></div>
    <h3>{task.title}</h3>
    <div className={\`execution-type \${task.executionType ? '' : 'missing'}\`}>{TASK_EXECUTION_TYPES[task.executionType] || 'Կատարման տեսակ չի նշված'}</div>
    {showTimer && <div className={\`task-timer-chip \${task.timer?.state || TIMER_STATES.IDLE}\`}>⏱ {formatElapsedTime(elapsed)} · {task.timer?.state === TIMER_STATES.RUNNING ? 'Աշխատում է' : task.timer?.state === TIMER_STATES.PAUSED ? 'Pause' : 'Stop'}</div>}
    {task.description && <p>{task.description}</p>}
    {(task.tags || []).length > 0 && <div className="tags">{task.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>}
    <div className="card-meta"><span>▣ {project}{task.comments?.length ? \` · 💬 \${task.comments.length}\` : ''}</span><span className={!task.dueDate || (task.dueDate < todayKey() && task.status !== 'done') ? 'overdue' : ''}>◷ {task.dueDate || 'Ժամկետ չի նշված'}</span></div>
  </article>;
}`;
app = replaceBetween(app, 'function TaskCard(', '\n\nfunction TaskModal', taskCardBlock, 'TaskCard');
const taskModalBlock = `function TaskModal({
  task, projects, readOnly, canDelete, canComment, canUseTimer, canReopenCompleted,
  onAddComment, onTimerStart, onTimerPause, onTimerStop, onClose, onSave, onDelete,
}) {
  const [draft, setDraft] = useState({ ...task, executionType: task.executionType || '', dueDate: task.dueDate || '', tags: task.tags || [] });
  const [commentText, setCommentText] = useState('');
  const [timerNow, setTimerNow] = useState(Date.now());
  const set = (key, value) => setDraft((d) => ({ ...d, [key]: value }));
  const canSave = Boolean(draft.title.trim() && TASK_EXECUTION_TYPES[draft.executionType] && draft.dueDate);
  const comments = task.comments || [];
  const timer = task.timer || emptyTaskTimer();
  const timerElapsed = getTimerElapsedMs(timer, timerNow);
  const timerStateLabel = timer.state === TIMER_STATES.RUNNING ? 'Աշխատում է' : timer.state === TIMER_STATES.PAUSED ? 'Pause' : timer.state === TIMER_STATES.STOPPED ? 'Stop' : 'Չմեկնարկած';
  const statusOptions = task.status === 'done' ? (canReopenCompleted ? STATUSES.filter((status) => status.id === 'doing' || status.id === 'done') : STATUSES.filter((status) => status.id === 'done')) : STATUSES;
  useEffect(() => {
    setTimerNow(Date.now());
    if (timer.state !== TIMER_STATES.RUNNING) return undefined;
    const interval = window.setInterval(() => setTimerNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [timer.state, timer.startedAt]);
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
      <label className="field"><span>Կարգավիճակ</span><select disabled={readOnly} value={draft.status} onChange={(e) => set('status', e.target.value)}>{statusOptions.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</select></label>
      <label className="field"><span>Կատարման տեսակ *</span><select disabled={readOnly} required value={draft.executionType} onChange={(e) => set('executionType', e.target.value)}><option value="">Ընտրել կատարման տեսակը</option>{Object.entries(TASK_EXECUTION_TYPES).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      <label className="field"><span>Առաջնահերթություն</span><select disabled={readOnly} value={draft.priority} onChange={(e) => set('priority', e.target.value)}>{Object.entries(PRIORITIES).map(([id, p]) => <option key={id} value={id}>{p.label}</option>)}</select></label>
      <label className="field"><span>Կատարման ժամկետ *</span><input disabled={readOnly} required type="date" value={draft.dueDate} onChange={(e) => set('dueDate', e.target.value)} /></label>
    </div>
    {!readOnly && <p className="required-note">* Պարտադիր լրացվող դաշտեր</p>}
    <label className="field"><span>Պիտակներ</span><input disabled={readOnly} value={draft.tags.join(', ')} onChange={(e) => set('tags', e.target.value.split(',').map((x) => x.trim()))} placeholder="օրինակ՝ դիզայն, հաճախորդ" /></label>
    <section className={\`timer-panel \${timer.state}\`}>
      <div className="timer-panel-head"><div><strong>Կատարման ժամանակ</strong><span className="timer-state">{timerStateLabel}</span></div><div className="timer-display">⏱ {formatElapsedTime(timerElapsed)}</div></div>
      {task.id ? <div className="timer-controls">
        {timer.state === TIMER_STATES.IDLE && canUseTimer && task.status !== 'done' && <button className="primary" onClick={() => onTimerStart(task.id)}>▶ Մեկնարկել</button>}
        {timer.state === TIMER_STATES.PAUSED && canUseTimer && task.status !== 'done' && <button className="primary" onClick={() => onTimerStart(task.id)}>▶ Շարունակել</button>}
        {timer.state === TIMER_STATES.RUNNING && canUseTimer && <button className="ghost" onClick={() => onTimerPause(task.id)}>Ⅱ Pause</button>}
        {[TIMER_STATES.RUNNING, TIMER_STATES.PAUSED].includes(timer.state) && canUseTimer && <button className="danger" onClick={() => onTimerStop(task.id)}>■ Stop</button>}
        {timer.state === TIMER_STATES.STOPPED && <span className="timer-locked">Timer-ը վերջնական կանգնեցված է։</span>}
      </div> : <p className="timer-hint">Timer-ը հասանելի կլինի առաջադրանքը պահպանելուց հետո։</p>}
      {task.id && !canUseTimer && <p className="timer-hint">Ձեր դերը թույլ չի տալիս կառավարել timer-ը։</p>}
      {timer.state !== TIMER_STATES.STOPPED && <p className="timer-hint">Մեկ այլ առաջադրանքի timer-ը միացնելիս այս timer-ը ավտոմատ կանցնի Pause վիճակի։</p>}
      {task.status === 'done' && canReopenCompleted && <p className="timer-hint">«Ընթացքում» վերադարձնելուց հետո timer-ը կվերականգնվի Pause վիճակում։</p>}
    </section>
    <section className="comments-section">
      <div className="comments-head"><strong>Մեկնաբանություններ</strong><span>{comments.length}</span></div>
      {comments.length > 0 ? <div className="comment-list">{comments.map((comment) => <article className="comment" key={comment.id}><div className="comment-meta"><strong>{comment.authorName || 'Օգտատեր'}</strong><time>{new Date(comment.createdAt).toLocaleString('hy-AM')}</time></div><p>{comment.text}</p></article>)}</div> : <p className="comments-empty">Այս առաջադրանքի համար դեռ մեկնաբանություններ չկան։</p>}
      {task.id && canComment && <div className="comment-compose"><textarea rows="3" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Գրել մեկնաբանություն…" /><button className="primary" disabled={!commentText.trim()} onClick={submitComment}>Ուղարկել</button></div>}
      {!task.id && <p className="comments-hint">Մեկնաբանություն ավելացնելու համար նախ պահպանեք առաջադրանքը։</p>}
      {task.id && !canComment && <p className="comments-hint">Ձեր դերը թույլ չի տալիս մեկնաբանություն ավելացնել։</p>}
    </section>
    <div className="modal-actions">{draft.id && canDelete ? <button className="danger" onClick={() => onDelete(draft.id)}>Ջնջել</button> : <span />}<div><button className="ghost" onClick={onClose}>{readOnly ? 'Փակել' : 'Չեղարկել'}</button>{!readOnly && <button className="primary" disabled={!canSave} onClick={() => onSave(draft)}>Պահպանել</button>}</div></div>
  </div></div>;
}`;
app = replaceBetween(app, 'function TaskModal(', '\n\nfunction TeamView', taskModalBlock, 'TaskModal');
write(appPath, app);

let permissionTests = read(permissionsTestPath);
permissionTests = mustReplace(permissionTests, "  assert.equal(can('member', 'tasks.create'), true);", "  assert.equal(can('member', 'tasks.create'), true);\n  assert.equal(can('member', 'tasks.timer'), true);", 'member timer permission test');
permissionTests = mustReplace(permissionTests, "  assert.equal(can('viewer', 'tasks.update'), false);", "  assert.equal(can('viewer', 'tasks.update'), false);\n  assert.equal(can('viewer', 'tasks.timer'), false);", 'viewer timer permission test');
permissionTests = mustReplace(permissionTests, "  assert.equal(canForMember(guest, 'tasks.update', 'p1'), true);", "  assert.equal(canForMember(guest, 'tasks.update', 'p1'), true);\n  assert.equal(canForMember(guest, 'tasks.timer', 'p1'), true);", 'guest editor timer permission test');
permissionTests = mustReplace(permissionTests, "  assert.equal(canForMember(guest, 'tasks.update', 'p2'), false);", "  assert.equal(canForMember(guest, 'tasks.update', 'p2'), false);\n  assert.equal(canForMember(guest, 'tasks.timer', 'p2'), false);", 'guest viewer timer permission test');
write(permissionsTestPath, permissionTests);

let storageTests = read(storageTestPath);
storageTests = storageTests.replaceAll('migrated.version, 5', 'migrated.version, 6').replaceAll('restored.version, 5', 'restored.version, 6');
storageTests += `\n\ntest('normalizes timers and keeps at most one running timer', () => {\n  const restored = normalizeWorkspace({\n    projects: [],\n    tasks: [\n      { id: 't1', title: 'One', status: 'doing', timer: { state: 'running', elapsedMs: 1000, startedAt: '2026-09-12T10:00:00.000Z' } },\n      { id: 't2', title: 'Two', status: 'doing', timer: { state: 'running', elapsedMs: 2000, startedAt: '2026-09-12T10:00:00.000Z' } },\n      { id: 't3', title: 'Done', status: 'done', timer: { state: 'paused', elapsedMs: 3000 } },\n    ],\n    settings: {},\n  });\n  assert.equal(restored.version, 6);\n  assert.equal(restored.tasks[0].timer.state, 'running');\n  assert.equal(restored.tasks[1].timer.state, 'paused');\n  assert.equal(restored.tasks[2].timer.state, 'stopped');\n  assert.equal(restored.tasks[2].timer.elapsedMs, 3000);\n});\n`;
write(storageTestPath, storageTests);

const timerCss = `\n\n/* Task timer */\n.task-timer-chip{display:inline-flex;align-items:center;gap:6px;width:max-content;max-width:100%;margin-top:8px;padding:5px 8px;border:1px solid var(--border);border-radius:999px;background:var(--panel-2);color:var(--muted);font-size:12px;font-variant-numeric:tabular-nums}\n.task-timer-chip.running{border-color:var(--julo-success-500);color:var(--julo-success-600);background:var(--julo-success-50)}\n.task-timer-chip.paused{border-color:var(--julo-warning-200);color:var(--julo-warning-700);background:var(--julo-warning-50)}\n.task-timer-chip.stopped{border-color:var(--julo-neutral-300);color:var(--muted)}\n.timer-panel{margin-top:18px;padding:16px;border:1px solid var(--border);border-radius:14px;background:var(--panel-2)}\n.timer-panel-head{display:flex;align-items:center;justify-content:space-between;gap:16px}\n.timer-panel-head>div:first-child{display:flex;flex-direction:column;gap:4px}\n.timer-state{font-size:12px;color:var(--muted)}\n.timer-display{font-size:24px;font-weight:700;letter-spacing:.04em;font-variant-numeric:tabular-nums;color:var(--text)}\n.timer-controls{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:14px}\n.timer-hint,.timer-locked{margin:10px 0 0;color:var(--muted);font-size:12px;line-height:1.5}\n.timer-locked{color:var(--julo-danger-700);font-weight:600}\n:root[data-theme=\"dark\"] .task-timer-chip.running{background:#123127;color:#6ee7b7}\n:root[data-theme=\"dark\"] .task-timer-chip.paused{background:#272014;color:#facc15}\n`;
let managementCss = read(managementCssPath); if (!managementCss.includes('/* Task timer */')) managementCss += timerCss; write(managementCssPath, managementCss);
const timerMobileCss = `\n\n@media (max-width: 720px){.timer-panel{padding:14px}.timer-panel-head{align-items:flex-start;flex-direction:column;gap:10px}.timer-display{font-size:22px}.timer-controls{width:100%}.timer-controls button{flex:1 1 120px}}\n`;
let mobileCss = read(mobileCssPath); if (!mobileCss.includes('.timer-panel{padding:14px}')) mobileCss += timerMobileCss; write(mobileCssPath, mobileCss);

fs.unlinkSync(fileURLToPath(import.meta.url));
console.log('Timer feature codemod applied successfully.');