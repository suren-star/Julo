const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getData: () => ipcRenderer.invoke('get-data'),
  saveData: (data) => ipcRenderer.invoke('save-data', data),
  showNotification: (payload) => ipcRenderer.invoke('show-notification', payload),
  exportBackup: (data) => ipcRenderer.invoke('export-backup', data),
  importBackup: () => ipcRenderer.invoke('import-backup'),
  openBackupFolder: () => ipcRenderer.invoke('open-backup-folder'),
  bringToFront: () => ipcRenderer.invoke('bring-to-front'),
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  registerGlobalShortcut: (payload) => ipcRenderer.invoke('register-global-shortcut', payload),
  getGlobalShortcutStatus: () => ipcRenderer.invoke('get-global-shortcut-status'),
  setMinimizeToTray: (enabled) => ipcRenderer.invoke('set-minimize-to-tray', enabled),
  setAutostartWindows: (enabled) => ipcRenderer.invoke('set-autostart-windows', enabled),
  getAutostartStatus: () => ipcRenderer.invoke('get-autostart-status'),
  openExternalUrl: (url) => ipcRenderer.invoke('open-external-url', url),
  openLocalPath: (itemPath) => ipcRenderer.invoke('open-local-path', itemPath),
  selectLocalFolder: () => ipcRenderer.invoke('select-local-folder'),
  selectLocalFile: () => ipcRenderer.invoke('select-local-file'),
  selectImageFile: () => ipcRenderer.invoke('select-image-file'),
  fetchUrlTitle: (url) => ipcRenderer.invoke('fetch-url-title', url),
  getVaultsRegistry: () => ipcRenderer.invoke('get-vaults-registry'),
  switchVault: (vaultId) => ipcRenderer.invoke('switch-vault', vaultId),
  createVault: (payload) => ipcRenderer.invoke('create-vault', payload),
  openVaultFromFile: () => ipcRenderer.invoke('open-vault-from-file'),
  changeVaultPath: (payload) => ipcRenderer.invoke('change-vault-path', payload),
  changeVaultMeta: (payload) => ipcRenderer.invoke('change-vault-meta', payload),
  deleteVault: (payload) => ipcRenderer.invoke('delete-vault', payload),
  chooseVaultFilePath: (defaultName) => ipcRenderer.invoke('choose-vault-file-path', defaultName),
  onTriggerQuickCapture: (callback) => {
    ipcRenderer.on('trigger-quick-capture', (event, data) => callback(data));
  },
  onOpenQuickCapture: (callback) => {
    ipcRenderer.on('open-quick-capture', (event, data) => callback(data));
  },
  onTriggerBreakToggle: (callback) => {
    ipcRenderer.on('trigger-break-toggle', () => callback());
  }
});
