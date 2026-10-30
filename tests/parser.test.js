'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { parseDotenv } = require('../src/parser');
const { VaultFormatError } = require('../src/errors');

test('parser: parses standard, quoted, exported, and multiline .env entries', () => {
  const sample = [
    '# Comment line',
    'APP_ENV=production',
    'export PORT="8080"',
    'PRIVATE_KEY="line1\\nline2"',
    'RAW_SINGLE=\'literal\\nvalue\'',
    'INLINE_COMMENT=value123 # trailing comment'
  ].join('\n');

  const entries = parseDotenv(sample);
  assert.deepEqual(entries, [
    { key: 'APP_ENV', value: 'production' },
    { key: 'PORT', value: '8080' },
    { key: 'PRIVATE_KEY', value: 'line1\nline2' },
    { key: 'RAW_SINGLE', value: 'literal\\nvalue' },
    { key: 'INLINE_COMMENT', value: 'value123' }
  ]);
});

test('parser: rejects invalid POSIX variable identifiers and missing assignments', () => {
  assert.throws(() => parseDotenv('123_INVALID=val'), VaultFormatError);
  assert.throws(() => parseDotenv('BAD-KEY=val'), VaultFormatError);
  assert.throws(() => parseDotenv('MISSING_EQUALS_LINE'), VaultFormatError);
});
