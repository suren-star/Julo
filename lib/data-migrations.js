const CURRENT_DATA_SCHEMA_VERSION = 1;

function cloneJson(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function migrateDataSchema(input) {
  const original = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const data = cloneJson(original) || {};
  let changed = false;

  if (!data.settings || typeof data.settings !== 'object' || Array.isArray(data.settings)) {
    data.settings = {};
    changed = true;
  }

  // Julo beta no longer ships a WebDAV/Mail.ru provider. Remove legacy
  // credentials/configuration instead of silently carrying secrets forward.
  if (Object.prototype.hasOwnProperty.call(data.settings, 'webdav')) {
    delete data.settings.webdav;
    changed = true;
  }

  if (!data.settings.sync || typeof data.settings.sync !== 'object' || Array.isArray(data.settings.sync)) {
    data.settings.sync = { enabled: false, provider: null };
    changed = true;
  } else if (data.settings.sync.provider === 'webdav' || data.settings.sync.provider === 'mailru') {
    data.settings.sync = { enabled: false, provider: null };
    changed = true;
  } else {
    if (typeof data.settings.sync.enabled !== 'boolean') {
      data.settings.sync.enabled = false;
      changed = true;
    }
    if (!Object.prototype.hasOwnProperty.call(data.settings.sync, 'provider')) {
      data.settings.sync.provider = null;
      changed = true;
    }
  }

  if (Object.prototype.hasOwnProperty.call(data, '_vaultInfo')) {
    delete data._vaultInfo;
    changed = true;
  }

  if (data.schemaVersion !== CURRENT_DATA_SCHEMA_VERSION) {
    data.schemaVersion = CURRENT_DATA_SCHEMA_VERSION;
    changed = true;
  }

  return { data, changed };
}

module.exports = { CURRENT_DATA_SCHEMA_VERSION, migrateDataSchema };
