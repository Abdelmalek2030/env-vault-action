'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { MAX_VAULT_BYTES } = require('./constants');
const { VaultError, VaultFormatError } = require('./errors');
const { inspectEnvelope, decryptEnvelope } = require('./crypto');
const { parseDotenv } = require('./parser');
const { maskSecrets, emitNotice } = require('./masker');
const {
  validateSafeEnvKeys,
  exportToGithubEnv,
  writeAtomicEnvFile,
  writeGithubOutputs
} = require('./exporter');

/**
 * Resolves a boolean action input flag ("true" / "false").
 * @param {string|boolean|undefined} val
 * @param {boolean} defaultVal
 * @returns {boolean}
 */
function parseBooleanInput(val, defaultVal) {
  if (typeof val === 'boolean') return val;
  if (typeof val !== 'string' || val.trim() === '') return defaultVal;
  const norm = val.trim().toLowerCase();
  if (norm === 'true' || norm === '1' || norm === 'yes') return true;
  if (norm === 'false' || norm === '0' || norm === 'no') return false;
  return defaultVal;
}

/**
 * Executes the complete env-vault-action pipeline:
 * Read -> Inspect -> AEAD Decrypt -> Parse -> Mask -> Export ($GITHUB_ENV / Atomic 0600 File) -> Output.
 * @param {object} [options]
 */
function runAction(options = {}) {
  const env = options.env || process.env;
  const writeLine = options.writeLine || ((line) => process.stdout.write(`${line}\n`));

  const vaultFile =
    options.vaultFile ||
    env['INPUT_VAULT-FILE'] ||
    env.INPUT_VAULT_FILE ||
    '.env.vault';

  const vaultKey =
    options.vaultKey ||
    env['INPUT_VAULT-KEY'] ||
    env.INPUT_VAULT_KEY ||
    env.ENV_VAULT_KEY ||
    '';

  const exportEnv = parseBooleanInput(
    options.exportEnv ?? env['INPUT_EXPORT-ENV'] ?? env.INPUT_EXPORT_ENV,
    true
  );

  const exportFile = parseBooleanInput(
    options.exportFile ?? env['INPUT_EXPORT-FILE'] ?? env.INPUT_EXPORT_FILE,
    false
  );

  const outputPath =
    options.outputPath ||
    env['INPUT_OUTPUT-PATH'] ||
    env.INPUT_OUTPUT_PATH ||
    '.env';

  const allowUnsafeKeys = parseBooleanInput(
    options.allowUnsafeKeys ?? env['INPUT_ALLOW-UNSAFE-KEYS'] ?? env.INPUT_ALLOW_UNSAFE_KEYS,
    false
  );

  if (!vaultKey || typeof vaultKey !== 'string' || vaultKey.trim() === '') {
    throw new VaultError('Missing required input: vault-key (or ENV_VAULT_KEY).', 'ERR_MISSING_KEY');
  }

  const resolvedVaultPath = path.resolve(vaultFile);
  if (!fs.existsSync(resolvedVaultPath)) {
    throw new VaultFormatError(`Vault file not found at path: ${vaultFile}`);
  }

  const stats = fs.statSync(resolvedVaultPath);
  if (stats.size > MAX_VAULT_BYTES) {
    throw new VaultFormatError(
      `Vault file exceeds maximum allowed size (${MAX_VAULT_BYTES} bytes).`
    );
  }

  const rawEnvelope = fs.readFileSync(resolvedVaultPath, 'utf8');
  const metadata = inspectEnvelope(rawEnvelope);
  const plaintext = decryptEnvelope(rawEnvelope, vaultKey);
  const entries = parseDotenv(plaintext);

  // Validate restricted keys before emitting or writing anything
  validateSafeEnvKeys(entries, allowUnsafeKeys);

  // Invariant 2: Always mask secret values in CI logs BEFORE exporting
  const maskedLinesCount = maskSecrets(entries, writeLine);

  if (exportEnv && env.GITHUB_ENV) {
    exportToGithubEnv(entries, env.GITHUB_ENV, allowUnsafeKeys);
  }

  if (exportFile) {
    writeAtomicEnvFile(entries, outputPath);
  }

  if (env.GITHUB_OUTPUT) {
    writeGithubOutputs(
      {
        'keys-count': entries.length,
        'vault-version': metadata.version
      },
      env.GITHUB_OUTPUT
    );
  }

  emitNotice(
    `Successfully authenticated and decrypted ${entries.length} secret(s) from ${path.basename(
      resolvedVaultPath
    )} (protocol ${metadata.version}).`,
    writeLine
  );

  return {
    keysCount: entries.length,
    maskedLinesCount,
    version: metadata.version
  };
}

module.exports = Object.freeze({
  parseBooleanInput,
  runAction
});
