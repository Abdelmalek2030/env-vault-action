#!/usr/bin/env node
'use strict';

const { runAction } = require('./runner');
const { emitError } = require('./masker');
const { EXIT_CODES } = require('./constants');

function main() {
  try {
    runAction();
  } catch (err) {
    const code = err && err.code ? `[${err.code}] ` : '';
    const message = err && err.message ? err.message : 'Unexpected vault execution failure.';
    emitError(`${code}${message}`);
    process.exitCode = (err && err.exitCode) || EXIT_CODES.USAGE_ERROR;
  }
}

if (require.main === module) {
  main();
}

module.exports = Object.freeze({
  main
});
