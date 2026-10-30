'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { deriveKey, zeroize } = require('../src/kdf');
const { VaultCryptoError, VaultFormatError } = require('../src/errors');

test('kdf: deriveKey produces deterministic 32-byte key for identical passphrase and salt', () => {
  const salt = crypto.randomBytes(16);
  const k1 = deriveKey('correct-horse-battery-staple', salt);
  const k2 = deriveKey('correct-horse-battery-staple', salt);
  assert.equal(k1.length, 32);
  assert.deepEqual(k1, k2);
});

test('kdf: deriveKey rejects short passphrases and invalid salt lengths', () => {
  const validSalt = crypto.randomBytes(16);
  assert.throws(() => deriveKey('short', validSalt), VaultCryptoError);
  assert.throws(() => deriveKey('valid-passphrase-123', Buffer.alloc(8)), VaultFormatError);
});

test('kdf: zeroize overwrites Buffer contents with zeros', () => {
  const buf = Buffer.from('super-secret-key-material', 'utf8');
  zeroize(buf);
  assert.equal(buf.every((byte) => byte === 0), true);
});
