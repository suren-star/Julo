/**
 * storage.js — Модуль взаимодействия с хранилищем (Electron IPC + fallback на localStorage)
 */
const Storage = {
  // Загрузка данных активной базы
  async load() {
    if (window.electronAPI && window.electronAPI.getData) {
      try {
        const electronData = await window.electronAPI.getData();
        if (electronData) {
          if (electronData.settings?.theme) {
            try { localStorage.setItem('planer_theme', electronData.settings.theme); } catch (e) {}
          }
          return electronData;
        }
      } catch (e) {
        console.error('Ошибка загрузки из Electron:', e);
      }
    }

    // Fallback только для браузерного режима (без Electron)
    try {
      const local = localStorage.getItem('planer_tasks_data');
      if (local) {
        return JSON.parse(local);
      }
    } catch (e) {
      console.error('Ошибка парсинга localStorage:', e);
    }

    return null;
  },

  // Сохранение данных активной базы
  async save(data) {
    if (data?.settings?.theme) {
      try { localStorage.setItem('planer_theme', data.settings.theme); } catch (e) {}
    }

    if (window.electronAPI && window.electronAPI.saveData) {
      try {
        await window.electronAPI.saveData(data);
      } catch (e) {
        console.error('Ошибка сохранения в Electron:', e);
      }
    } else {
      try {
        localStorage.setItem('planer_tasks_data', JSON.stringify(data));
      } catch (e) {}
    }
  },

  // Экспорт бэкапа
  async exportBackup(data) {
    if (window.electronAPI && window.electronAPI.exportBackup) {
      return await window.electronAPI.exportBackup(data);
    }
    // Web fallback: скачать файл
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `julo_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    return { success: true };
  },

  // Импорт бэкапа
  async importBackup() {
    if (window.electronAPI && window.electronAPI.importBackup) {
      return await window.electronAPI.importBackup();
    }
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return resolve({ canceled: true });
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target.result);
            resolve({ success: true, data });
          } catch (err) {
            resolve({ success: false, error: err.message });
          }
        };
        reader.readAsText(file);
      };
      input.click();
    });
  },

  // Открыть папку бэкапов
  async openBackupFolder() {
    if (window.electronAPI && window.electronAPI.openBackupFolder) {
      await window.electronAPI.openBackupFolder();
    }
  },

  // Управление мульти-базами (Vaults)
  async getVaultsRegistry() {
    if (window.electronAPI && window.electronAPI.getVaultsRegistry) {
      return await window.electronAPI.getVaultsRegistry();
    }
    return {
      activeVaultId: 'vault-default',
      vaults: [
        { id: 'vault-default', name: 'Основная база', icon: '💼', color: '#4f6ef7', filePath: 'tasks_data.json', exists: true, taskCount: 0 }
      ]
    };
  },

  async switchVault(vaultId) {
    if (window.electronAPI && window.electronAPI.switchVault) {
      return await window.electronAPI.switchVault(vaultId);
    }
    return { success: false, error: 'Доступно только в приложении' };
  },

  async createVault(payload) {
    if (window.electronAPI && window.electronAPI.createVault) {
      return await window.electronAPI.createVault(payload);
    }
    return { success: false, error: 'Доступно только в приложении' };
  },

  async openVaultFromFile() {
    if (window.electronAPI && window.electronAPI.openVaultFromFile) {
      return await window.electronAPI.openVaultFromFile();
    }
    return { success: false, error: 'Доступно только в приложении' };
  },

  async changeVaultPath(payload) {
    if (window.electronAPI && window.electronAPI.changeVaultPath) {
      return await window.electronAPI.changeVaultPath(payload);
    }
    return { success: false, error: 'Доступно только в приложении' };
  },

  async changeVaultMeta(payload) {
    if (window.electronAPI && window.electronAPI.changeVaultMeta) {
      return await window.electronAPI.changeVaultMeta(payload);
    }
    return { success: false, error: 'Доступно только в приложении' };
  },

  async deleteVault(payload) {
    if (window.electronAPI && window.electronAPI.deleteVault) {
      return await window.electronAPI.deleteVault(payload);
    }
    return { success: false, error: 'Доступно только в приложении' };
  },

  async chooseVaultFilePath(defaultName) {
    if (window.electronAPI && window.electronAPI.chooseVaultFilePath) {
      return await window.electronAPI.chooseVaultFilePath(defaultName);
    }
    return { canceled: true };
  }
};

window.Storage = Storage;
