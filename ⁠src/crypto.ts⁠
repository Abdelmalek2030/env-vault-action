import * as crypto from 'crypto';
import { VaultEnvelope } from './types';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTE_LENGTH = 12;
const AUTH_TAG_BYTE_LENGTH = 16;
const MIN_PAYLOAD_LENGTH = IV_BYTE_LENGTH + AUTH_TAG_BYTE_LENGTH + 1;

export function parseVaultEnvelope(rawBuffer: Buffer): VaultEnvelope {
  if (rawBuffer.byteLength < MIN_PAYLOAD_LENGTH) {
    throw new Error(
      `Invalid vault binary: expected at least ${MIN_PAYLOAD_LENGTH} bytes, got ${rawBuffer.byteLength}`
    );
  }

  return {
    iv: rawBuffer.subarray(0, IV_BYTE_LENGTH),
    authTag: rawBuffer.subarray(IV_BYTE_LENGTH, IV_BYTE_LENGTH + AUTH_TAG_BYTE_LENGTH),
    ciphertext: rawBuffer.subarray(IV_BYTE_LENGTH + AUTH_TAG_BYTE_LENGTH),
  };
}

export function deriveMasterKey(passphrase: string): Buffer {
  const normalized = passphrase.trim();
  if (normalized.length === 0) {
    throw new Error('Master key passphrase cannot be empty');
  }
  return crypto.createHash('sha256').update(normalized, 'utf8').digest();
}

export function decryptVaultBuffer(rawBuffer: Buffer, rawKey: string): string {
  const envelope = parseVaultEnvelope(rawBuffer);
  const derivedKey = deriveMasterKey(rawKey);

  const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, envelope.iv);
  decipher.setAuthTag(envelope.authTag);

  const decrypted = Buffer.concat([
    decipher.update(envelope.ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}
