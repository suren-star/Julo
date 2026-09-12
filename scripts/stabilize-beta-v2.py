from pathlib import Path
import json
import re

# main.js: Julo profile migration, schema migration and WebDAV backend removal.
p = Path('main.js')
s = p.read_text(encoding='utf-8')
s = s.replace(
    "const { app, BrowserWindow, ipcMain, Notification, dialog, shell, globalShortcut, Tray, Menu, safeStorage } = require('electron');",
    "const { app, BrowserWindow, ipcMain, Notification, dialog, shell, globalShortcut, Tray, Menu } = require('electron');"
)
s = s.replace(
    "const fs = require('fs');\n",
    "const fs = require('fs');\nconst { migrateDataSchema } = require('./lib/data-migrations');\nconst { rewriteVaultRegistryPaths } = require('./lib/profile-migration');\n"
)

profile = r'''const JULO_PROFILE_DIR = 'Julo';
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

'''
s = s.replace('let mainWindow;\n', profile + 'let mainWindow;\n', 1)

s = re.sub(
    r"// =========================================================================\n// БЕЗОПАСНОСТЬ: ШИФРОВАНИЕ УЧЕТНЫХ ДАННЫХ \(Windows DPAPI\) И АТОМАРНАЯ ЗАПИСЬ\n// =========================================================================\n\nfunction isSafeStorageAvailable\(\).*?\nfunction atomicWriteJsonSync",
    "// =========================================================================\n// БЕЗОПАСНОСТЬ ДАННЫХ: АТОМАРНАЯ ЗАПИСЬ И ЛОКАЛЬНЫЕ РЕЗЕРВНЫЕ КОПИИ\n// =========================================================================\n\nfunction atomicWriteJsonSync",
    s,
    flags=re.S
)
s = s.replace(
    'function atomicWriteJsonSync(targetPath, data) {',
    'function atomicWriteJsonSync(targetPath, data, { createBackup = true } = {}) {'
)
s = s.replace(
    '  if (fs.existsSync(targetPath)) {\n    try {',
    '  if (createBackup && fs.existsSync(targetPath)) {\n    try {',
    1
)

helpers = r'''function migrateStoredData(targetFile, rawData) {
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

'''
s = s.replace('function saveVaultsRegistry(registry) {', helpers + 'function saveVaultsRegistry(registry) {', 1)

s = s.replace('const defaultData = {', 'const defaultData = migrateDataSchema({', 1)
s = s.replace(
    "  settings: {\n    theme: 'warm',\n    soundEnabled: true\n  }\n};\n\nfunction createTray()",
    "  settings: {\n    theme: 'warm',\n    soundEnabled: true,\n    sync: { enabled: false, provider: null }\n  }\n}).data;\n\nfunction createTray()",
    1
)

for old, new in [
    ('Мой Планер — Персональный менеджер задач', 'Julo — Персональный менеджер задач'),
    ('📖 Открыть Планер', '📖 Открыть Julo'),
    ("title: 'Мой Планер'", "title: 'Julo'"),
    ("mainWindow.setTitle('Мой Планер')", "mainWindow.setTitle('Julo')"),
    ('Выберите файл базы данных Planer (*.json)', 'Выберите файл базы данных Julo (*.json)'),
    ('База данных Planer (*.json)', 'База данных Julo (*.json)'),
    ("defaultName = 'planer_db'", "defaultName = 'julo_db'"),
    ("`planer_backup_${dateStr}.json`", "`julo_backup_${dateStr}.json`"),
    ("app.setAppUserModelId('ru.planer.taskmanager')", "app.setAppUserModelId('app.julo.taskmanager')")
]:
    s = s.replace(old, new)

s = re.sub(
    r"\n    \{ type: 'separator' \},\n    \{\n      label: '🔄 Синхронизировать с облаком',.*?\n    \},\n    \{ type: 'separator' \},",
    "\n    { type: 'separator' },",
    s,
    count=1,
    flags=re.S
)

