'use strict';

const PROTOCOL_VERSION = 'v1';
const CIPHER_ALGO = 'aes-256-gcm';

const SCRYPT_PARAMS = Object.freeze({
  N: 16384,
  r: 8,
  p: 1,
  maxmem: 32 * 1024 * 1024
});

const KEY_BYTES = 32;
const SALT_BYTES = 16;
const IV_BYTES = 12;
const TAG_BYTES = 16;
const MAX_VAULT_BYTES = 1024 * 1024; // 1 MiB DoS ceiling
const MIN_PASSPHRASE_LENGTH = 8;

const ENV_KEY_REGEX = /^[A-Za-z_][A-Za-z0-9_]*$/;
const HEX_REGEX = /^[0-9a-fA-F]+$/;

// High-risk runtime hijacking variables blocked from $GITHUB_ENV injection by default
const RESTRICTED_ENV_KEYS = Object.freeze(
  new Set([
    'LD_PRELOAD',
    'LD_LIBRARY_PATH',
    'DYLD_INSERT_LIBRARIES',
    'NODE_OPTIONS',
    'BASH_ENV',
    'ENV',
    'PROMPT_COMMAND',
    'PATH',
    'GITHUB_ENV',
    'GITHUB_OUTPUT',
    'GITHUB_PATH'
  ])
);

const EXIT_CODES = Object.freeze({
  SUCCESS: 0,
  USAGE_ERROR: 1,
  FORMAT_ERROR: 2,
  AUTH_ERROR: 3,
  SECURITY_ERROR: 4,
  IO_ERROR: 5
});

module.exports = Object.freeze({
  PROTOCOL_VERSION,
  CIPHER_ALGO,
  SCRYPT_PARAMS,
  KEY_BYTES,
  SALT_BYTES,
  IV_BYTES,
  TAG_BYTES,
  MAX_VAULT_BYTES,
  MIN_PASSPHRASE_LENGTH,
  ENV_KEY_REGEX,
  HEX_REGEX,
  RESTRICTED_ENV_KEYS,
  EXIT_CODES
});
