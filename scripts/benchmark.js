#!/usr/bin/env node
'use strict';

const { performance } = require('node:perf_hooks');
const { encryptEnvelope, decryptEnvelope } = require('../src/crypto');
const { parseDotenv } = require('../src/parser');
const { formatGithubEnvPayload } = require('../src/exporter');

const SAMPLE_ENV = Array.from({ length: 50 }, (_, i) => `SECRET_KEY_${i}="val_${i}_abcdef123456"`).join('\n');
const PASSPHRASE = 'benchmark-passphrase-2026';
const ROUNDS = 25;

function runBenchmark() {
  console.log(`==> Benchmarking env-vault-action (${ROUNDS} rounds, 50 secrets/vault)...`);
  const envelope = encryptEnvelope(SAMPLE_ENV, PASSPHRASE);

  const start = performance.now();
  for (let i = 0; i < ROUNDS; i++) {
    const raw = decryptEnvelope(envelope, PASSPHRASE);
    const entries = parseDotenv(raw);
    formatGithubEnvPayload(entries);
  }
  const elapsedMs = performance.now() - start;
  const avgMs = (elapsedMs / ROUNDS).toFixed(2);

  console.log(`OK: Total=${elapsedMs.toFixed(2)}ms | Avg=${avgMs}ms per full CI decrypt+export cycle.`);
}

runBenchmark();
