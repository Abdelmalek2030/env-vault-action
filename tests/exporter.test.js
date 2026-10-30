'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  exportToGithubEnv,
  writeAtomicEnvFile,
  validateSafeEnvKeys
} = require('../src/exporter');
const { VaultSecurityError } = require('../src/errors');

test('exporter: blocks restricted runtime hijacking keys by default', () => {
  assert.throws(
    () => validateSafeEnvKeys([{ key: 'LD_PRELOAD', value: '/tmp/evil.so' }]),
    VaultSecurityError
  );
  assert.throws(
    () => validateSafeEnvKeys([{ key: 'NODE_OPTIONS', value: '--require /tmp/x.js' }]),
    VaultSecurityError
  );
});

test('exporter: writes CSPRNG heredoc blocks to $GITHUB_ENV and atomic 0600 .env files', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'env-vault-action-test-'));
  const githubEnvFile = path.join(tmpDir, 'github_env');
  const dotEnvFile = path.join(tmpDir, '.env');

  try {
    const entries = [
      { key: 'SERVICE_TOKEN', value: 'sec_123' },
      { key: 'MULTILINE_CERT', value: 'BEGIN\nEOF\nEND' }
    ];

    exportToGithubEnv(entries, githubEnvFile);
    const envContent = fs.readFileSync(githubEnvFile, 'utf8');
    assert.match(envContent, /^SERVICE_TOKEN<<__ENV_VAULT_EOF_[0-9a-f]{32}__\nsec_123\n/m);

    writeAtomicEnvFile(entries, dotEnvFile);
    const stat = fs.statSync(dotEnvFile);
    if (process.platform !== 'win32') {
      assert.equal(stat.mode & 0o777, 0o600);
    }
    const fileContent = fs.readFileSync(dotEnvFile, 'utf8');
    assert.match(fileContent, /SERVICE_TOKEN="sec_123"/);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
