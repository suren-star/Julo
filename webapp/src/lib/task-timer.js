export const TIMER_STATES = Object.freeze({
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
