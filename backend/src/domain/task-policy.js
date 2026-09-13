import { canReopenCompletedTask } from './authorization.js';

export const TASK_STATUSES = Object.freeze(['todo', 'doing', 'done']);
export const TIMER_STATES = Object.freeze(['idle', 'running', 'paused', 'stopped']);

export function validateTaskStatusTransition({ currentStatus, nextStatus, workspaceRole }) {
  if (!TASK_STATUSES.includes(currentStatus) || !TASK_STATUSES.includes(nextStatus)) {
    return { allowed: false, reason: 'invalid_status' };
  }
  if (currentStatus === nextStatus) return { allowed: true, timerEffect: 'none' };

  if (currentStatus === 'done') {
    if (nextStatus === 'doing' && canReopenCompletedTask(workspaceRole)) {
      return { allowed: true, timerEffect: 'reopen_paused' };
    }
    return { allowed: false, reason: 'completed_task_reopen_forbidden' };
  }

  if (nextStatus === 'done') {
    return { allowed: true, timerEffect: 'stop_completed' };
  }

  return { allowed: true, timerEffect: 'none' };
}

export function normalizeTimerState(timer = {}) {
  const state = TIMER_STATES.includes(timer.state) ? timer.state : 'idle';
  const elapsedMs = Number.isFinite(timer.elapsedMs) ? Math.max(0, Math.trunc(timer.elapsedMs)) : 0;
  return {
    state,
    elapsedMs,
    startedAt: typeof timer.startedAt === 'string' ? timer.startedAt : null,
    stoppedAt: typeof timer.stoppedAt === 'string' ? timer.stoppedAt : null,
    stopReason: ['manual', 'completed'].includes(timer.stopReason) ? timer.stopReason : null,
  };
}
