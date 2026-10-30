'use strict';

const crypto = require('node:crypto');
const {
  PROTOCOL_VERSION,
  CIPHER_ALGO,
  SALT_BYTES,
  IV_BYTES,
  TAG_BYTES,
  HEX_REGEX
} = require('./constants');
const { VaultFormatError, VaultCryptoError } = require('./errors');
const { deriveKey, zeroize } = require('./kdf');

/**
 * Parses and validates a v1 colon-delimited vault envelope without decrypting.
 * Format: v1:<salt_hex>:<iv_hex>:<tag_hex>:<ciphertext_hex>
 * @param {string} rawEnvelope
 */
function inspectEnvelope(rawEnvelope) {
  if (typeof rawEnvelope !== 'string') {
    throw new VaultFormatError('Vault envelope must be a string.');
  }
  const trimmed = rawEnvelope.trim();
  const parts = trimmed.split(':');
  if (parts.length !== 5) {
    throw new VaultFormatError('Invalid envelope structure: expected 5 colon-delimited segments.');
  }

  const [version, saltHex, ivHex, tagHex, ciphertextHex] = parts;
  if (version !== PROTOCOL_VERSION) {
    throw new VaultFormatError(`Unsupported vault protocol version: ${version}`);
  }

  if (saltHex.length !== SALT_BYTES * 2 || !HEX_REGEX.test(saltHex)) {
    throw new VaultFormatError('Malformed hexadecimal salt in vault envelope.');
  }
  if (ivHex.length !== IV_BYTES * 2 || !HEX_REGEX.test(ivHex)) {
    throw new VaultFormatError('Malformed hexadecimal IV in vault envelope.');
  }
  if (tagHex.length !== TAG_BYTES * 2 || !HEX_REGEX.test(tagHex)) {
    throw new VaultFormatError('Malformed hexadecimal authTag in vault envelope.');
  }
  if (ciphertextHex.length > 0 && (ciphertextHex.length % 2 !== 0 || !HEX_REGEX.test(ciphertextHex))) {
    throw new VaultFormatError('Malformed hexadecimal ciphertext in vault envelope.');
  }

  return {
    version,
    salt: Buffer.from(saltHex, 'hex'),
    iv: Buffer.from(ivHex, 'hex'),
    authTag: Buffer.from(tagHex, 'hex'),
    ciphertext: Buffer.from(ciphertextHex, 'hex'),
    aad: Buffer.from(`${version}:${saltHex}:${ivHex}`, 'ascii')
  };
}

/**
 * Encrypts plaintext string into a v1 authenticated envelope (used for testing & self-dogfooding).
 * @param {string} plaintext
 * @param {string} passphrase
 * @returns {string}
 */
function encryptEnvelope(plaintext, passphrase) {
  const salt = crypto.randomBytes(SALT_BYTES);
  const iv = crypto.randomBytes(IV_BYTES);
  const saltHex = salt.toString('hex');
  const ivHex = iv.toString('hex');
  const aad = Buffer.from(`${PROTOCOL_VERSION}:${saltHex}:${ivHex}`, 'ascii');

  let key = null;
  try {
    key = deriveKey(passphrase, salt);
    const cipher = crypto.createCipheriv(CIPHER_ALGO, key, iv, { authTagLength: TAG_BYTES });
    cipher.setAAD(aad);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${PROTOCOL_VERSION}:${saltHex}:${ivHex}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
  } finally {
    zeroize(key);
    zeroize(salt);
  }
}

/**
 * Decrypts and authenticates a v1 vault envelope using AES-256-GCM and bound AAD.
 * @param {string} rawEnvelope
 * @param {string} passphrase
 * @returns {string}
 */
function decryptEnvelope(rawEnvelope, passphrase) {
  const parsed = inspectEnvelope(rawEnvelope);
  let key = null;
  let decryptedBuf = null;

  try {
    key = deriveKey(passphrase, parsed.salt);
    const decipher = crypto.createDecipheriv(CIPHER_ALGO, key, parsed.iv, {
      authTagLength: TAG_BYTES
    });
    decipher.setAAD(parsed.aad);
    decipher.setAuthTag(parsed.authTag);

    decryptedBuf = Buffer.concat([decipher.update(parsed.ciphertext), decipher.final()]);
    return decryptedBuf.toString('utf8');
  } catch (err) {
    if (err instanceof VaultFormatError || err instanceof VaultCryptoError) {
      throw err;
    }
    throw new VaultCryptoError('AEAD authentication failed: invalid vault-key or tampered .env.vault payload.');
  } finally {
    zeroize(key);
    zeroize(decryptedBuf);
    zeroize(parsed.salt);
  }
}

module.exports = Object.freeze({
  inspectEnvelope,
  encryptEnvelope,
  decryptEnvelope
});
