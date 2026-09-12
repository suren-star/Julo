/**
 * Julo SyncEngine
 *
 * Cloud synchronization is intentionally provider-agnostic.
 * No cloud provider is bundled or enabled in the current beta baseline.
 * A future provider may register itself through registerProvider().
 */
const SyncEngine = {
  status: 'disabled',
  lastSyncTime: null,
  lastError: null,
  isSyncInProgress: false,
  debounceTimer: null,
  listeners: new Set(),
  provider: null,

  init() {
    this.disableLegacyCloudUI();
    this.updateStatus(this.isConfiguredAndEnabled() ? 'idle' : 'disabled');

    window.addEventListener('focus', () => {
      if (this.isConfiguredAndEnabled()) this.scheduleAutoSync(1200);
    });

    window.addEventListener('online', () => {
      if (this.isConfiguredAndEnabled()) this.scheduleAutoSync(500);
    });
  },

  registerProvider(provider) {
    if (!provider || typeof provider.sync !== 'function') {
      throw new Error('Invalid sync provider: sync() is required');
    }
    this.provider = provider;
    this.updateStatus(this.isConfiguredAndEnabled() ? 'idle' : 'disabled');
  },

  unregisterProvider() {
    this.provider = null;
    this.updateStatus('disabled');
  },

  subscribe(callback) {
    this.listeners.add(callback);
    callback(this.getStatusInfo());
    return () => this.listeners.delete(callback);
  },

  notifyListeners() {
    const info = this.getStatusInfo();
    this.listeners.forEach((callback) => {
      try {
        callback(info);
      } catch (error) {
        console.error('SyncEngine subscriber error:', error);
      }
    });
  },

  getStatusInfo() {
    return {
      status: this.status,
      lastSyncTime: this.lastSyncTime,
      lastError: this.lastError,
      isEnabled: this.isConfiguredAndEnabled(),
      providerId: this.provider?.id || null
    };
  },

  updateStatus(status, error = null) {
    this.status = status;
    this.lastError = error;
    if (status === 'success') {
      this.lastSyncTime = new Date().toISOString();
      this.lastError = null;
    }
    this.notifyListeners();
  },

  isConfiguredAndEnabled() {
    if (!this.provider) return false;
    if (typeof this.provider.isConfigured === 'function') {
      try {
        return !!this.provider.isConfigured(window.App?.data || null);
      } catch (error) {
        console.error('Sync provider configuration check failed:', error);
        return false;
      }
    }
    return true;
  },

  async testConnection() {
    if (!this.provider) {
      return {
        success: false,
        disabled: true,
        error: 'Cloud sync provider is not configured in this Julo beta.'
      };
    }
    if (typeof this.provider.testConnection !== 'function') {
      return { success: true };
    }
    return await this.provider.testConnection({ data: window.App?.data || null });
  },

  scheduleAutoSync(delayMs = 2500) {
    if (!this.isConfiguredAndEnabled()) return;
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.sync({ silent: true }), delayMs);
  },

  recordTombstone(id, type) {
    if (!window.App?.data || !id) return;
    if (!Array.isArray(window.App.data.deletedTombstones)) {
      window.App.data.deletedTombstones = [];
    }

    window.App.data.deletedTombstones.push({
      id,
      type,
      deletedAt: new Date().toISOString()
    });

    if (window.App.data.deletedTombstones.length > 200) {
      window.App.data.deletedTombstones = window.App.data.deletedTombstones.slice(-200);
    }
  },

  async sync(options = {}) {
    const { force = false, silent = false } = options;

    if (!this.provider) {
      this.updateStatus('disabled');
      return {
        success: false,
        disabled: true,
        error: 'Cloud sync is reserved for a future provider and is currently disabled.'
      };
    }

    if (!force && !this.isConfiguredAndEnabled()) {
      this.updateStatus('disabled');
      return { success: false, disabled: true, error: 'Cloud sync is disabled.' };
    }

    if (this.isSyncInProgress) {
      return { success: true, pending: true };
    }

    this.isSyncInProgress = true;
    this.updateStatus('syncing');

    try {
      const result = await this.provider.sync({
        data: window.App?.data || null,
        force,
        silent
      });

      if (!result || result.success === false) {
        throw new Error(result?.error || 'Cloud sync failed.');
      }

      if (result.data && window.App) {
        window.App.data = result.data;
        await window.Storage.save(result.data);

        if (typeof window.App.normalizeAllData === 'function') window.App.normalizeAllData();
        if (typeof window.App.renderSidebar === 'function') window.App.renderSidebar();
        if (typeof window.App.populateProjectSelects === 'function') window.App.populateProjectSelects();
        if (typeof window.App.renderCurrentView === 'function') window.App.renderCurrentView();
        if (typeof window.App.updateBadges === 'function') window.App.updateBadges();
      }

      this.updateStatus('success');
      return { success: true, ...(result || {}) };
    } catch (error) {
      console.error('Cloud sync failed:', error);
      this.updateStatus('error', error.message);
      return { success: false, error: error.message };
    } finally {
      this.isSyncInProgress = false;
    }
  },

  disableLegacyCloudUI() {
    const hide = (selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        element.style.display = 'none';
        element.setAttribute('aria-hidden', 'true');
      });
    };

    hide('#sidebar-sync-btn');
    hide('#tab-btn-webdav');
    hide('#settings-panel-webdav');
    hide('#topic-webdav');
    hide('.btn-help-nav[onclick*="topic-webdav"]');

    const cloudFolderInput = document.getElementById('modal-vault-cloud-folder');
    if (cloudFolderInput) {
      const wrapper = cloudFolderInput.closest('.form-group') || cloudFolderInput.parentElement;
      if (wrapper) wrapper.style.display = 'none';
    }
  }
};

window.SyncEngine = SyncEngine;
