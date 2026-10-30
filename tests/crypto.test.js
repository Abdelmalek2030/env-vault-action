'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { encryptEnvelope, decryptEnvelope, inspectEnvelope } = require('../src/crypto');
const { VaultCryptoError, VaultFormatError } = require('../src/errors');

test('crypto: AES-256-GCM roundtrip encryption and decryption succeeds', () => {
  const secretEnv = 'DB_HOST="postgres.internal"\nAPI_KEY="sk_live_999999"\n';
  const pass = 'enterprise-production-key-2026';
  const envelope = encryptEnvelope(secretEnv, pass);

  const meta = inspectEnvelope(envelope);
  assert.equal(meta.version, 'v1');
  assert.equal(meta.salt.length, 16);
  assert.equal(meta.iv.length, 12);
  assert.equal(meta.authTag.length, 16);

  const decrypted = decryptEnvelope(envelope, pass);
  assert.equal(decrypted, secretEnv);
});

test('crypto: rejects wrong passphrase and tampered AAD or ciphertext', () => {
  const envelope = encryptEnvelope('TOKEN=abc123xyz', 'correct-passphrase-123');
  assert.throws(() => decryptEnvelope(envelope, 'wrong-passphrase-123'), VaultCryptoError);

  const parts = envelope.split(':');
  // Flip one hex nibble in salt (tampering with bound AAD header)
  const flippedSalt = (parts[1][0] === 'a' ? 'b' : 'a') + parts[1].slice(1);
  const tamperedEnvelope = [parts[0], flippedSalt, parts[2], parts[3], parts[4]].join(':');
  assert.throws(() => decryptEnvelope(tamperedEnvelope, 'correct-passphrase-123'), VaultCryptoError);
});

test('crypto: rejects malformed envelope structures', () => {
  assert.throws(() => inspectEnvelope('v2:00:00:00:00'), VaultFormatError);
  assert.throws(() => inspectEnvelope('invalid-envelope'), VaultFormatError);
});
