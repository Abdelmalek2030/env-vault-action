'use strict';

const { EXIT_CODES } = require('./constants');

class VaultError extends Error {
  constructor(message, code = 'ERR_VAULT_GENERIC', exitCode = EXIT_CODES.USAGE_ERROR) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.exitCode = exitCode;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

class VaultFormatError extends VaultError {
  constructor(message) {
    super(message, 'ERR_VAULT_FORMAT', EXIT_CODES.FORMAT_ERROR);
  }
}

class VaultCryptoError extends VaultError {
  constructor(message) {
    super(message, 'ERR_VAULT_AUTH_FAILED', EXIT_CODES.AUTH_ERROR);
  }
}

class VaultSecurityError extends VaultError {
  constructor(message) {
    super(message, 'ERR_VAULT_UNSAFE_KEY', EXIT_CODES.SECURITY_ERROR);
  }
}

module.exports = Object.freeze({
  VaultError,
  VaultFormatError,
  VaultCryptoError,
  VaultSecurityError
});
