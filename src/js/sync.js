/**
 * sync.js — Интеллектуальный модуль облачной синхронизации WebDAV (Mail.ru Cloud)
 */
const SyncEngine = {
  status: 'idle', // 'idle' | 'syncing' | 'success' | 'error' | 'disabled'
  lastSyncTime: null,
  lastError: null,
  isSyncInProgress: false,
  hasPendingSync: false,
  debounceTimer: null,
  listeners: new Set(),

  init() {
    // Подписка на возврат фокуса в окно (проверяем изменения в облаке)
    window.addEventListener('focus', () => {
      if (this.isConfiguredAndEnabled()) {
        const now = Date.now();
        const last = this.lastSyncTime ? new Date(this.lastSyncTime).getTime() : 0;
        // Если с прошлой синхронизации прошло больше 30 секунд — проверяем облако с небольшой задержкой (1.5 сек)
        if (now - last > 30000) {
          setTimeout(() => {
            if (this.isConfiguredAndEnabled()) {
              this.sync({ silent: true });
            }
          }, 1500);
        }
      }
    });

    // Обработка восстановления подключения к интернету
    window.addEventListener('online', () => {
      if (this.isConfiguredAndEnabled()) {
        this.sync({ silent: true });
      }
    });

    this.updateStatus('idle');
  },

  subscribe(callback) {
    this.listeners.add(callback);
    callback(this.getStatusInfo());
    return () => this.listeners.delete(callback);
  },

  notifyListeners() {
    const info = this.getStatusInfo();
    this.listeners.forEach(cb => {
      try { cb(info); } catch (e) { console.error('Ошибка в подписчике SyncEngine:', e); }
    });
  },

  getStatusInfo() {
    return {
      status: this.status,
      lastSyncTime: this.lastSyncTime,
      lastError: this.lastError,
      isEnabled: this.isConfiguredAndEnabled()
    };
  },

  updateStatus(newStatus, error = null) {
    this.status = newStatus;
    this.lastError = error;
    if (newStatus === 'success') {
      this.lastSyncTime = new Date().toISOString();
      this.lastError = null;
    }
    this.notifyListeners();
  },

  getWebdavConfig() {
    const settings = (window.App && window.App.data && window.App.data.settings) ? window.App.data.settings : {};
    const webdav = settings.webdav || {};
    return {
      enabled: !!webdav.enabled,
      serverUrl: webdav.serverUrl || 'https://webdav.cloud.mail.ru',
      username: webdav.username || '',
      password: webdav.password || '',
      cloudFolder: webdav.cloudFolder || webdav.folderPath || 'PlanerSync',
      folderPath: webdav.cloudFolder || webdav.folderPath || 'PlanerSync'
    };
  },

  isConfiguredAndEnabled() {
    const cfg = this.getWebdavConfig();
    return !!(cfg && cfg.enabled && cfg.username && cfg.password);
  },

  // Проверка реквизитов подключения к WebDAV
  async testConnection(customConfig = null) {
    const cfg = customConfig || this.getWebdavConfig();
    if (window.electronAPI && window.electronAPI.webdavTestConnection) {
      return await window.electronAPI.webdavTestConnection(cfg);
    }
    return { success: false, error: 'WebDAV поддерживается в десктопном приложении' };
  },

  // Отложенная авто-синхронизация при локальных изменениях (Debounce)
  scheduleAutoSync(delayMs = 2500) {
    if (!this.isConfiguredAndEnabled()) return;

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.sync({ silent: true });
    }, delayMs);
  },

  // Запись метки удаления (Tombstone), чтобы удаленные задачи не воскресали с другого ПК
  recordTombstone(id, type) {
    if (!window.App || !window.App.data) return;
    if (!Array.isArray(window.App.data.deletedTombstones)) {
      window.App.data.deletedTombstones = [];
    }

    window.App.data.deletedTombstones.push({
      id: id,
      type: type, // 'task' | 'section' | 'project'
      deletedAt: new Date().toISOString()
    });

    // Ограничиваем размер журнала удалений 200 записями
    if (window.App.data.deletedTombstones.length > 200) {
      window.App.data.deletedTombstones = window.App.data.deletedTombstones.slice(-200);
    }
  },

  // Главный метод двусторонней синхронизации
  async sync(options = {}) {
    const { force = false, silent = false } = options;

    if (!force && !this.isConfiguredAndEnabled()) {
      this.updateStatus('disabled');
      return { success: false, error: 'Облачная синхронизация выключена в настройках' };
    }

    if (this.isSyncInProgress) {
      this.hasPendingSync = true;
      return { success: true, pending: true };
    }

    this.isSyncInProgress = true;
    this.updateStatus('syncing');

    try {
      const config = this.getWebdavConfig();
      if (!window.electronAPI || !window.electronAPI.webdavFetchRemote || !window.electronAPI.webdavPushRemote) {
        throw new Error('API облачной синхронизации недоступно');
      }

      // 1. Получаем удаленные данные из Облака
      const remoteRes = await window.electronAPI.webdavFetchRemote(config);
      if (!remoteRes.success) {
        throw new Error(remoteRes.error || 'Ошибка скачивания данных из облака');
      }

      const localData = window.App.data;
      let finalDataToSave = null;
      let shouldUploadToRemote = false;
      let shouldUpdateLocal = false;

      if (!remoteRes.exists || !remoteRes.data) {
        // Удаленного файла еще нет в облаке — выгружаем текущие локальные данные
        localData.lastSyncedAt = new Date().toISOString();
        finalDataToSave = localData;
        shouldUploadToRemote = true;
      } else {
        // 2. Интеллектуальное двустороннее слияние
        const mergeResult = this.mergeDatabases(localData, remoteRes.data);
        finalDataToSave = mergeResult.mergedData;
        shouldUploadToRemote = mergeResult.remoteNeedsUpdate || force;
        shouldUpdateLocal = mergeResult.localNeedsUpdate;
        if (force) {
          finalDataToSave.lastSyncedAt = new Date().toISOString();
        }
      }

      // 3. Если удаленный сервер требует обновлений — выгружаем в WebDAV
      if (shouldUploadToRemote) {
        finalDataToSave.lastSyncedAt = new Date().toISOString();
        const pushRes = await window.electronAPI.webdavPushRemote({
          config,
          data: finalDataToSave
        });
        if (!pushRes.success) {
          throw new Error(pushRes.error || 'Ошибка отправки данных в облако');
        }
      }

      // 4. Если локальная база получила свежие данные из облака — обновляем память и диск
      if (shouldUpdateLocal || shouldUploadToRemote) {
        window.App.data = finalDataToSave;
        await window.Storage.save(finalDataToSave);
        if (shouldUpdateLocal) {
          const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
          const isUserTyping = activeTag === 'input' || activeTag === 'textarea' || document.activeElement?.isContentEditable;

          window.App.normalizeAllData();
          window.App.renderSidebar();
          window.App.populateProjectSelects();
          if (!isUserTyping) {
            window.App.renderCurrentView();
            window.App.hasPendingUIUpdate = false;
          } else {
            window.App.hasPendingUIUpdate = true;
          }
          window.App.updateBadges();
        }
      }

      this.updateStatus('success');

      // Если накопились изменения за время синхронизации — запускаем следующий виток
      if (this.hasPendingSync) {
        this.hasPendingSync = false;
        setTimeout(() => this.sync({ silent: true }), 1000);
      }

      return { success: true };
    } catch (err) {
      console.error('Ошибка облачной синхронизации WebDAV:', err);
      this.updateStatus('error', err.message);
      return { success: false, error: err.message };
    } finally {
      this.isSyncInProgress = false;
    }
  },

  // Интеллектуальное объединение локальной и облачной баз
  mergeDatabases(local, remote) {
    const safeArray = arr => Array.isArray(arr) ? arr : [];

    const lTasks = safeArray(local.tasks);
    const rTasks = safeArray(remote.tasks);
    const lComp = safeArray(local.completedTasks);
    const rComp = safeArray(remote.completedTasks);
    const lSections = safeArray(local.sections);
    const rSections = safeArray(remote.sections);
    const lLogs = safeArray(local.timeLogs);
    const rLogs = safeArray(remote.timeLogs);
    const lTombs = safeArray(local.deletedTombstones);
    const rTombs = safeArray(remote.deletedTombstones);

    let localNeedsUpdate = false;
    let remoteNeedsUpdate = false;

    // 1. Слияние журнала удалений (Tombstones)
    const nowMs = Date.now();
    const maxAgeMs = 30 * 24 * 3600 * 1000; // 30 дней жизни меток удаления
    const tombMap = new Map();

    [...lTombs, ...rTombs].forEach(t => {
      const tMs = new Date(t.deletedAt || 0).getTime();
      if (nowMs - tMs < maxAgeMs) {
        if (!tombMap.has(t.id) || new Date(t.deletedAt) > new Date(tombMap.get(t.id).deletedAt)) {
          tombMap.set(t.id, t);
        }
      }
    });

    const mergedTombs = Array.from(tombMap.values()).slice(-200);
    if (mergedTombs.length !== lTombs.length) localNeedsUpdate = true;
    if (mergedTombs.length !== rTombs.length) remoteNeedsUpdate = true;

    const isItemDeleted = (item) => {
      const tomb = tombMap.get(item.id);
      if (!tomb) return false;
      const itemTime = new Date(item.updatedAt || item.createdAt || 0).getTime();
      const tombTime = new Date(tomb.deletedAt).getTime();
      return tombTime >= itemTime;
    };

    // 2. Слияние завершенных задач (Архив)
    const completedMap = new Map();
    lComp.forEach(t => {
      if (!isItemDeleted(t)) completedMap.set(t.id, { ...t });
    });
    lComp.forEach(lTask => {
      if (!isItemDeleted(lTask)) {
        const rTask = rComp.find(r => r.id === lTask.id);
        if (!rTask) remoteNeedsUpdate = true;
      }
    });

    rComp.forEach(rTask => {
      if (isItemDeleted(rTask)) {
        if (completedMap.has(rTask.id)) {
          completedMap.delete(rTask.id);
          localNeedsUpdate = true;
        }
        return;
      }
      if (!completedMap.has(rTask.id)) {
        completedMap.set(rTask.id, { ...rTask });
        localNeedsUpdate = true;
      } else {
        const lTask = completedMap.get(rTask.id);
        const lTime = new Date(lTask.updatedAt || lTask.completedAt || lTask.createdAt || 0).getTime();
        const rTime = new Date(rTask.updatedAt || rTask.completedAt || rTask.createdAt || 0).getTime();
        if (rTime > lTime) {
          completedMap.set(rTask.id, { ...rTask });
          localNeedsUpdate = true;
        } else if (lTime > rTime) {
          remoteNeedsUpdate = true;
        }
      }
    });

    // 3. Слияние активных задач
    const taskMap = new Map();
    lTasks.forEach(t => {
      // Если задача уже в архиве или удалена — не добавляем в активные
      if (!isItemDeleted(t) && !completedMap.has(t.id)) {
        taskMap.set(t.id, { ...t });
      } else if (completedMap.has(t.id)) {
        localNeedsUpdate = true;
      }
    });

    lTasks.forEach(lTask => {
      if (!isItemDeleted(lTask) && !completedMap.has(lTask.id)) {
        const rTask = rTasks.find(r => r.id === lTask.id);
        if (!rTask) remoteNeedsUpdate = true;
      }
    });

    rTasks.forEach(rTask => {
      if (isItemDeleted(rTask) || completedMap.has(rTask.id)) {
        if (taskMap.has(rTask.id)) {
          taskMap.delete(rTask.id);
          localNeedsUpdate = true;
        }
        return;
      }

      if (!taskMap.has(rTask.id)) {
        taskMap.set(rTask.id, { ...rTask });
        localNeedsUpdate = true;
      } else {
        const lTask = taskMap.get(rTask.id);
        const lTime = new Date(lTask.updatedAt || lTask.createdAt || 0).getTime();
        const rTime = new Date(rTask.updatedAt || rTask.createdAt || 0).getTime();

        if (rTime > lTime) {
          taskMap.set(rTask.id, { ...rTask });
          localNeedsUpdate = true;
        } else if (lTime > rTime) {
          remoteNeedsUpdate = true;
        } else {
          // Время совпадает — аккуратно мержим прогресс времени и подпункты
          const maxSec = Math.max(lTask.timeSpentSeconds || 0, rTask.timeSpentSeconds || 0);
          if (lTask.timeSpentSeconds !== maxSec) {
            lTask.timeSpentSeconds = maxSec;
            localNeedsUpdate = true;
          }
          if (rTask.timeSpentSeconds !== maxSec) {
            remoteNeedsUpdate = true;
          }
        }
      }
    });

    // 4. Слияние журнала сессий времени (Time Logs)
    const logMap = new Map();
    lLogs.forEach(l => logMap.set(l.id, l));
    rLogs.forEach(rLog => {
      if (!logMap.has(rLog.id)) {
        logMap.set(rLog.id, rLog);
        localNeedsUpdate = true;
      }
    });
    if (logMap.size > lLogs.length) localNeedsUpdate = true;
    if (logMap.size > rLogs.length) remoteNeedsUpdate = true;

    // 5. Слияние разделов и деревьев проектов
    const secMap = new Map();
    lSections.forEach(s => secMap.set(s.id, JSON.parse(JSON.stringify(s))));

    rSections.forEach(rSec => {
      if (isItemDeleted(rSec)) {
        if (secMap.has(rSec.id)) {
          secMap.delete(rSec.id);
          localNeedsUpdate = true;
        }
        return;
      }

      if (!secMap.has(rSec.id)) {
        secMap.set(rSec.id, JSON.parse(JSON.stringify(rSec)));
        localNeedsUpdate = true;
      } else {
        const lSec = secMap.get(rSec.id);
        const lTime = new Date(lSec.updatedAt || 0).getTime();
        const rTime = new Date(rSec.updatedAt || 0).getTime();
        if (rTime > lTime) {
          lSec.name = rSec.name;
          lSec.icon = rSec.icon;
          lSec.updatedAt = rSec.updatedAt;
          localNeedsUpdate = true;
        } else if (lTime > rTime) {
          remoteNeedsUpdate = true;
        }
        // Рекурсивно мержим папки внутри раздела
        const mergedProjs = this.mergeFolderTrees(lSec.projects || [], rSec.projects || [], isItemDeleted);
        lSec.projects = mergedProjs.folders;
        if (mergedProjs.localChanged) localNeedsUpdate = true;
        if (mergedProjs.remoteChanged) remoteNeedsUpdate = true;
      }
    });

    // 6. Слияние автономных напоминаний (Reminders)
    const lReminders = Array.isArray(local.reminders) ? local.reminders : [];
    const rReminders = Array.isArray(remote.reminders) ? remote.reminders : [];
    const remMap = new Map();

    lReminders.forEach(r => {
      if (!isItemDeleted(r)) remMap.set(r.id, { ...r });
    });

    lReminders.forEach(lRem => {
      if (!isItemDeleted(lRem)) {
        const rRem = rReminders.find(r => r.id === lRem.id);
        if (!rRem) remoteNeedsUpdate = true;
      }
    });

    rReminders.forEach(rRem => {
      if (isItemDeleted(rRem)) {
        if (remMap.has(rRem.id)) {
          remMap.delete(rRem.id);
          localNeedsUpdate = true;
        }
        return;
      }

      if (!remMap.has(rRem.id)) {
        remMap.set(rRem.id, { ...rRem });
        localNeedsUpdate = true;
      } else {
        const lRem = remMap.get(rRem.id);
        const lTime = new Date(lRem.updatedAt || lRem.createdAt || 0).getTime();
        const rTime = new Date(rRem.updatedAt || rRem.createdAt || 0).getTime();
        if (rTime > lTime) {
          remMap.set(rRem.id, { ...rRem });
          localNeedsUpdate = true;
        } else if (lTime > rTime) {
          remoteNeedsUpdate = true;
        }
      }
    });

    // Настройки: сохраняем локальные + конфигурацию WebDAV
    const activeWebdav = (local.settings && local.settings.webdav && local.settings.webdav.username)
      ? local.settings.webdav
      : this.getWebdavConfig();

    const mergedSettings = {
      ...(remote.settings || {}),
      ...(local.settings || {}),
      webdav: activeWebdav
    };

    const mergedData = {
      sections: Array.from(secMap.values()),
      tasks: Array.from(taskMap.values()),
      completedTasks: Array.from(completedMap.values()),
      timeLogs: Array.from(logMap.values()),
      reminders: Array.from(remMap.values()),
      deletedTombstones: mergedTombs,
      settings: mergedSettings,
      lastSyncedAt: new Date().toISOString()
    };

    return {
      mergedData,
      localNeedsUpdate,
      remoteNeedsUpdate
    };
  },

  mergeFolderTrees(lFolders, rFolders, isItemDeleted) {
    let localChanged = false;
    let remoteChanged = false;
    const fMap = new Map();

    lFolders.forEach(f => {
      if (!isItemDeleted(f)) fMap.set(f.id, JSON.parse(JSON.stringify(f)));
    });

    rFolders.forEach(rF => {
      if (isItemDeleted(rF)) {
        if (fMap.has(rF.id)) {
          fMap.delete(rF.id);
          localChanged = true;
        }
        return;
      }

      if (!fMap.has(rF.id)) {
        fMap.set(rF.id, JSON.parse(JSON.stringify(rF)));
        localChanged = true;
      } else {
        const lF = fMap.get(rF.id);
        const lTime = new Date(lF.updatedAt || 0).getTime();
        const rTime = new Date(rF.updatedAt || 0).getTime();
        if (rTime > lTime) {
          lF.name = rF.name;
          lF.icon = rF.icon;
          lF.updatedAt = rF.updatedAt;
          localChanged = true;
        } else if (lTime > rTime) {
          remoteChanged = true;
        }
        // Рекурсивное слияние подпапок
        const subRes = this.mergeFolderTrees(lF.children || [], rF.children || [], isItemDeleted);
        lF.children = subRes.folders;
        if (subRes.localChanged) localChanged = true;
        if (subRes.remoteChanged) remoteChanged = true;
      }
    });

    return {
      folders: Array.from(fMap.values()),
      localChanged,
      remoteChanged
    };
  }
};

window.SyncEngine = SyncEngine;
