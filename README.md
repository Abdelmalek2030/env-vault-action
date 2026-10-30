# env-vault-action

<div align="center">

[![CI Matrix & Quality Gate](https://github.com/Abdelmalek2030/env-vault-action/actions/workflows/ci.yml/badge.svg)](https://github.com/Abdelmalek2030/env-vault-action/actions/workflows/ci.yml)
[![CodeQL Security Audit](https://github.com/Abdelmalek2030/env-vault-action/actions/workflows/codeql.yml/badge.svg)](https://github.com/Abdelmalek2030/env-vault-action/actions/workflows/codeql.yml)
[![Continuous Fuzzing](https://github.com/Abdelmalek2030/env-vault-action/actions/workflows/fuzz.yml/badge.svg)](https://github.com/Abdelmalek2030/env-vault-action/actions/workflows/fuzz.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Runtime](https://img.shields.io/badge/GitHub_Actions-node20-2088FF?logo=github-actions&logoColor=white)](action.yml)
[![Language](https://img.shields.io/badge/Language-JavaScript%20100%25-F7DF1E.svg)]()
[![Dependencies](https://img.shields.io/badge/Dependencies-Zero-brightgreen.svg)]()

**Official reference-grade, zero-dependency GitHub Action companion for [`env-vault-cli`](https://github.com/Abdelmalek2030/env-vault-cli). Authenticates and decrypts committed `.env.vault` envelopes in-memory using native Node.js (`node:crypto`) `AES-256-GCM` and injects secrets into `$GITHUB_ENV` with automatic CI log masking.**

</div>

---

## 🏗️ Architecture & CI/CD Security Philosophy

`env-vault-action` is engineered for high-assurance Fintech and enterprise CI/CD pipelines adhering to strict *Zero Supply-Chain Bloat* and *Defense-in-Depth* invariants:

- **Zero External Dependencies**: Built exclusively on native Node.js modules (`node:crypto`, `node:fs`, `node:path`) running directly on `node20` with zero third-party `npm` packages.
- **Wire-Compatible `AES-256-GCM` & `scrypt`**: Enforces 100% deterministic compatibility with `env-vault-cli` `v1` envelopes using RFC 7914 `scrypt` ($N=16384, r=8, p=1$), 96-bit NIST IVs, 128-bit authentication tags (`authTag`), and Additional Authenticated Data (AAD) header binding.
- **Mask-Before-Export Log Redaction (`::add-mask::`)**: Registers every decrypted secret value (and each line of multiline secrets) with the GitHub Actions log masker *prior* to writing to `$GITHUB_ENV` or disk.
- **CSPRNG Heredoc Injection Protection**: Exports variables to `$GITHUB_ENV` using per-variable 128-bit CSPRNG random heredoc delimiters (`__ENV_VAULT_EOF_<HEX>__`) and blocks dangerous runtime hijacking variables (`LD_PRELOAD`, `NODE_OPTIONS`, `PATH`) by default.
- **Atomic Persistence & Memory Hygiene**: Optionally writes `.env` files via crash-safe atomic renames with strict POSIX `0600` permissions and explicitly zeroes ephemeral key buffers (`buf.fill(0)`).

---

## 🚀 Quick Usage & CI/CD Workflows

### 1. Inject Secrets into `$GITHUB_ENV` (Recommended In-Memory Mode)
```yaml
steps:
  - name: Checkout Repository
    uses: actions/checkout@v4

  - name: Decrypt Environment Vault
    uses: Abdelmalek2030/env-vault-action@v1.0.0
    with:
      vault-file: '.env.vault'
      vault-key: ${{ secrets.ENV_VAULT_KEY }}
      export-env: 'true'
      export-file: 'false'

  - name: Run Production Deployment
    run: ./deploy.sh
```

### 2. Atomic `.env` File Materialization (`POSIX 0600`)
```yaml
  - name: Materialize Decrypted .env File Atomically
    id: vault
    uses: Abdelmalek2030/env-vault-action@v1.0.0
    with:
      vault-file: 'config/.env.production.vault'
      vault-key: ${{ secrets.ENV_VAULT_KEY }}
      export-env: 'false'
      export-file: 'true'
      output-path: '.env.production'
```

---

## ⚙️ Action Inputs & Outputs Specification

### Inputs

| Input | Required | Default | Description |
| :--- | :---: | :---: | :--- |
| `vault-file` | No | `.env.vault` | Path to the encrypted `.env.vault` envelope committed in the repository. |
| `vault-key` | **Yes** | — | Master passphrase (stored in GitHub Secrets) used to derive the 256-bit `scrypt` key. |
| `export-env` | No | `'true'` | Export decrypted variables to `$GITHUB_ENV` using CSPRNG random heredoc delimiters. |
| `export-file` | No | `'false'` | Persist decrypted variables atomically to `output-path` with POSIX `0600` permissions. |
| `output-path` | No | `.env` | Destination file path when `export-file` is set to `'true'`. |
| `allow-unsafe-keys` | No | `'false'` | Permit restricted runtime variables (`LD_PRELOAD`, `NODE_OPTIONS`, `PATH`). |

### Outputs

| Output | Description |
| :--- | :--- |
| `keys-count` | Total number of environment variables authenticated and decrypted. |
| `vault-version` | Authenticated wire format version of the vault envelope (`v1`). |

---

## 📖 Operational Documentation & Specifications

- **[Architecture & Runner Dataflow (`docs/ARCHITECTURE.md`)](docs/ARCHITECTURE.md)**: Specification of the `v1` AEAD wire format and CI execution pipeline.
- **[Security Invariants (`docs/SECURITY_INVARIANTS.md`)](docs/SECURITY_INVARIANTS.md)**: Mandatory authenticate-before-parse, mask-before-export, and CSPRNG heredoc isolation rules.
- **[Threat Model (`docs/THREAT_MODEL.md`)](docs/THREAT_MODEL.md)**: STRIDE analysis and CI/CD runner attack mitigation matrix.
- **[Operations Runbook (`docs/RUNBOOK.md`)](docs/RUNBOOK.md)**: Standard operating procedures for CI secret injection and emergency key rotation.

---

## 🛡️ Security & Vulnerability Disclosure

- **[Security Policy (`SECURITY.md`)](SECURITY.md)**
- **[RFC 9116 Security Disclosure (`.well-known/security.txt`)](.well-known/security.txt)**

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.
