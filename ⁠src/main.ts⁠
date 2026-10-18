import * as fs from 'fs';
import * as path from 'path';
import { decryptVaultBuffer } from './crypto';
import { ActionInputs, InjectionResult, SecretEntry } from './types';

export function parseDotenvContent(content: string): SecretEntry[] {
  const lines = content.split(/\r?\n/);
  const entries: SecretEntry[] = [];

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, eqIndex).trim();
    const rawValue = trimmed.slice(eqIndex + 1).trim();
    const cleanValue = rawValue.replace(/^['"]|['"]$/g, '');

    entries.push({ key, value: cleanValue, line: i + 1 });
  }

  return entries;
}

export function injectSecrets(entries: SecretEntry[], envFilePath?: string): InjectionResult {
  const injectedKeys: string[] = [];

  for (const entry of entries) {
    if (entry.value.length > 0) {
      process.stdout.write(`::add-mask::${entry.value}\n`);
    }

    if (envFilePath) {
      fs.appendFileSync(envFilePath, `${entry.key}=${entry.value}\n`, 'utf8');
    }

    injectedKeys.push(entry.key);
  }

  return {
    totalParsed: entries.length,
    injectedKeys,
  };
}

function resolveInputs(): ActionInputs {
  return {
    vaultFile: process.env.INPUT_VAULT_FILE || '.env.vault',
    vaultKey: process.env.INPUT_VAULT_KEY || '',
    failOnEmpty: (process.env.INPUT_FAIL_ON_EMPTY || 'true') === 'true',
  };
}

async function run(): Promise<void> {
  try {
    const inputs = resolveInputs();
    const targetPath = path.resolve(process.cwd(), inputs.vaultFile);

    if (!fs.existsSync(targetPath)) {
      throw new Error(`Encrypted vault file not found: ${targetPath}`);
    }

    const encryptedBuffer = fs.readFileSync(targetPath);
    const plaintext = decryptVaultBuffer(encryptedBuffer, inputs.vaultKey);
    const entries = parseDotenvContent(plaintext);

    if (inputs.failOnEmpty && entries.length === 0) {
      throw new Error('Decrypted vault contains zero valid key-value pairs');
    }

    const result = injectSecrets(entries, process.env.GITHUB_ENV);
    process.stdout.write(
      `::notice::Successfully decrypted and injected ${result.totalParsed} secret(s) into GITHUB_ENV.\n`
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stdout.write(`::error::env-vault-action failed: ${message}\n`);
    process.exit(1);
  }
}

run();
