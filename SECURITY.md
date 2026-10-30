# Security Policy

## Supported Versions

Only the latest stable major release of `env-vault-action` receives active cryptographic and CI/CD runner security updates:

| Version | Node.js Runtime | Vault Format | Supported          |
| ------- | --------------- | ------------ | ------------------ |
| 1.0.x   | `node20`        | `v1` (AEAD)  | :white_check_mark: |
| < 1.0   | Legacy          | Legacy       | :x:                |

## Cryptographic & CI/CD Runner Security Guarantees

`env-vault-action` enforces strict defense-in-depth invariants during GitHub Actions execution:

1. **Zero Supply-Chain Footprint**: Uses exclusively built-in Node.js modules (`node:crypto`, `node:fs`, `node:path`) with zero third-party `npm` runtime dependencies.
2. **Authenticated Encryption (`AES-256-GCM`)**: Verifies 128-bit authentication tags (`authTag`) and protocol header Additional Authenticated Data (AAD) prior to parsing or exporting any plaintext secret.
3. **Automatic CI Log Redaction (`::add-mask::`)**: Registers every decrypted secret value (and non-empty line) with the GitHub Actions log masker before writing to `$GITHUB_ENV` or `$GITHUB_OUTPUT`.
4. **Heredoc Injection Mitigation**: Exports environment variables to `$GITHUB_ENV` using per-variable 128-bit CSPRNG random heredoc delimiters (`__ENV_VAULT_EOF_<HEX>__`) to prevent multiline workflow command injection.
5. **Memory Zeroization**: Explicitly overwrites ephemeral key buffers and intermediate plaintext buffers (`buf.fill(0)`) inside `finally` blocks prior to process termination.

## Reporting a Vulnerability

**Do not open public GitHub issues for suspected cryptographic, log-masking, or workflow injection vulnerabilities.**

Please report security findings privately via email:
- **Contact**: `Abdelmalek2030github@hotmail.com`
- **RFC 9116 Manifest**: [`.well-known/security.txt`](.well-known/security.txt)

### Response SLA
- **Initial Acknowledgment**: Within 24 hours.
- **Triage & Severity Assessment**: Within 72 hours.
- **Patch & Advisory Publication**: Within 7 days for critical vulnerabilities.
