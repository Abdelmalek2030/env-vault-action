# Architecture & CI/CD Execution Specification

`env-vault-action` is the official zero-dependency GitHub Action companion to [`env-vault-cli`](https://github.com/Abdelmalek2030/env-vault-cli). It decrypts committed `.env.vault` envelopes directly inside GitHub Actions runners (`node20`) without installing external packages or exposing secrets in build logs.

---

## 1. Wire Format Compatibility (`v1` Envelope)

`env-vault-action` parses the exact deterministic colon-delimited AEAD envelope produced by `env-vault-cli`:

```text
v1:<salt_hex>:<iv_hex>:<auth_tag_hex>:<ciphertext_hex>
```

| Field | Size | Encoding | Purpose |
| :--- | :--- | :--- | :--- |
| `version` | 2 chars (`v1`) | ASCII | Protocol version identifier bound into AAD |
| `salt` | 16 bytes (128-bit) | Hex (32 chars) | RFC 7914 `scrypt` key derivation salt |
| `iv` | 12 bytes (96-bit) | Hex (24 chars) | NIST SP 800-38D `AES-256-GCM` nonce |
| `auth_tag` | 16 bytes (128-bit) | Hex (32 chars) | GCM integrity and authenticity tag |
| `ciphertext` | Variable | Hex | Encrypted `.env` payload |

- **Additional Authenticated Data (AAD)**: The ASCII prefix `v1:<salt_hex>:<iv_hex>` is bound via `decipher.setAAD()` so any header tampering immediately fails `decipher.final()`.

---

## 2. Runner Execution Dataflow

```text
[GitHub Secret:vault-key] + [Committed .env.vault]
                       │
                       ▼
        ┌──────────────────────────────┐
        │ 1. Envelope Parser & Validator│ (Strict hex & byte-length checks)
        └──────────────┬───────────────┘
                       ▼
        ┌──────────────────────────────┐
        │ 2. scrypt KDF (N=16384,r=8)  │ (Derives 32-byte key in memory)
        └──────────────┬───────────────┘
                       ▼
        ┌──────────────────────────────┐
        │ 3. AES-256-GCM AEAD Decrypt  │ (Verifies AAD + 128-bit authTag)
        └──────────────┬───────────────┘
                       ▼
        ┌──────────────────────────────┐
        │ 4. Strict .env AST Parser    │ (Validates POSIX KEY=VALUE keys)
        └──────────────┬───────────────┘
                       ▼
        ┌──────────────────────────────┐
        │ 5. CI Log Masker (::add-mask)│ (Masks values BEFORE export/write)
        └──────┬───────────────┬───────┘
               ▼               ▼
   [Export to $GITHUB_ENV]  [Atomic 0600 File Write]
               │               │
               └───────┬───────┘
                       ▼
        ┌──────────────────────────────┐
        │ 6. Memory Zeroization        │ (buf.fill(0) in finally block)
        └──────────────────────────────┘
```

---

## 3. Module Layout (`src/`)

- `src/constants.js`: Cryptographic parameters, regex validators, and exit codes.
- `src/errors.js`: Structured error hierarchy (`VaultCryptoError`, `VaultFormatError`, `VaultSecurityError`).
- `src/kdf.js`: RFC 7914 `scrypt` key derivation and buffer zeroization helper.
- `src/crypto.js`: `AES-256-GCM` authenticated decryption and envelope serializer/deserializer.
- `src/parser.js`: Deterministic `.env` parser enforcing strict POSIX environment variable identifiers.
- `src/masker.js`: GitHub Actions `::add-mask::` secret redaction engine.
- `src/exporter.js`: Injection-safe `$GITHUB_ENV` writer (CSPRNG heredoc delimiters) and atomic `0600` `.env` file persistence.
- `src/runner.js`: Core orchestration pipeline connecting inputs, decryption, masking, and outputs.
- `src/index.js`: Zero-dependency GitHub Action CLI/Runner entrypoint.
