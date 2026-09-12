/**
 * timer.js — Модуль мульти-таймеров и сессий учета времени (задачи + перерывы)
 */
const TimerEngine = {
  // Активные таймеры задач: Map(taskId -> { isRunning, lastStartedAt, sessionStartTimestamp, accumulatedSeconds })
  timers: new Map(),

  // Таймер перерыва / отдыха: { isRunning, lastStartedAt, sessionStartTimestamp, accumulatedSeconds, targetMinutes, note }
  breakTimer: null,

  intervalId: null,
  listeners: new Set(),
  sessionCompletedCallbacks: new Set(),

  // =========================================================================
  // Управление таймерами задач
  // =========================================================================
  start(taskId, initialAccumulatedSeconds = 0) {
    // Если в этот момент активен перерыв — автоматически завершаем его
    if (this.isBreakRunning()) {
      this.stopBreak();
    }

    // Автоматически ставим на паузу любые другие запущенные задачи (один активный таймер)
    for (const otherTaskId of this.getActiveTimerIds()) {
      if (otherTaskId !== taskId && this.isRunning(otherTaskId)) {
        this.pause(otherTaskId);
      }
    }

    const now = Date.now();
    let t = this.timers.get(taskId);
    if (!t) {
      t = {
        isRunning: true,
        lastStartedAt: now,
        sessionStartTimestamp: now,
        accumulatedSeconds: initialAccumulatedSeconds
      };
      this.timers.set(taskId, t);
    } else {
      if (!t.isRunning) {
        t.isRunning = true;
        t.lastStartedAt = now;
        t.sessionStartTimestamp = now;
      }
    }

    this.ensureTickLoop();
    this.notifyListeners();
  },

  // Пауза таймера задачи с фиксацией завершенной сессии
  pause(taskId) {
    const t = this.timers.get(taskId);
    if (t && t.isRunning) {
      const now = Date.now();
      const elapsed = Math.floor((now - t.lastStartedAt) / 1000);
      t.accumulatedSeconds += elapsed;
      t.isRunning = false;

      // Фиксируем завершенную сессию работы
      if (t.sessionStartTimestamp) {
        const sessionDuration = Math.floor((now - t.sessionStartTimestamp) / 1000);
        if (sessionDuration >= 2) { // Фиксируем сессии от 2 секунд
          this.emitSessionCompleted({
            type: 'work',
            taskId: taskId,
            startedAt: new Date(t.sessionStartTimestamp).toISOString(),
            endedAt: new Date(now).toISOString(),
            durationSeconds: sessionDuration
          });
        }
      }

      t.lastStartedAt = null;
      t.sessionStartTimestamp = null;
      this.notifyListeners();
    }
  },

  // Переключение Старт / Пауза
  toggle(taskId, initialAccumulatedSeconds = 0) {
    const t = this.timers.get(taskId);
    if (t && t.isRunning) {
      this.pause(taskId);
      return false; // теперь на паузе
    } else {
      this.start(taskId, initialAccumulatedSeconds);
      return true; // теперь запущен
    }
  },

  // Полная остановка таймера с возвратом итогового времени в секундах
  stop(taskId) {
    const t = this.timers.get(taskId);
    let totalSeconds = 0;
    if (t) {
      const now = Date.now();
      totalSeconds = t.accumulatedSeconds;
      if (t.isRunning && t.lastStartedAt) {
        const elapsed = Math.floor((now - t.lastStartedAt) / 1000);
        totalSeconds += elapsed;

        if (t.sessionStartTimestamp) {
          const sessionDuration = Math.floor((now - t.sessionStartTimestamp) / 1000);
          if (sessionDuration >= 2) {
            this.emitSessionCompleted({
              type: 'work',
              taskId: taskId,
              startedAt: new Date(t.sessionStartTimestamp).toISOString(),
              endedAt: new Date(now).toISOString(),
              durationSeconds: sessionDuration
            });
          }
        }
      }
      this.timers.delete(taskId);
      this.notifyListeners();
    }
    this.checkStopLoop();
    return totalSeconds;
  },

  // Получить текущее общее время по задаче (в секундах)
  getElapsedSeconds(taskId) {
    const t = this.timers.get(taskId);
    if (!t) return 0;
    let seconds = t.accumulatedSeconds || 0;
    if (t.isRunning && t.lastStartedAt) {
      seconds += Math.floor((Date.now() - t.lastStartedAt) / 1000);
    }
    return seconds;
  },

  // Проверка: запущен ли таймер для задачи
  isRunning(taskId) {
    const t = this.timers.get(taskId);
    return !!(t && t.isRunning);
  },

  // Список всех активных таймеров задач
  getActiveTimerIds() {
    return Array.from(this.timers.keys());
  },

  // Пауза всех активных задач (например, при уходе на перерыв)
  pauseAllTasks() {
    for (const taskId of this.getActiveTimerIds()) {
      if (this.isRunning(taskId)) {
        this.pause(taskId);
      }
    }
  },

  // =========================================================================
  // Управление перерывом (Break Timer)
  // =========================================================================
  startBreak(targetMinutes = null, note = '') {
    // Автоматически ставим на паузу все задачи
    this.pauseAllTasks();

    const now = Date.now();
    this.breakTimer = {
      isRunning: true,
      lastStartedAt: now,
      sessionStartTimestamp: now,
      accumulatedSeconds: 0,
      targetMinutes: targetMinutes,
      note: note
    };

    this.ensureTickLoop();
    this.notifyListeners();
  },

  pauseBreak() {
    if (this.breakTimer && this.breakTimer.isRunning) {
      const now = Date.now();
      const elapsed = Math.floor((now - this.breakTimer.lastStartedAt) / 1000);
      this.breakTimer.accumulatedSeconds += elapsed;
      this.breakTimer.isRunning = false;

      if (this.breakTimer.sessionStartTimestamp) {
        const sessionDuration = Math.floor((now - this.breakTimer.sessionStartTimestamp) / 1000);
        if (sessionDuration >= 2) {
          this.emitSessionCompleted({
            type: 'break',
            taskTitle: '☕ Перерыв / Отдых',
            startedAt: new Date(this.breakTimer.sessionStartTimestamp).toISOString(),
            endedAt: new Date(now).toISOString(),
            durationSeconds: sessionDuration,
            note: this.breakTimer.note || ''
          });
        }
      }

      this.breakTimer.lastStartedAt = null;
      this.breakTimer.sessionStartTimestamp = null;
      this.notifyListeners();
    }
  },

  stopBreak() {
    if (this.breakTimer) {
      const now = Date.now();
      let totalSeconds = this.breakTimer.accumulatedSeconds;
      if (this.breakTimer.isRunning && this.breakTimer.lastStartedAt) {
        const elapsed = Math.floor((now - this.breakTimer.lastStartedAt) / 1000);
        totalSeconds += elapsed;

        if (this.breakTimer.sessionStartTimestamp) {
          const sessionDuration = Math.floor((now - this.breakTimer.sessionStartTimestamp) / 1000);
          if (sessionDuration >= 2) {
            this.emitSessionCompleted({
              type: 'break',
              taskTitle: '☕ Перерыв / Отдых',
              startedAt: new Date(this.breakTimer.sessionStartTimestamp).toISOString(),
              endedAt: new Date(now).toISOString(),
              durationSeconds: sessionDuration,
              note: this.breakTimer.note || ''
            });
          }
        }
      }

      this.breakTimer = null;
      this.notifyListeners();
      this.checkStopLoop();
      return totalSeconds;
    }
    return 0;
  },

  toggleBreak(targetMinutes = null, note = '') {
    if (this.isBreakRunning()) {
      return this.stopBreak();
    } else {
      this.startBreak(targetMinutes, note);
      return true;
    }
  },

  isBreakRunning() {
    return !!(this.breakTimer && this.breakTimer.isRunning);
  },

  getBreakElapsedSeconds() {
    if (!this.breakTimer) return 0;
    let seconds = this.breakTimer.accumulatedSeconds || 0;
    if (this.breakTimer.isRunning && this.breakTimer.lastStartedAt) {
      seconds += Math.floor((Date.now() - this.breakTimer.lastStartedAt) / 1000);
    }
    return seconds;
  },

  getBreakInfo() {
    return this.breakTimer;
  },

  // =========================================================================
  // Форматирование времени
  // =========================================================================
  formatTimeDigits(totalSeconds) {
    if (isNaN(totalSeconds) || totalSeconds < 0) totalSeconds = 0;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n) => String(n).padStart(2, '0');
    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  },

  formatTimeReadable(totalSeconds) {
    if (!totalSeconds || totalSeconds <= 0) return '0 мин';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts = [];
    if (hours > 0) parts.push(`${hours} ч`);
    if (minutes > 0) parts.push(`${minutes} мин`);
    if (hours === 0 && minutes === 0 && seconds > 0) parts.push(`${seconds} сек`);
    return parts.join(' ') || '0 мин';
  },

  // =========================================================================
  // Подписки на события
  // =========================================================================
  subscribe(listener) {
    this.listeners.add(listener);
  },

  unsubscribe(listener) {
    this.listeners.delete(listener);
  },

  notifyListeners() {
    for (const listener of this.listeners) {
      listener(this.timers, this.breakTimer);
    }
  },

  onSessionCompleted(callback) {
    this.sessionCompletedCallbacks.add(callback);
  },

  emitSessionCompleted(sessionData) {
    for (const cb of this.sessionCompletedCallbacks) {
      try {
        cb(sessionData);
      } catch (err) {
        console.error('Error in sessionCompletedCallback:', err);
      }
    }
  },

  ensureTickLoop() {
    if (!this.intervalId) {
      this.intervalId = setInterval(() => {
        let hasRunning = this.isBreakRunning();
        if (!hasRunning) {
          for (const t of this.timers.values()) {
            if (t.isRunning) {
              hasRunning = true;
              break;
            }
          }
        }
        if (hasRunning) {
          this.notifyListeners();
        }
      }, 1000);
    }
  },

  checkStopLoop() {
    if (this.timers.size === 0 && !this.breakTimer && this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
};

window.TimerEngine = TimerEngine;
