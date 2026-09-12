import test from 'node:test';
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