s = s.replace(
    "        const content = fs.readFileSync(targetFile, 'utf8');\n        const parsed = JSON.parse(content);\n        if (parsed) {\n          if (parsed.settings?.webdav?.password) {\n            parsed.settings.webdav.password = decryptPassword(parsed.settings.webdav.password);\n          }\n          return { ...parsed, _vaultInfo: activeVault };\n        }",
    "        const parsed = readAndMigrateDataFile(targetFile);\n        if (parsed) return { ...parsed, _vaultInfo: activeVault };"
)
s = s.replace(
    "            const bakContent = fs.readFileSync(backupPath, 'utf8');\n            const bakParsed = JSON.parse(bakContent);\n            if (bakParsed) {\n              atomicWriteJsonSync(targetFile, bakParsed);\n              if (bakParsed.settings?.webdav?.password) {\n                bakParsed.settings.webdav.password = decryptPassword(bakParsed.settings.webdav.password);\n              }\n              return { ...bakParsed, _vaultInfo: activeVault };\n            }",
    "            const bakContent = fs.readFileSync(backupPath, 'utf8');\n            const bakParsed = migrateDataSchema(JSON.parse(bakContent)).data;\n            if (bakParsed) { atomicWriteJsonSync(targetFile, bakParsed, { createBackup: false }); return { ...bakParsed, _vaultInfo: activeVault }; }"
)
s = s.replace(
    "          atomicWriteJsonSync(targetFile, parsed);\n          if (parsed.settings?.webdav?.password) {\n            parsed.settings.webdav.password = decryptPassword(parsed.settings.webdav.password);\n          }\n          return { ...parsed, _vaultInfo: activeVault };",
    "          const migrated = migrateDataSchema(parsed).data;\n          atomicWriteJsonSync(targetFile, migrated, { createBackup: false });\n          return { ...migrated, _vaultInfo: activeVault };"
)
s = s.replace(
    "    // Клонируем данные для безопасной обработки\n    const dataToSave = JSON.parse(JSON.stringify(data));\n    if (dataToSave?.settings?.webdav?.password) {\n      dataToSave.settings.webdav.password = encryptPassword(dataToSave.settings.webdav.password);\n    }\n    atomicWriteJsonSync(targetFile, dataToSave);",
    "    const dataToSave = migrateDataSchema(data).data;\n    atomicWriteJsonSync(targetFile, dataToSave);"
)
s = s.replace(
    "      const content = fs.readFileSync(targetFile, 'utf8');\n      data = JSON.parse(content);",
    "      data = readAndMigrateDataFile(targetFile);",
    1
)
s = re.sub(
    r"\n        webdav: \{\n          enabled: false,\n          serverUrl: 'https://webdav\.cloud\.mail\.ru',\n          username: '',\n          password: '',\n          cloudFolder: `/Planer/\$\{\(name \|\| 'Vault'\)\.replace\(/\[\^\\w\\u0400-\\u04FF\]/gi, '_'\)\}/`\n        \}",
    "\n        sync: { enabled: false, provider: null }",
    s,
    count=1
)
s = s.replace(
    '    atomicWriteJsonSync(filePath, initialData);',
    '    const migratedInitialData = migrateDataSchema(initialData).data;\n    atomicWriteJsonSync(filePath, migratedInitialData);',
    1
).replace(
    'data: { ...initialData, _vaultInfo: newVault }',
    'data: { ...migratedInitialData, _vaultInfo: newVault }'
)
s = s.replace(
    "    const content = fs.readFileSync(selectedPath, 'utf8');\n    const parsed = JSON.parse(content);",
    "    const parsed = readAndMigrateDataFile(selectedPath);"
)
s = s.replace(
    "        newActiveData = JSON.parse(fs.readFileSync(newActiveVault.filePath, 'utf8'));",
    "        newActiveData = readAndMigrateDataFile(newActiveVault.filePath);"
)
s = s.replace(
    '// Ручной экспорт бэкапа с удалением учетных данных WebDAV',
    '// Ручной экспорт безопасного бэкапа'
).replace(
    "    // Клонируем и очищаем конфиденциальные пароли перед выгрузкой во внешний файл\n    const safeData = JSON.parse(JSON.stringify(data));\n    if (safeData.settings?.webdav) {\n      safeData.settings.webdav.password = '';\n    }",
    "    const safeData = migrateDataSchema(data).data;"
)

s = re.sub(
    r"ipcMain\.handle\('import-backup', async \(\) => \{.*?\n\}\);\n\n// Открыть папку бэкапов",
    r'''ipcMain.handle('import-backup', async () => {
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

// Открыть папку бэкапов''',
    s,
    count=1,
    flags=re.S
)

