'use strict';

const crypto = require('node:crypto');
const { SCRYPT_PARAMS, KEY_BYTES, SALT_BYTES, MIN_PASSPHRASE_LENGTH } = require('./constants');
const { VaultCryptoError, VaultFormatError } = require('./errors');

/**
 * Derives a 256-bit key from a passphrase and 128-bit salt using RFC 7914 scrypt.
 * @param {string|Buffer} passphrase
 * @param {Buffer} salt
 * @returns {Buffer}
 */
function deriveKey(passphrase, salt) {
  if (typeof passphrase !== 'string' && !Buffer.isBuffer(passphrase)) {
    throw new VaultCryptoError('Vault passphrase must be a non-empty string or Buffer.');
  }
  const passBuf = Buffer.isBuffer(passphrase) ? passphrase : Buffer.from(passphrase, 'utf8');
  if (passBuf.length < MIN_PASSPHRASE_LENGTH) {
    if (!Buffer.isBuffer(passphrase)) passBuf.fill(0);
    throw new VaultCryptoError(`Vault passphrase must be at least ${MIN_PASSPHRASE_LENGTH} characters.`);
  }
  if (!Buffer.isBuffer(salt) || salt.length !== SALT_BYTES) {
    if (!Buffer.isBuffer(passphrase)) passBuf.fill(0);
    throw new VaultFormatError(`Invalid scrypt salt length: expected ${SALT_BYTES} bytes.`);
  }

  try {
    return crypto.scryptSync(passBuf, salt, KEY_BYTES, SCRYPT_PARAMS);
  } finally {
    if (!Buffer.isBuffer(passphrase)) {
      passBuf.fill(0);
    }
  }
}

/**
 * Explicitly zeroes a sensitive Buffer in memory.
 * @param {Buffer|null|undefined} buf
 */
function zeroize(buf) {
  if (Buffer.isBuffer(buf)) {
    buf.fill(0);
  }
}

module.exports = Object.freeze({
  deriveKey,
  zeroize
});
