'use strict';

/**
 * Generates GitHub Actions ::add-mask:: commands for a secret value.
 * Splits multiline values so every non-empty line is individually redacted.
 * @param {string} value
 * @returns {string[]}
 */
function formatMaskCommands(value) {
  if (typeof value !== 'string' || value.length === 0) {
    return [];
  }

  const lines = value.replace(/\r\n/g, '\n').split('\n');
  const commands = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length > 0) {
      commands.push(`::add-mask::${trimmed}`);
    }
  }

  return commands;
}

/**
 * Emits ::add-mask:: commands for all parsed entries prior to export.
 * @param {Array<{ key: string, value: string }>} entries
 * @param {(line: string) => void} [writeLine]
 * @returns {number} Count of masked secret lines emitted
 */
function maskSecrets(entries, writeLine = (line) => process.stdout.write(`${line}\n`)) {
  let maskedCount = 0;
  for (const { value } of entries) {
    const commands = formatMaskCommands(value);
    for (const cmd of commands) {
      writeLine(cmd);
      maskedCount += 1;
    }
  }
  return maskedCount;
}

/**
 * Emits a structured GitHub Actions error annotation without leaking sensitive values.
 * @param {string} message
 * @param {(line: string) => void} [writeLine]
 */
function emitError(message, writeLine = (line) => process.stdout.write(`${line}\n`)) {
  const safeMsg = String(message).replace(/\r?\n/g, ' ');
  writeLine(`::error title=env-vault-action::${safeMsg}`);
}

/**
 * Emits a structured GitHub Actions notice annotation.
 * @param {string} message
 * @param {(line: string) => void} [writeLine]
 */
function emitNotice(message, writeLine = (line) => process.stdout.write(`${line}\n`)) {
  const safeMsg = String(message).replace(/\r?\n/g, ' ');
  writeLine(`::notice title=env-vault-action::${safeMsg}`);
}

module.exports = Object.freeze({
  formatMaskCommands,
  maskSecrets,
  emitError,
  emitNotice
});
