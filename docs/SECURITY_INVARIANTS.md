# Security & Cryptographic Invariants

`env-vault-action` enforces six non-negotiable security invariants across every CI/CD run. Any violation triggers an immediate non-zero exit before secrets can be corrupted or leaked.

---

## Invariant 1: Authenticate-Before-Parse (AEAD Integrity)
Plaintext bytes are never parsed, logged, masked, or written until `decipher.final()` succeeds against both the 128-bit GCM `authTag` and the bound AAD header (`v1:<salt_hex>:<iv_hex>`).

## Invariant 2: Mask-Before-Export (`::add-mask::` Ordering)
Every parsed secret value (and each non-empty line of a multiline secret) **must** be emitted to stdout via `::add-mask::<value>` *prior* to writing to `$GITHUB_ENV`, `$GITHUB_OUTPUT`, or the filesystem. Empty or whitespace-only strings are never masked to avoid corrupting runner log streams.

## Invariant 3: CSPRNG Heredoc Delimiter Isolation (`$GITHUB_ENV`)
Writing untrusted or multiline values to `$GITHUB_ENV` using static delimiters allows attackers to inject arbitrary environment variables (e.g., `LD_PRELOAD` or `NODE_OPTIONS`). `env-vault-action` generates a fresh 128-bit CSPRNG hex token per variable:

```text
KEY<<__ENV_VAULT_EOF_9f86d081884c7d659a2feaa0c55ad015__
<secret_value>
__ENV_VAULT_EOF_9f86d081884c7d659a2feaa0c55ad015__
```

Furthermore, dangerous runtime hijacking keys (`LD_PRELOAD`, `LD_LIBRARY_PATH`, `NODE_OPTIONS`, `BASH_ENV`, `ENV`, `PATH`) are blocked by default unless explicitly permitted.

## Invariant 4: Atomic POSIX `0600` File Persistence
When `export-file` is enabled, decrypted `.env` content is written to a randomized sibling temporary file (`.env.vault.tmp.<random>`) with mode `0o600`, flushed via `fsyncSync`, and atomically renamed over the target path.

## Invariant 5: Explicit Ephemeral Key Zeroization
All `Buffer` instances holding the passphrase, derived 256-bit `scrypt` key, or raw decrypted bytes are overwritten with zeros (`buf.fill(0)`) inside `try / finally` blocks.

## Invariant 6: Zero External Dependencies
`package.json` must never declare runtime `dependencies`. All functionality relies strictly on Node.js built-in modules (`node:crypto`, `node:fs`, `node:path`).
