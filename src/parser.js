'use strict';

const { ENV_KEY_REGEX } = require('./constants');
const { VaultFormatError } = require('./errors');

/**
 * Parses decrypted .env content into validated key-value entries.
 * Supports comments (#), optional "export " prefixes, single/double quotes, and escape sequences.
 * @param {string} content
 * @returns {Array<{ key: string, value: string }>}
 */
function parseDotenv(content) {
  if (typeof content !== 'string') {
    throw new VaultFormatError('Decrypted dotenv content must be a string.');
  }

  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const map = new Map();

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine || rawLine.startsWith('#')) {
      continue;
    }

    const normalized = rawLine.startsWith('export ')
      ? rawLine.slice(7).trim()
      : rawLine;

    const eqIndex = normalized.indexOf('=');
    if (eqIndex === -1) {
      throw new VaultFormatError(`Malformed dotenv entry at line ${i + 1}: missing '=' assignment.`);
    }

    const key = normalized.slice(0, eqIndex).trim();
    if (!ENV_KEY_REGEX.test(key)) {
      throw new VaultFormatError(`Invalid POSIX environment variable identifier at line ${i + 1}: '${key}'.`);
    }

    let rawValue = normalized.slice(eqIndex + 1).trim();
    let value = rawValue;

    if (
      (rawValue.startsWith('"') && rawValue.endsWith('"') && rawValue.length >= 2) ||
      (rawValue.startsWith("'") && rawValue.endsWith("'") && rawValue.length >= 2)
    ) {
      const quote = rawValue[0];
      value = rawValue.slice(1, -1);
      if (quote === '"') {
        value = value
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\');
      }
    } else {
      const commentIdx = rawValue.indexOf(' #');
      if (commentIdx !== -1) {
        value = rawValue.slice(0, commentIdx).trim();
      }
    }

    map.set(key, value);
  }

  return Array.from(map.entries(), ([key, value]) => ({ key, value }));
}

module.exports = Object.freeze({
  parseDotenv
});