s = re.sub(
    r"\n// =========================================================================\n// WEBDAV КЛИЕНТ И ОБЛАЧНАЯ СИНХРОНИЗАЦИЯ \(Mail\.ru Cloud / WebDAV\)\n// =========================================================================.*?\n// =========================================================================\n// Глобальные горячие клавиши \(Global Shortcuts\)\n// =========================================================================",
    "\n// =========================================================================\n// Глобальные горячие клавиши (Global Shortcuts)\n// =========================================================================",
    s,
    count=1,
    flags=re.S
)
s = s.replace(
    "      const parsed = JSON.parse(fs.readFileSync(dataPath, 'utf8'));",
    "      const parsed = readAndMigrateDataFile(dataPath);"
)
p.write_text(s, encoding='utf-8')

# Renderer cleanup: remove legacy WebDAV controls/hotkey while retaining generic SyncEngine.
p = Path('src/js/app.js')
s = p.read_text(encoding='utf-8')
s = s.replace(
    '// Инициализация облачной синхронизации WebDAV',
    '// Инициализация нейтрального слоя синхронизации (provider подключается отдельно)'
)
s = re.sub(r"\n    if \(window\.electronAPI\?\.onTriggerSyncNow\) \{.*?\n    \}\n", '\n', s, count=1, flags=re.S)
s = s.replace("      const syncKey = hk.syncCloud || 'Ctrl+S';\n", '')
s = re.sub(
    r"\n      \} else if \(!isInput && this\.matchesHotkey\(e, syncKey\)\) \{\n        e\.preventDefault\(\);\n        this\.triggerManualSync\(\);",
    '',
    s,
    count=1
)
s = re.sub(r"\n    // 1\. WebDAV настройки активной базы.*?\n    // 2\. Звуки", '\n    // 1. Звуки', s, count=1, flags=re.S)
for old, new in [
    ('// 3. Подпункты и напоминания', '// 2. Подпункты и напоминания'),
    ('// 4. Трей и автозапуск', '// 3. Трей и автозапуск'),
    ('// 5. Тема оформления', '// 4. Тема оформления'),
    ('// 6. Горячие клавиши', '// 5. Горячие клавиши'),
    ('// 7. Список баз данных', '// 6. Список баз данных')
]:
    s = s.replace(old, new)
s = re.sub(
    r"\n  // =========================================================================\n  // WebDAV Облачная синхронизация UI методы\n  // =========================================================================\n  onWebdavEnabledToggle\(enabled\) \{.*?\n  updateSyncUI\(info\) \{",
    "\n  // =========================================================================\n  // Cloud sync UI hook (kept provider-agnostic for future providers)\n  // =========================================================================\n  updateSyncUI(info) {",
    s,
    count=1,
    flags=re.S
)
s = s.replace("label.textContent = 'Облако: Выкл';", "label.textContent = 'Облако: не настроено';")
s = s.replace("btn.title = 'Облачная синхронизация выключена (нажмите для настройки)';", "btn.title = 'Облачный provider пока не подключен';")
s = s.replace("    document.getElementById('modal-vault-cloud-folder').value = '';\n", '')
s = s.replace("    document.getElementById('modal-vault-cloud-folder').value = (this.data?.settings?.webdav?.cloudFolder) || '';\n", '')
s = s.replace("    const cloudFolder = document.getElementById('modal-vault-cloud-folder').value.trim();\n", '')
s = re.sub(r"\n        if \(cloudFolder\) \{.*?\n        \}", '', s, count=1, flags=re.S)
s = re.sub(r"\n      if \(cloudFolder\) \{.*?\n      \}", '', s, count=1, flags=re.S)
s = s.replace("const name = document.getElementById('modal-vault-name').value.trim() || 'planer_db';", "const name = document.getElementById('modal-vault-name').value.trim() || 'julo_db';")
s = re.sub(
    r"\n    \{\n      id: 'syncCloud',\n      title: 'Синхронизация с облаком ☁️',.*?\n    \},",
    '',
    s,
    count=1,
    flags=re.S
)
p.write_text(s, encoding='utf-8')

