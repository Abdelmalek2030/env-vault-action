'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { RESTRICTED_ENV_KEYS } = require('./constants');
const { VaultSecurityError } = require('./errors');

/**
 * Ensures no restricted runtime hijacking variables (e.g., LD_PRELOAD, NODE_OPTIONS) are exported.
 * @param {Array<{ key: string, value: string }>} entries
 * @param {boolean} [allowUnsafe=false]
 */
function validateSafeEnvKeys(entries, allowUnsafe = false) {
  if (allowUnsafe) return;
  for (const { key } of entries) {
    if (RESTRICTED_ENV_KEYS.has(key.toUpperCase())) {
      throw new VaultSecurityError(
        `Blocked restricted environment variable key '${key}' to prevent CI runner hijacking.`
      );
    }
  }
}

/**
 * Formats key-value entries for $GITHUB_ENV using per-variable 128-bit CSPRNG random heredoc delimiters.
 * Prevents multiline workflow command and delimiter collision injection attacks.
 * @param {Array<{ key: string, value: string }>} entries
 * @returns {string}
 */
function formatGithubEnvPayload(entries) {
  const blocks = [];
  for (const { key, value } of entries) {
    let delimiter = `__ENV_VAULT_EOF_${crypto.randomBytes(16).toString('hex')}__`;
    while (value.includes(delimiter)) {
      delimiter = `__ENV_VAULT_EOF_${crypto.randomBytes(16).toString('hex')}__`;
    }
    blocks.push(`${key}<<${delimiter}\n${value}\n${delimiter}\n`);
  }
  return blocks.join('');
}

/**
 * Appends validated entries to the GitHub Actions $GITHUB_ENV file.
 * @param {Array<{ key: string, value: string }>} entries
 * @param {string} githubEnvPath
 * @param {boolean} [allowUnsafe=false]
 */
function exportToGithubEnv(entries, githubEnvPath, allowUnsafe = false) {
  validateSafeEnvKeys(entries, allowUnsafe);
  if (!githubEnvPath) {
    throw new VaultSecurityError('GITHUB_ENV path is not defined in the current runner environment.');
  }
  const payload = formatGithubEnvPayload(entries);
  if (payload.length > 0) {
    fs.appendFileSync(githubEnvPath, payload, { encoding: 'utf8', mode: 0o600 });
  }
}

/**
 * Writes decrypted entries to a local .env file atomically with strict POSIX 0600 permissions.
 * @param {Array<{ key: string, value: string }>} entries
 * @param {string} targetPath
 */
function writeAtomicEnvFile(entries, targetPath) {
  const resolvedPath = path.resolve(targetPath);
  const dir = path.dirname(resolvedPath);
  const tmpName = `.env.vault.tmp.${process.pid}.${crypto.randomBytes(8).toString('hex')}`;
  const tmpPath = path.join(dir, tmpName);

  const lines = entries.map(({ key, value }) => {
    const escaped = value
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r');
    return `${key}="${escaped}"`;
  });
  const body = lines.length > 0 ? `${lines.join('\n')}\n` : '';

  let fd = null;
  try {
    fd = fs.openSync(tmpPath, 'w', 0o600);
    fs.writeFileSync(fd, body, 'utf8');
    fs.fsyncSync(fd);
    fs.closeSync(fd);
    fd = null;
    fs.chmodSync(tmpPath, 0o600);
    fs.renameSync(tmpPath, resolvedPath);
  } catch (err) {
    if (fd !== null) {
      try {
        fs.closeSync(fd);
      } catch (_) {}
    }
    if (fs.existsSync(tmpPath)) {
      try {
        fs.unlinkSync(tmpPath);
      } catch (_) {}
    }
    throw err;
  }
}

/**
 * Writes action metadata outputs (e.g., keys-count, vault-version) to $GITHUB_OUTPUT.
 * @param {Record<string, string|number>} outputs
 * @param {string} [githubOutputPath]
 */
function writeGithubOutputs(outputs, githubOutputPath) {
  if (!githubOutputPath) return;
  const lines = Object.entries(outputs).map(([k, v]) => `${k}=${v}\n`);
  if (lines.length > 0) {
    fs.appendFileSync(githubOutputPath, lines.join(''), { encoding: 'utf8' });
  }
}

module.exports = Object.freeze({
  validateSafeEnvKeys,
  formatGithubEnvPayload,
  exportToGithubEnv,
  writeAtomicEnvFile,
  writeGithubOutputs
});
