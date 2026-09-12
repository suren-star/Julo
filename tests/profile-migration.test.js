const test = require('node:test');
const assert = require('node:assert/strict');
const { rewriteVaultRegistryPaths } = require('../lib/profile-migration');

test('rewrites only vault files located inside the legacy Windows data directory', () => {
  const registry = {
    activeVaultId: 'default',
    vaults: [
      { id: 'default', filePath: 'C:\\Users\\Suren\\AppData\\Roaming\\planer\\data\\tasks_data.json' },
      { id: 'work', filePath: 'C:\\Users\\Suren\\AppData\\Roaming\\planer\\data\\vault_work.json' },
      { id: 'external', filePath: 'D:\\Projects\\external.json' }
    ]
  };

  const result = rewriteVaultRegistryPaths(
    registry,
    'C:\\Users\\Suren\\AppData\\Roaming\\planer\\data',
    'C:\\Users\\Suren\\AppData\\Roaming\\Julo\\data',
    'win32'
  );

  assert.equal(result.vaults[0].filePath, 'C:\\Users\\Suren\\AppData\\Roaming\\Julo\\data\\tasks_data.json');
  assert.equal(result.vaults[1].filePath, 'C:\\Users\\Suren\\AppData\\Roaming\\Julo\\data\\vault_work.json');
  assert.equal(result.vaults[2].filePath, 'D:\\Projects\\external.json');
});
