const { app, BrowserWindow, ipcMain, Notification, dialog, shell, globalShortcut, Tray, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const { migrateDataSchema } = require('./lib/data-migrations');
const { rewriteVaultRegistryPaths } = require('./lib/profile-migration');

const JULO_PROFILE_DIR = 'Julo';
const LEGACY_PROFILE_DIRS = ['planer', 'Planer'];

function copyDirectoryIfPresent(source, target) {
  if (!fs.existsSync(source)) return false;
  fs.mkdirSync(target, { recursive: true });
  fs.cpSync(source, target, { recursive: true, force: false, errorOnExist: false });
  return true;
}

function configureJuloProfile() {
  const appDataDir = app.getPath('appData');
  const juloUserDataDir = path.join(appDataDir, JULO_PROFILE_DIR);
  fs.mkdirSync(juloUserDataDir, { recursive: true });
  const markerPath = path.join(juloUserDataDir, '.profile-migration-v1.json');

  if (!fs.existsSync(markerPath)) {
    let migratedFrom = null;
    for (const legacyName of LEGACY_PROFILE_DIRS) {
      const legacyUserDataDir = path.join(appDataDir, legacyName);
      if (path.resolve(legacyUserDataDir) === path.resolve(juloUserDataDir) || !fs.existsSync(legacyUserDataDir)) continue;

      const legacyDataDir = path.join(legacyUserDataDir, 'data');
      const juloDataDir = path.join(juloUserDataDir, 'data');
      copyDirectoryIfPresent(legacyDataDir, juloDataDir);
      copyDirectoryIfPresent(path.join(legacyUserDataDir, 'backup'), path.join(juloUserDataDir, 'backup'));
      copyDirectoryIfPresent(path.join(legacyUserDataDir, 'Local Storage'), path.join(juloUserDataDir, 'Local Storage'));

      const registryPath = path.join(juloDataDir, 'vaults_registry.json');
      if (fs.existsSync(registryPath)) {
        try {
          const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
          const rewritten = rewriteVaultRegistryPaths(registry, legacyDataDir, juloDataDir, process.platform);
          fs.writeFileSync(registryPath, JSON.stringify(rewritten, null, 2), 'utf8');
        } catch (error) {
          console.warn('Julo profile migration: failed to rewrite vault registry paths:', error);
        }
      }

      migratedFrom = legacyUserDataDir;
      break;
    }

    fs.writeFileSync(markerPath, JSON.stringify({
      version: 1,
      migratedAt: new Date().toISOString(),
      migratedFrom
    }, null, 2), 'utf8');
  }

  app.setPath('userData', juloUserDataDir);
  app.setPath('sessionData', juloUserDataDir);
  app.setName('Julo');
}

configureJuloProfile();

let mainWindow;
let tray = null;
let isQuitting = false;
let currentRegisteredShortcut = null;
let isShortcutEnabled = true;
let minimizeToTray = true;

// Надежные пути к файлам данных в постоянном профиле пользователя (AppData)
function getDataFilePath() {
  try {
    const userDataDir = app.getPath('userData');
    const userPlanerDir = path.join(userDataDir, 'data');
    if (!fs.existsSync(userPlanerDir)) {
      fs.mkdirSync(userPlanerDir, { recursive: true });
    }
    return path.join(userPlanerDir, 'tasks_data.json');
  } catch (e) {
    return path.join(__dirname, 'data', 'tasks_data.json');
  }
}

function getVaultsRegistryPath() {
  try {
    const userDataDir = app.getPath('userData');
    const userPlanerDir = path.join(userDataDir, 'data');
    if (!fs.existsSync(userPlanerDir)) {
      fs.mkdirSync(userPlanerDir, { recursive: true });
    }
    return path.join(userPlanerDir, 'vaults_registry.json');
  } catch (e) {
    return path.join(__dirname, 'data', 'vaults_registry.json');
  }
}

function loadVaultsRegistry() {
  const regPath = getVaultsRegistryPath();
  const defaultFilePath = getDataFilePath();

  let registry = null;
  if (fs.existsSync(regPath)) {
    try {
      registry = JSON.parse(fs.readFileSync(regPath, 'utf8'));
    } catch (e) {}
  }

  if (!registry || !Array.isArray(registry.vaults) || registry.vaults.length === 0) {
    registry = {
      activeVaultId: 'vault-default',
      vaults: [
        {
          id: 'vault-default',
          name: 'Основная база',
          icon: '💼',
          color: '#4f6ef7',
          filePath: defaultFilePath,
          createdAt: new Date().toISOString()
        }
      ]
    };
    saveVaultsRegistry(registry);
  }

  if (!registry.vaults.find(v => v.id === registry.activeVaultId)) {
    registry.activeVaultId = registry.vaults[0].id;
  }

  return registry;
}

// =========================================================================
// БЕЗОПАСНОСТЬ ДАННЫХ: АТОМАРНАЯ ЗАПИСЬ И ЛОКАЛЬНЫЕ РЕЗЕРВНЫЕ КОПИИ
// =========================================================================

function atomicWriteJsonSync(targetPath, data, { createBackup = true } = {}) {
  const dir = path.dirname(targetPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const jsonContent = JSON.stringify(data, null, 2);
  const tempPath = targetPath + '.tmp_' + Date.now();
  const backupPath = targetPath + '.bak';

  // 1. Запись во временный файл
  fs.writeFileSync(tempPath, jsonContent, 'utf8');

  // 2. Создание резервной копии .bak существующего валидного файла
  if (createBackup && fs.existsSync(targetPath)) {
    try {
      const stats = fs.statSync(targetPath);
      if (stats.size > 20) {
        fs.copyFileSync(targetPath, backupPath);
      }
    } catch (e) {}
  }

  // 3. Атомарная замена целевого файла
  try {
    if (process.platform === 'win32') {
      try {
        fs.renameSync(tempPath, targetPath);
      } catch (renameErr) {
        fs.copyFileSync(tempPath, targetPath);
        try { fs.unlinkSync(tempPath); } catch (e) {}
      }
    } else {
      fs.renameSync(tempPath, targetPath);
    }
  } catch (err) {
    try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch (e) {}
    throw err;
  }
}

function migrateStoredData(targetFile, rawData) {
  const { data, changed } = migrateDataSchema(rawData);
  if (changed) atomicWriteJsonSync(targetFile, data, { createBackup: false });

  const backupPath = targetFile + '.bak';
  if (fs.existsSync(backupPath)) {
    try {
      const migratedBackup = migrateDataSchema(JSON.parse(fs.readFileSync(backupPath, 'utf8')));
      if (migratedBackup.changed) {
        atomicWriteJsonSync(backupPath, migratedBackup.data, { createBackup: false });
      }
    } catch (error) {}
  }

  return data;
}

function readAndMigrateDataFile(targetFile) {
  return migrateStoredData(targetFile, JSON.parse(fs.readFileSync(targetFile, 'utf8')));
}

function saveVaultsRegistry(registry) {
  try {
    const regPath = getVaultsRegistryPath();
    atomicWriteJsonSync(regPath, registry);
  } catch (e) {
    console.error('Ошибка сохранения реестра баз данных:', e);
  }
}

function getActiveVault() {
  const reg = loadVaultsRegistry();
  return reg.vaults.find(v => v.id === reg.activeVaultId) || reg.vaults[0];
}

function getActiveVaultFilePath() {
  const vault = getActiveVault();
  if (vault && vault.filePath) {
    const dir = path.dirname(vault.filePath);
    if (!fs.existsSync(dir)) {
      try { fs.mkdirSync(dir, { recursive: true }); } catch (e) {}
    }
    return vault.filePath;
  }
  return getDataFilePath();
}

function getBackupDir() {
  try {
    const userDataDir = app.getPath('userData');
    const userBackupDir = path.join(userDataDir, 'backup');
    if (!fs.existsSync(userBackupDir)) {
      fs.mkdirSync(userBackupDir, { recursive: true });
    }
    return userBackupDir;
  } catch (e) {
    return path.join(__dirname, 'backup');
  }
}

// Данные по умолчанию при первом запуске
const defaultData = migrateDataSchema({
  sections: [
    {
      id: 'work',
      name: 'Рабочие задачи',
      icon: '💼',
      collapsed: false,
      projects: [
        { id: 'proj-work-general', name: 'Общие рабочие' },
        { id: 'proj-work-clients', name: 'Проекты / Клиенты' }
      ]
    },
    {
      id: 'personal',
      name: 'Личные задачи',
      icon: '🏠',
      collapsed: false,
      projects: [
        { id: 'proj-pers-home', name: 'Дом и Быт' },
        { id: 'proj-pers-health', name: 'Здоровье и Спорт' }
      ]
    }
  ],
  tasks: [
    {
      id: 'task-welcome-1',
      title: 'Ознакомиться с новым планером',
      sectionId: 'work',
      projectId: 'proj-work-general',
      completed: false,
      createdAt: new Date().toISOString(),
      reminderTime: null,
      timeSpentSeconds: 0,
      order: 1
    },
    {
      id: 'task-welcome-2',
      title: 'Попробовать запустить таймер (кнопка Play)',
      sectionId: 'work',
      projectId: 'proj-work-general',
      completed: false,
      createdAt: new Date().toISOString(),
      reminderTime: null,
      timeSpentSeconds: 0,
      order: 2
    }
  ],
  completedTasks: [
    {
      id: 'task-demo-done',
      title: 'Создать персональный планер',
      sectionId: 'work',
      projectId: 'proj-work-general',
      completed: true,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      completedAt: new Date().toISOString(),
      reminderTime: null,
      timeSpentSeconds: 1800
    }
  ],
  settings: {
    theme: 'warm',
    soundEnabled: true,
    sync: { enabled: false, provider: null }
  }
}).data;

function createTray() {
  if (tray) return;

  const iconPath = path.join(__dirname, 'src', 'assets', 'icon.png');
  tray = new Tray(iconPath);
  tray.setToolTip('Julo — Персональный менеджер задач');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '📖 Открыть Julo',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          if (mainWindow.isMinimized()) mainWindow.restore();
          mainWindow.focus();
        }
      }
    },
    {
      label: '⚡ Быстрое добавление задачи',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          if (mainWindow.isMinimized()) mainWindow.restore();
          mainWindow.focus();
          mainWindow.webContents.send('open-quick-capture', { wasMinimized: false });
        }
      }
    },
    {
      label: '☕ Начать перерыв / отдых',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          if (mainWindow.isMinimized()) mainWindow.restore();
          mainWindow.focus();
          mainWindow.webContents.send('trigger-break-toggle');
        }
      }
    },
    { type: 'separator' },
    {
      label: '❌ Выход из программы',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        if (mainWindow.isMinimized()) {
          mainWindow.restore();
          mainWindow.focus();
        } else {
          mainWindow.focus();
        }
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });

  tray.on('click', () => {
    if (mainWindow && !mainWindow.isVisible()) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 950,
    minHeight: 600,
    title: 'Julo',
    icon: path.join(__dirname, 'src', 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    backgroundColor: '#fbf9f4',
    show: false
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.focus();
    }
  });

  mainWindow.on('restore', () => {
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.focus();
    }
  });

  mainWindow.on('close', (event) => {
    if (!isQuitting && minimizeToTray) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
  });

  // Убираем стандартное меню для аккуратного современного вида
  mainWindow.setMenuBarVisibility(false);

  // Перехват всех внешних ссылок и открытие в браузере по умолчанию Windows
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:'))) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url && url !== mainWindow.webContents.getURL() && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:'))) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
}

