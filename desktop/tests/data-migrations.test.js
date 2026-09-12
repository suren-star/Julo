const test = require('node:test');
const assert = require('node:assert/strict');
const { migrateDataSchema, CURRENT_DATA_SCHEMA_VERSION } = require('../lib/data-migrations');

const legacy = {
  tasks: [{ id: 't1', title: 'Keep me' }],
  settings: {
    theme: 'warm',
    webdav: {
      enabled: true,
      serverUrl: 'https://webdav.cloud.mail.ru',
      username: 'legacy@example.com',
      password: 'secret'
    }
  },
  _vaultInfo: { id: 'runtime-only' }
};

test('migrates legacy WebDAV data without losing tasks or ordinary settings', () => {
  const { data, changed } = migrateDataSchema(legacy);
  assert.equal(changed, true);
  assert.deepEqual(data.tasks, legacy.tasks);
  assert.equal(data.settings.theme, 'warm');
  assert.equal(data.settings.webdav, undefined);
  assert.deepEqual(data.settings.sync, { enabled: false, provider: null });
  assert.equal(data._vaultInfo, undefined);
  assert.equal(data.schemaVersion, CURRENT_DATA_SCHEMA_VERSION);
});

test('does not mutate the input object', () => {
  migrateDataSchema(legacy);
  assert.equal(legacy.settings.webdav.password, 'secret');
  assert.deepEqual(legacy._vaultInfo, { id: 'runtime-only' });
});

test('is idempotent once data is on the current schema', () => {
  const first = migrateDataSchema(legacy).data;
  const second = migrateDataSchema(first);
  assert.equal(second.changed, false);
  assert.deepEqual(second.data, first);
});
