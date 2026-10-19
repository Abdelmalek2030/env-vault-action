# env-vault-action ⚡

Official GitHub Action companion for [env-vault-cli](https://github.com/Abdelmalek2030/env-vault-cli). Decrypts committed `.env.vault` artifacts in-memory using authenticated AES-256-GCM and injects variables directly into `$GITHUB_ENV` with automatic CI log masking.

---

## 🔑 Key Capabilities

- **Zero External Dependencies**: Relies strictly on native Node.js `crypto`, `fs`, and `path` modules to eliminate supply-chain risk.
- **In-Memory Decryption**: Plaintext secrets are never written to a `.env` file on the runner workspace disk.
- **Automated Log Masking**: Issues `::add-mask::` workflow commands before exporting each secret to prevent accidental exposure in step outputs.

---

## 🚀 Usage

```yaml
name: Deploy Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout source
        uses: actions/checkout@v4