// Загрузка данных активной базы
ipcMain.handle('get-data', async () => {
  try {
    const activeVault = getActiveVault();
    const targetFile = getActiveVaultFilePath();

    if (fs.existsSync(targetFile)) {
      try {
        const parsed = readAndMigrateDataFile(targetFile);
        if (parsed) return { ...parsed, _vaultInfo: activeVault };
      } catch (parseErr) {
        console.error('Целевой файл базы поврежден, пробуем восстановить из .bak:', parseErr);
        const backupPath = targetFile + '.bak';
        if (fs.existsSync(backupPath)) {
          try {
            const bakContent = fs.readFileSync(backupPath, 'utf8');
            const bakParsed = migrateDataSchema(JSON.parse(bakContent)).data;
            if (bakParsed) { atomicWriteJsonSync(targetFile, bakParsed, { createBackup: false }); return { ...bakParsed, _vaultInfo: activeVault }; }
          } catch (bakErr) {
            console.error('Ошибка восстановления из .bak файла:', bakErr);
          }
        }
      }
    }

    // Если в AppData файла еще нет или он пустой, проверяем локальный каталог приложения
    const localDataPath = path.join(__dirname, 'data', 'tasks_data.json');
    if (activeVault.id === 'vault-default' && fs.existsSync(localDataPath)) {
      try {
        const content = fs.readFileSync(localDataPath, 'utf8');
        const parsed = JSON.parse(content);
        if (parsed && (parsed.tasks?.length > 0 || parsed.sections?.length > 0 || parsed.completedTasks?.length > 0)) {
          const migrated = migrateDataSchema(parsed).data;
          atomicWriteJsonSync(targetFile, migrated, { createBackup: false });
          return { ...migrated, _vaultInfo: activeVault };
        }
      } catch (e) {}
    }

    atomicWriteJsonSync(targetFile, defaultData);
    return { ...defaultData, _vaultInfo: activeVault };
  } catch (err) {
    console.error('Ошибка чтения данных базы:', err);
    return { ...defaultData, _vaultInfo: getActiveVault() };
  }
});

