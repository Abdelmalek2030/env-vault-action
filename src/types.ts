export interface ActionInputs {
  readonly vaultFile: string;
  readonly vaultKey: string;
  readonly failOnEmpty: boolean;
}

export interface VaultEnvelope {
  readonly iv: Buffer;
  readonly authTag: Buffer;
  readonly ciphertext: Buffer;
}

export interface SecretEntry {
  readonly key: string;
  readonly value: string;
  readonly line: number;
}

export interface InjectionResult {
  readonly totalParsed: number;
  readonly injectedKeys: string[];
}
