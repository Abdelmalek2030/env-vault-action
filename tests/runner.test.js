'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { encryptEnvelope } = require('../src/crypto');
const { runAction } = require('../src/runner');

test('runner: end-to-end decryption masks secrets before exporting to GITHUB_ENV and GITHUB_OUTPUT', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'env-vault-runner-'));
  const vaultFile = path.join(tmpDir, '.env.vault');
  const githubEnv = path.join(tmpDir, 'github_env');
  const githubOutput = path.join(tmpDir, 'github_output');
  const outEnvFile = path.join(tmpDir, '.env.decrypted');

  try {
    const pass = 'runner-integration-passphrase-2026';
    const envelope = encryptEnvelope('STRIPE_KEY="rk_live_abc123"\nDB_PORT="5432"\n', pass);
    fs.writeFileSync(vaultFile, envelope, 'utf8');

    const logs = [];
    const result = runAction({
      vaultFile,
      vaultKey: pass,
      exportEnv: true,
      exportFile: true,
      outputPath: outEnvFile,
      env: {
        GITHUB_ENV: githubEnv,
        GITHUB_OUTPUT: githubOutput
      },
      writeLine: (line) => logs.push(line)
    });

    assert.equal(result.keysCount, 2);
    assert.equal(result.version, 'v1');
    assert.equal(logs[0], '::add-mask::rk_live_abc123');
    assert.equal(logs[1], '::add-mask::5432');

    const outputData = fs.readFileSync(githubOutput, 'utf8');
    assert.match(outputData, /keys-count=2/);
    assert.match(outputData, /vault-version=v1/);
    assert.equal(fs.existsSync(outEnvFile), true);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