// Сохранение данных активной базы
ipcMain.handle('save-data', async (event, data) => {
  try {
    const targetFile = getActiveVaultFilePath();
    const dataToSave = migrateDataSchema(data).data;
    atomicWriteJsonSync(targetFile, dataToSave);
    return { success: true };
  } catch (err) {
    console.error('Ошибка записи данных базы:', err);
    return { success: false, error: err.message };
  }
});

// =========================================================================
// Управление мульти-базами (Vaults / Profiles)
// =========================================================================

// 1. Получить реестр баз данных
ipcMain.handle('get-vaults-registry', async () => {
  const reg = loadVaultsRegistry();
  const enrichedVaults = reg.vaults.map(v => {
    let exists = false;
    let taskCount = 0;
    try {
      if (fs.existsSync(v.filePath)) {
        exists = true;
        const raw = fs.readFileSync(v.filePath, 'utf8');
        const parsed = JSON.parse(raw);
        taskCount = (parsed.tasks || []).filter(t => !t.completed).length;
      }
    } catch (e) {}
    return {
      ...v,
      exists,
      taskCount
    };
  });

  return {
    activeVaultId: reg.activeVaultId,
    vaults: enrichedVaults
  };
});

// 2. Переключить активную базу
ipcMain.handle('switch-vault', async (event, targetVaultId) => {
  try {
    const reg = loadVaultsRegistry();
    const targetVault = reg.vaults.find(v => v.id === targetVaultId);
    if (!targetVault) {
      return { success: false, error: 'База данных не найдена' };
    }

    reg.activeVaultId = targetVaultId;
    saveVaultsRegistry(reg);

    const targetFile = targetVault.filePath;
    let data = defaultData;
    if (fs.existsSync(targetFile)) {
      data = readAndMigrateDataFile(targetFile);
    } else {
      const dir = path.dirname(targetFile);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      atomicWriteJsonSync(targetFile, defaultData);
    }

    if (mainWindow) {
      mainWindow.setTitle('Julo');
    }

    return {
      success: true,
      activeVaultId: targetVaultId,
      vaultInfo: targetVault,
      data: { ...data, _vaultInfo: targetVault }
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// 3. Создать новую базу данных
ipcMain.handle('create-vault', async (event, { name, icon, color, customFilePath }) => {
  try {
    const reg = loadVaultsRegistry();
    const vaultId = 'vault-' + Date.now();
    
    let filePath = customFilePath;
    if (filePath) {
      const norm = path.normalize(filePath);
      if (norm.startsWith('\\\\') || norm.startsWith('//')) {
        return { success: false, error: 'Сетевые UNC-пути не поддерживаются в целях безопасности' };
      }
      if (path.extname(norm).toLowerCase() !== '.json') {
        return { success: false, error: 'Файл базы данных должен иметь расширение .json' };
      }
      filePath = norm;
    } else {
      const userDataDir = app.getPath('userData');
      const dataDir = path.join(userDataDir, 'data');
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      filePath = path.join(dataDir, `vault_${vaultId}.json`);
    }

    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const initialData = {
      sections: [
        {
          id: 'sec-work-' + Date.now(),
          name: 'Рабочие задачи',
          icon: '💼',
          collapsed: false,
          projects: [
            { id: 'proj-work-' + Date.now(), name: 'Основной список' }
          ]
        },
        {
          id: 'sec-pers-' + Date.now(),
          name: 'Личные дела',
          icon: '🏠',
          collapsed: false,
          projects: [
            { id: 'proj-pers-' + Date.now(), name: 'Дом и Быт' }
          ]
        }
      ],
      tasks: [],
      completedTasks: [],
      timeLogs: [],
      reminders: [],
      settings: {
        theme: 'warm',
        soundEnabled: true,
        soundTone: 'digital',
        defaultSubtasksExpanded: 'collapsed',
        remindersInArchive: false,
        sync: { enabled: false, provider: null }
      }
    };

    const migratedInitialData = migrateDataSchema(initialData).data;
    atomicWriteJsonSync(filePath, migratedInitialData);

    const newVault = {
      id: vaultId,
      name: name || 'Новая база',
      icon: icon || '📁',
      color: color || '#4f6ef7',
      filePath: filePath,
      createdAt: new Date().toISOString()
    };

    reg.vaults.push(newVault);
    reg.activeVaultId = vaultId;
    saveVaultsRegistry(reg);

    if (mainWindow) {
      mainWindow.setTitle('Julo');
    }

    return {
      success: true,
      vaultInfo: newVault,
      data: { ...migratedInitialData, _vaultInfo: newVault }
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// 4. Открыть существующий .json файл как базу данных
ipcMain.handle('open-vault-from-file', async () => {
  try {
    const res = await dialog.showOpenDialog(mainWindow, {
      title: 'Выберите файл базы данных Julo (*.json)',
      filters: [
        { name: 'База данных Julo (*.json)', extensions: ['json'] },
        { name: 'Все файлы (*.*)', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (res.canceled || !res.filePaths || res.filePaths.length === 0) {
      return { canceled: true };
    }

    const selectedPath = res.filePaths[0];
    const parsed = readAndMigrateDataFile(selectedPath);

    const baseName = path.basename(selectedPath, '.json');
    const reg = loadVaultsRegistry();

    let existingVault = reg.vaults.find(v => path.resolve(v.filePath) === path.resolve(selectedPath));
    if (!existingVault) {
      const vaultId = 'vault-' + Date.now();
      existingVault = {
        id: vaultId,
        name: baseName.replace(/_/g, ' '),
        icon: '📂',
        color: '#10b981',
        filePath: selectedPath,
        createdAt: new Date().toISOString()
      };
      reg.vaults.push(existingVault);
    }

    reg.activeVaultId = existingVault.id;
    saveVaultsRegistry(reg);

    if (mainWindow) {
      mainWindow.setTitle('Julo');
    }

    return {
      success: true,
      vaultInfo: existingVault,
      data: { ...parsed, _vaultInfo: existingVault }
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// 5. Сменить путь к файлу базы данных
ipcMain.handle('change-vault-path', async (event, { vaultId, newFilePath }) => {
  try {
    const reg = loadVaultsRegistry();
    const vault = reg.vaults.find(v => v.id === vaultId);
    if (!vault) return { success: false, error: 'База не найдена' };

    if (!newFilePath) return { success: false, error: 'Путь не указан' };
    const normNewPath = path.normalize(newFilePath);
    if (normNewPath.startsWith('\\\\') || normNewPath.startsWith('//')) {
      return { success: false, error: 'Сетевые UNC-пути не поддерживаются в целях безопасности' };
    }
    if (path.extname(normNewPath).toLowerCase() !== '.json') {
      return { success: false, error: 'Файл базы данных должен иметь расширение .json' };
    }

    const oldPath = vault.filePath;
    if (oldPath !== normNewPath) {
      if (fs.existsSync(oldPath)) {
        const newDir = path.dirname(normNewPath);
        if (!fs.existsSync(newDir)) fs.mkdirSync(newDir, { recursive: true });
        fs.copyFileSync(oldPath, normNewPath);
      }
      vault.filePath = normNewPath;
      saveVaultsRegistry(reg);
    }

    return { success: true, vault };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// 6. Изменить метаданные базы
ipcMain.handle('change-vault-meta', async (event, { vaultId, name, icon, color }) => {
  try {
    const reg = loadVaultsRegistry();
    const vault = reg.vaults.find(v => v.id === vaultId);
    if (!vault) return { success: false, error: 'База не найдена' };

    if (name) vault.name = name;
    if (icon) vault.icon = icon;
    if (color !== undefined) vault.color = color;
    saveVaultsRegistry(reg);

    if (reg.activeVaultId === vaultId && mainWindow) {
      mainWindow.setTitle('Julo');
    }

    return { success: true, vault };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// 7. Удалить базу данных
ipcMain.handle('delete-vault', async (event, { vaultId, deleteFileOnDisk }) => {
  try {
    const reg = loadVaultsRegistry();
    if (reg.vaults.length <= 1) {
      return { success: false, error: 'Нельзя удалить единственную оставшуюся базу данных!' };
    }

    const index = reg.vaults.findIndex(v => v.id === vaultId);
    if (index === -1) return { success: false, error: 'База не найдена' };

    const [deletedVault] = reg.vaults.splice(index, 1);

    if (deleteFileOnDisk && deletedVault.filePath && fs.existsSync(deletedVault.filePath)) {
      const norm = path.normalize(deletedVault.filePath);
      if (norm.toLowerCase().endsWith('.json')) {
        try {
          const stats = fs.statSync(norm);
          if (stats.isFile()) {
            fs.unlinkSync(norm);
          }
        } catch (e) {}
      }
    }

    let activeSwitched = false;
    let newActiveData = null;
    let newActiveVault = null;

    if (reg.activeVaultId === vaultId) {
      activeSwitched = true;
      reg.activeVaultId = reg.vaults[0].id;
      newActiveVault = reg.vaults[0];
      if (fs.existsSync(newActiveVault.filePath)) {
        newActiveData = readAndMigrateDataFile(newActiveVault.filePath);
      } else {
        newActiveData = defaultData;
      }
    }

    saveVaultsRegistry(reg);

    return {
      success: true,
      activeSwitched,
      newActiveVault,
      data: newActiveData ? { ...newActiveData, _vaultInfo: newActiveVault } : null
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// 8. Диалог выбора пути для сохранения базы
ipcMain.handle('choose-vault-file-path', async (event, defaultName = 'julo_db') => {
  try {
    const res = await dialog.showSaveDialog(mainWindow, {
      title: 'Укажите место и имя файла для базы данных',
      defaultPath: `${defaultName}.json`,
      filters: [
        { name: 'База данных Julo (*.json)', extensions: ['json'] }
      ]
    });
    if (res.canceled || !res.filePath) return { canceled: true };
    return { success: true, filePath: res.filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Показ нативного уведомления Windows
ipcMain.handle('show-notification', async (event, { title, body }) => {
  try {
    if (Notification.isSupported()) {
      const notif = new Notification({
        title: title || 'Напоминание о задаче',
        body: body || 'Пора выполнить задачу!',
        silent: false
      });
      notif.show();
      notif.on('click', () => {
        if (mainWindow) {
          if (mainWindow.isMinimized()) mainWindow.restore();
          mainWindow.focus();
        }
      });
      return { success: true };
    }
    return { success: false, error: 'Not supported' };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Ручной экспорт безопасного бэкапа
ipcMain.handle('export-backup', async (event, data) => {
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const defaultPath = path.join(app.getPath('documents'), `julo_backup_${dateStr}.json`);
  
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Сохранить резервную копию задач',
    defaultPath: defaultPath,
    filters: [{ name: 'JSON Файлы (*.json)', extensions: ['json'] }]
  });

  if (!canceled && filePath) {
    const safeData = migrateDataSchema(data).data;
    atomicWriteJsonSync(filePath, safeData);
    return { success: true, filePath };
  }
  return { success: false, canceled: true };
});

// Ручной импорт бэкапа
ipcMain.handle('import-backup', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Выбрать файл резервной копии для загрузки',
    properties: ['openFile'],
    filters: [{ name: 'JSON Файлы (*.json)', extensions: ['json'] }]
  });

  if (!canceled && filePaths.length > 0) {
    try {
      const data = migrateDataSchema(JSON.parse(fs.readFileSync(filePaths[0], 'utf8'))).data;
      atomicWriteJsonSync(getActiveVaultFilePath(), data);
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
  return { success: false, canceled: true };
});

// Открыть папку бэкапов в проводнике Windows
ipcMain.handle('open-backup-folder', async () => {
  shell.openPath(getBackupDir());
});

// Открыть внешний URL в браузере по умолчанию
ipcMain.handle('open-external-url', async (event, url) => {
  try {
    if (!url || typeof url !== 'string') return { success: false, error: 'Empty URL' };
    let targetUrl = url.trim();
    if (!/^https?:\/\//i.test(targetUrl) && !/^mailto:/i.test(targetUrl)) {
      targetUrl = 'https://' + targetUrl;
    }
    await shell.openExternal(targetUrl);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Открыть путь (папку или файл) с защитой от запуска вредоносных программ и UNC-инъекций
ipcMain.handle('open-local-path', async (event, itemPath) => {
  try {
    if (!itemPath || typeof itemPath !== 'string') {
      return { success: false, error: 'Не указан путь' };
    }

    const cleanPath = itemPath.trim();

    // 1. Защита от утечки NTLM-хэшей Windows через удаленные сетевые пути (UNC)
    if (cleanPath.startsWith('\\\\') || cleanPath.startsWith('//')) {
      if (mainWindow) {
        dialog.showMessageBox(mainWindow, {
          type: 'warning',
          title: 'Предупреждение безопасности',
          message: 'Открытие удаленных сетевых путей (UNC) заблокировано в целях безопасности.',
          buttons: ['Понятно']
        });
      }
      return { success: false, error: 'Сетевые UNC-пути заблокированы' };
    }

    if (!fs.existsSync(cleanPath)) {
      return { success: false, error: 'Файл или папка не найдена' };
    }

    // 2. Если это папка — открываем безопасно в проводнике Windows
    const stats = fs.statSync(cleanPath);
    if (stats.isDirectory()) {
      await shell.openPath(cleanPath);
      return { success: true, isDirectory: true };
    }

    // 3. Если это файл — проверяем расширение на потенциально опасные исполняемые форматы
    const ext = path.extname(cleanPath).toLowerCase();
    const dangerousExtensions = [
      '.exe', '.bat', '.cmd', '.com', '.ps1', '.psm1', '.vbs', '.vbe', 
      '.js', '.jse', '.wsf', '.wsh', '.msc', '.msi', '.msp', '.scr', 
      '.hta', '.cpl', '.jar', '.reg', '.pif', '.lnk'
    ];

    if (dangerousExtensions.includes(ext)) {
      const fileName = path.basename(cleanPath);
      const { response } = await dialog.showMessageBox(mainWindow, {
        type: 'warning',
        buttons: ['Отмена (безопасно)', 'Показать в папке', 'Всё равно запустить'],
        defaultId: 0,
        cancelId: 0,
        title: 'Предупреждение безопасности Windows',
        message: `Внимание: файл "${fileName}" является исполняемой программой или скриптом (${ext}).`,
        detail: 'Запуск исполняемых файлов может нанести вред системе. Рекомендуется сначала открыть содержащую папку.'
      });

      if (response === 0) {
        return { success: false, canceled: true };
      } else if (response === 1) {
        shell.showItemInFolder(cleanPath);
        return { success: true, showedInFolder: true };
      }
    }

    // Безопасный запуск обычного документа/картинки (PDF, DOCX, PNG и т.д.)
    await shell.openPath(cleanPath);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Выбор локальной папки на диске
ipcMain.handle('select-local-folder', async () => {
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Выберите папку проекта на диске',
      properties: ['openDirectory']
    });
    if (!canceled && filePaths.length > 0) {
      return { success: true, path: filePaths[0], name: path.basename(filePaths[0]) };
    }
    return { success: false, canceled: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Выбор локального файла на диске
ipcMain.handle('select-local-file', async () => {
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Выберите файл на диске',
      properties: ['openFile']
    });
    if (!canceled && filePaths.length > 0) {
      return { success: true, path: filePaths[0], name: path.basename(filePaths[0]) };
    }
    return { success: false, canceled: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Выбор файла изображения
ipcMain.handle('select-image-file', async () => {
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Выберите изображение или скриншот',
      properties: ['openFile'],
      filters: [{ name: 'Изображения (*.png, *.jpg, *.jpeg, *.webp, *.gif, *.bmp)', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'] }]
    });
    if (!canceled && filePaths.length > 0) {
      const filePath = filePaths[0];
      const ext = path.extname(filePath).slice(1).toLowerCase();
      const base64 = fs.readFileSync(filePath).toString('base64');
      const mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
      const dataUrl = `data:${mimeType};base64,${base64}`;
      return { success: true, path: filePath, name: path.basename(filePath), dataUrl };
    }
    return { success: false, canceled: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Автоматическое получение заголовка веб-страницы по URL
ipcMain.handle('fetch-url-title', async (event, targetUrl) => {
  if (!targetUrl || typeof targetUrl !== 'string') {
    return { success: false, error: 'Empty URL' };
  }

  let formattedUrl = targetUrl.trim();
  if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
    formattedUrl = 'https://' + formattedUrl;
  }

  function decodeHtmlEntities(str) {
    if (!str) return '';
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x2F;/g, '/')
      .replace(/&mdash;/g, '—')
      .replace(/&ndash;/g, '–')
      .replace(/&laquo;/g, '«')
      .replace(/&raquo;/g, '»')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function getSmartFallback(urlStr) {
    try {
      const u = new URL(urlStr);
      const domain = u.hostname.replace(/^www\./, '');
      const pathParts = u.pathname.split('/').filter(Boolean);
      if (pathParts.length > 0) {
        const lastPart = decodeURIComponent(pathParts[pathParts.length - 1]);
        if (lastPart.length > 2) {
          return `${domain} — ${lastPart.replace(/[-_+]/g, ' ')}`;
        }
      }
      return domain;
    } catch (e) {
      return urlStr;
    }
  }

  function isPrivateOrLocalHost(hostname) {
    if (!hostname) return true;
    const host = hostname.toLowerCase().trim();
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '0.0.0.0') {
      return true;
    }
    if (host.endsWith('.local') || host.endsWith('.internal')) {
      return true;
    }
    const ipMatch = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipMatch) {
      const [, a, b, c, d] = ipMatch.map(Number);
      if (a === 127 || a === 10 || a === 0) return true;
      if (a === 172 && b >= 16 && b <= 31) return true;
      if (a === 192 && b === 168) return true;
      if (a === 169 && b === 254) return true;
    }
    return false;
  }

  return new Promise((resolve) => {
    try {
      const urlObj = new URL(formattedUrl);
      if (isPrivateOrLocalHost(urlObj.hostname)) {
        return resolve({ success: true, title: getSmartFallback(formattedUrl) });
      }

      const https = require('https');
      const http = require('http');
      const client = urlObj.protocol === 'https:' ? https : http;

      const reqOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7'
        },
        timeout: 5000
      };

      let redirectCount = 0;

      const req = client.request(reqOptions, (res) => {
        // Редиректы (301, 302, 303, 307, 308) с ограничением до 3 переходов
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          redirectCount++;
          if (redirectCount > 3) {
            req.destroy();
            return resolve({ success: true, title: getSmartFallback(formattedUrl) });
          }

          let redirectUrl = res.headers.location;
          if (!redirectUrl.startsWith('http')) {
            redirectUrl = new URL(redirectUrl, formattedUrl).href;
          }
          req.destroy();
          try {
            const redObj = new URL(redirectUrl);
            if (isPrivateOrLocalHost(redObj.hostname)) {
              return resolve({ success: true, title: getSmartFallback(formattedUrl) });
            }

            const redClient = redObj.protocol === 'https:' ? https : http;
            const redReq = redClient.get(redirectUrl, {
              headers: reqOptions.headers,
              timeout: 5000
            }, (redRes) => {
              processHtmlStream(redRes, redirectUrl, resolve);
            });
            redReq.on('error', () => resolve({ success: true, title: getSmartFallback(formattedUrl) }));
            redReq.on('timeout', () => { redReq.destroy(); resolve({ success: true, title: getSmartFallback(formattedUrl) }); });
            return;
          } catch (e) {
            return resolve({ success: true, title: getSmartFallback(formattedUrl) });
          }
        }

        processHtmlStream(res, formattedUrl, resolve);
      });

      function decodeWindows1251(buffer) {
        const table = "ЂЃ‚ѓ„…†‡€‰Љ‹ЊЌЋЏђ‘’“”•–—™љ›њќћџ ЎўЈ¤Ґ¦§Ё©Є«¬­®Ї°±Ііґµ¶·ё№є»јЅѕїАБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюя";
        let str = '';
        for (let i = 0; i < buffer.length; i++) {
          const byte = buffer[i];
          if (byte < 0x80) {
            str += String.fromCharCode(byte);
          } else {
            str += table[byte - 0x80] || '?';
          }
        }
        return str;
      }

      function processHtmlStream(stream, pageUrl, onDone) {
        const chunks = [];
        let totalBytes = 0;
        let finished = false;

        function finishWithBuffer(buf) {
          if (finished) return;
          finished = true;
          try { stream.destroy(); } catch (e) {}

          let charset = 'utf-8';
          const cType = (stream.headers && stream.headers['content-type']) || '';
          const m1 = cType.match(/charset=([^;]+)/i);
          if (m1) charset = m1[1].trim().toLowerCase();

          let html = '';
          if (charset.includes('1251') || charset.includes('cp1251')) {
            html = decodeWindows1251(buf);
          } else {
            const preview = buf.toString('latin1', 0, Math.min(buf.length, 2048));
            const m2 = preview.match(/<meta[^>]+charset=["']?([^"'>\/\s]+)/i) || preview.match(/<meta[^>]+content=["'][^"']*charset=([^"'>\s;]+)/i);
            if (m2 && (m2[1].toLowerCase().includes('1251') || m2[1].toLowerCase().includes('cp1251'))) {
              html = decodeWindows1251(buf);
            } else {
              html = buf.toString('utf8');
            }
          }

          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          const ogMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
                          html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
          const found = titleMatch ? titleMatch[1] : (ogMatch ? ogMatch[1] : null);
          if (found) {
            onDone({ success: true, title: decodeHtmlEntities(found) });
          } else {
            onDone({ success: true, title: getSmartFallback(pageUrl) });
          }
        }

        stream.on('data', (chunk) => {
          chunks.push(chunk);
          totalBytes += chunk.length;
          if (totalBytes > 80000 && !finished) {
            finishWithBuffer(Buffer.concat(chunks));
          }
        });

        stream.on('end', () => {
          if (!finished) {
            finishWithBuffer(Buffer.concat(chunks));
          }
        });

        stream.on('error', () => {
          if (!finished) {
            finished = true;
            onDone({ success: true, title: getSmartFallback(pageUrl) });
          }
        });
      }

      req.on('error', () => {
        resolve({ success: true, title: getSmartFallback(formattedUrl) });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ success: true, title: getSmartFallback(formattedUrl) });
      });

      req.end();
    } catch (e) {
      resolve({ success: true, title: getSmartFallback(formattedUrl) });
    }
  });
});

// Вывод окна на передний план при срабатывании будильника
ipcMain.handle('bring-to-front', async () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
    mainWindow.flashFrame(true);
    return { success: true };
  }
  return { success: false };
});

// =========================================================================
// Глобальные горячие клавиши (Global Shortcuts)
// =========================================================================
function normalizeShortcutForElectron(shortcutStr) {
  if (!shortcutStr) return 'Alt+Space';
  return shortcutStr
    .replace(/\s+/g, '')
    .replace(/Ctrl/gi, 'CommandOrControl')
    .replace(/Control/gi, 'CommandOrControl');
}

function registerAppGlobalShortcut(shortcutKey = 'Alt+Space', enabled = true) {
  try {
    if (currentRegisteredShortcut) {
      globalShortcut.unregister(currentRegisteredShortcut);
      currentRegisteredShortcut = null;
    }

    isShortcutEnabled = !!enabled;
    if (!isShortcutEnabled || !shortcutKey) {
      return { success: true, enabled: false, shortcut: shortcutKey };
    }

    const electronShortcut = normalizeShortcutForElectron(shortcutKey);
    const registered = globalShortcut.register(electronShortcut, () => {
      if (!mainWindow) return;

      const wasMinimized = mainWindow.isMinimized();
      if (wasMinimized) {
        mainWindow.restore();
      }
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.send('trigger-quick-capture', {
        shortcut: shortcutKey,
        wasMinimized
      });
    });

    if (registered) {
      currentRegisteredShortcut = electronShortcut;
      console.log(`Глобальная горячая клавиша зарегистрирована: ${shortcutKey} (${electronShortcut})`);
      return { success: true, enabled: true, shortcut: shortcutKey };
    } else {
      console.warn(`Не удалось зарегистрировать горячую клавишу: ${shortcutKey}`);
      return { success: false, error: `Комбинация "${shortcutKey}" занята другой программой Windows` };
    }
  } catch (err) {
    console.error('Ошибка регистрации глобальной клавиши:', err);
    return { success: false, error: err.message };
  }
}

ipcMain.handle('register-global-shortcut', (event, { shortcut, enabled }) => {
  return registerAppGlobalShortcut(shortcut, enabled);
});

ipcMain.handle('get-global-shortcut-status', () => {
  return {
    enabled: isShortcutEnabled,
    shortcut: currentRegisteredShortcut || 'Alt+Space',
    isRegistered: !!currentRegisteredShortcut && globalShortcut.isRegistered(currentRegisteredShortcut)
  };
});

ipcMain.handle('minimize-window', () => {
  if (mainWindow) mainWindow.minimize();
  return { success: true };
});

// Настройка сворачивания в трей
ipcMain.handle('set-minimize-to-tray', (event, enabled) => {
  minimizeToTray = !!enabled;
  return { success: true, minimizeToTray };
});

// Настройка автозапуска Windows
ipcMain.handle('set-autostart-windows', (event, enabled) => {
  try {
    app.setLoginItemSettings({
      openAtLogin: !!enabled,
      openAsHidden: true
    });
    return { success: true, autostart: app.getLoginItemSettings().openAtLogin };
  } catch (err) {
    console.error('Ошибка настройки автозагрузки:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('get-autostart-status', () => {
  try {
    const settings = app.getLoginItemSettings();
    return { success: true, autostart: settings.openAtLogin };
  } catch (err) {
    return { success: false, autostart: false };
  }
});

// Запуск приложения
app.whenReady().then(() => {
  // Настройка App ID для корректного отображения тостов в Windows
  if (process.platform === 'win32') {
    app.setAppUserModelId('app.julo.taskmanager');
  }

  // Создаем иконку в трее
  createTray();

  createWindow();

  // Регистрация горячей клавиши и загрузка настроек
  let initialShortcut = 'Alt+Space';
  let initialEnabled = true;
  try {
    const dataPath = getActiveVaultFilePath();
    if (fs.existsSync(dataPath)) {
      const parsed = readAndMigrateDataFile(dataPath);
      if (parsed.settings) {
        if (parsed.settings.minimizeToTray !== undefined) {
          minimizeToTray = parsed.settings.minimizeToTray;
        }
        if (parsed.settings.hotkeys) {
          if (parsed.settings.hotkeys.globalQuickCapture !== undefined) {
            initialShortcut = parsed.settings.hotkeys.globalQuickCapture;
          }
          if (parsed.settings.hotkeys.enabled !== undefined) {
            initialEnabled = parsed.settings.hotkeys.enabled;
          }
        }
      }
    }
  } catch (e) {}

  registerAppGlobalShortcut(initialShortcut, initialEnabled);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
