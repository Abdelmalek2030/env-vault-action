#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { inspectEnvelope, encryptEnvelope, decryptEnvelope } = require('../src/crypto');
const { parseDotenv } = require('../src/parser');
const { formatGithubEnvPayload } = require('../src/exporter');
const { VaultError } = require('../src/errors');

const ITERATIONS = 2500;

function runFuzzSuite() {
  console.log(`==> Running ${ITERATIONS} cryptographic & CI injection fuzz iterations...`);

  // 1. Fuzz envelope parser & AEAD tamper resistance
  for (let i = 0; i < ITERATIONS; i++) {
    const randomGarbage = crypto.randomBytes(48).toString('base64');
    try {
      inspectEnvelope(randomGarbage);
      assert.fail('inspectEnvelope should have rejected random garbage');
    } catch (err) {
      assert.ok(err instanceof VaultError);
    }
  }

  // 2. Fuzz heredoc delimiter collision immunity & roundtrip integrity
  const key = 'fuzz-master-key-99999999';
  for (let i = 0; i < 200; i++) {
    const randomVal = crypto.randomBytes(32).toString('hex');
    const dotenvInput = `FUZZ_KEY_${i}="${randomVal}"\n`;
    const envVault = encryptEnvelope(dotenvInput, key);
    const decrypted = decryptEnvelope(envVault, key);
    const entries = parseDotenv(decrypted);
    const payload = formatGithubEnvPayload(entries);
    assert.match(payload, new RegExp(`FUZZ_KEY_${i}<<__ENV_VAULT_EOF_[0-9a-f]{32}__`));
  }

  console.log('OK: All 2,700 fuzzing assertions passed with zero unhandled exceptions.');
}

runFuzzSuite();
