'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { formatMaskCommands, maskSecrets } = require('../src/masker');

test('masker: emits ::add-mask:: for single-line and multiline secrets', () => {
  const cmds = formatMaskCommands('line-one\n\n  line-two  \n');
  assert.deepEqual(cmds, ['::add-mask::line-one', '::add-mask::line-two']);
});

test('masker: skips empty or whitespace-only values to protect CI log stream', () => {
  assert.deepEqual(formatMaskCommands(''), []);
  assert.deepEqual(formatMaskCommands('   \n  '), []);

  const output = [];
  const count = maskSecrets(
    [
      { key: 'EMPTY_VAL', value: '' },
      { key: 'API_SECRET', value: 'top-secret-token' }
    ],
    (line) => output.push(line)
  );
  assert.equal(count, 1);
  assert.deepEqual(output, ['::add-mask::top-secret-token']);
});
