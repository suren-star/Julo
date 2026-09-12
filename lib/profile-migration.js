const path = require('path');

function rewriteVaultRegistryPaths(registry, legacyDataDir, juloDataDir, platform = process.platform) {
  if (!registry || !Array.isArray(registry.vaults)) return registry;

  const p = platform === 'win32' ? path.win32 : path;
  const legacyRoot = p.resolve(legacyDataDir);
  const targetRoot = p.resolve(juloDataDir);

  return {
    ...registry,
    vaults: registry.vaults.map((vault) => {
      if (!vault || !vault.filePath) return vault;
      const resolved = p.resolve(vault.filePath);
      const rel = p.relative(legacyRoot, resolved);
      const isInside = rel === '' || (!rel.startsWith('..') && !p.isAbsolute(rel));
      if (!isInside) return vault;
      return { ...vault, filePath: p.join(targetRoot, rel) };
    })
  };
}

module.exports = { rewriteVaultRegistryPaths };