# HTML: remove inactive WebDAV UI/help and switch visible branding to Julo.
p = Path('src/index.html')
s = p.read_text(encoding='utf-8')
s = s.replace('<title>Мой Планер</title>', '<title>Julo</title>')
s = s.replace('<span class="logo-text">Планер</span>', '<span class="logo-text">Julo</span>')
s = s.replace('Запускать Планер автоматически при старте Windows', 'Запускать Julo автоматически при старте Windows')
s = s.replace(
    'Подробная интерактивная инструкция по всем возможностям, горячим клавишам и облачной синхронизации',
    'Подробная интерактивная инструкция по возможностям Julo, горячим клавишам и локальному хранению данных'
)
s = re.sub(r"\n        <div class=\"nav-item nav-sync\" id=\"sidebar-sync-btn\".*?</div>\n", '\n', s, count=1, flags=re.S)
s = re.sub(r"\n          <button class=\"btn-subtle btn-help-nav\" onclick=\"App\.scrollToHelpTopic\('topic-webdav'\)\">.*?</button>", '', s, count=1)
s = re.sub(r"\n          <!-- Раздел 5: Облачная синхронизация WebDAV -->.*?\n          <!-- Раздел 6: Сохранность данных -->", '\n          <!-- Сохранность данных -->', s, count=1, flags=re.S)
s = re.sub(r"\n        <button type=\"button\" class=\"settings-tab-btn\" id=\"tab-btn-webdav\".*?</button>", '', s, count=1)
s = re.sub(r"\n        <!-- ВКЛАДКА 2: Облачная синхронизация WebDAV -->.*?\n        <!-- ВКЛАДКА 3: Сохранность данных -->", '\n        <!-- Сохранность данных -->', s, count=1, flags=re.S)
s = re.sub(r"\n        <div class=\"form-group\">\n          <label for=\"modal-vault-cloud-folder\".*?\n        </div>", '', s, count=1, flags=re.S)
s = s.replace(
    ' — окно мгновенно закроется, а задача сохранится и синхронизируется в облако.',
    ' — окно мгновенно закроется, а задача сохранится локально.'
)
s = re.sub(r"\n                  <tr><td><kbd>Ctrl</kbd> \+ <kbd>S</kbd></td><td>Принудительная синхронизация с облаком</td></tr>", '', s, count=1)
p.write_text(s, encoding='utf-8')

# Backup naming keeps legacy localStorage keys intact for compatibility.
p = Path('src/js/storage.js')
p.write_text(
    p.read_text(encoding='utf-8').replace(
        "`planer_backup_${new Date().toISOString().slice(0, 10)}.json`",
        "`julo_backup_${new Date().toISOString().slice(0, 10)}.json`"
    ),
    encoding='utf-8'
)

# Package identity and beta validation.
d = json.loads(Path('package.json').read_text(encoding='utf-8'))
d.update(
    name='julo',
    productName='Julo',
    version='0.1.0-beta.1',
    description='Julo desktop task manager — tasks, planning, time tracking and local-first data',
    author='Julo contributors'
)
d['keywords'] = ['task-manager', 'planner', 'todo', 'electron', 'time-tracking']
d['scripts']['check'] = 'node --check main.js && node --check preload.js && node --check lib/data-migrations.js && node --check lib/profile-migration.js && node --check src/js/storage.js && node --check src/js/timer.js && node --check src/js/sync.js && node --check src/js/app.js'
d['scripts']['test'] = 'node --test tests/*.test.js'
d['scripts']['build'] = 'electron-packager . Julo --platform=win32 --arch=x64 --icon=src/assets/icon.ico --out=dist --overwrite --prune=true --ignore="([/\\\\]|^)(backup|dist|Julo-win32-x64|Planer-win32-x64|\\.git|data|PROJECT_RULES\\.md)"'
Path('package.json').write_text(json.dumps(d, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

lock = json.loads(Path('package-lock.json').read_text(encoding='utf-8'))
lock['name'] = 'julo'
lock['version'] = '0.1.0-beta.1'
lock['packages']['']['name'] = 'julo'
lock['packages']['']['version'] = '0.1.0-beta.1'
Path('package-lock.json').write_text(json.dumps(lock, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

ci = Path('.github/workflows/ci.yml')
c = ci.read_text(encoding='utf-8')
if 'npm test' not in c:
    c = c.replace('      - run: npm run check\n', '      - run: npm run check\n      - run: npm test\n')
ci.write_text(c, encoding='utf-8')
