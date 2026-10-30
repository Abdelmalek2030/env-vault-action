# Contributing to `env-vault-action`

Thank you for contributing to `env-vault-action`. Because this GitHub Action operates inside privileged CI/CD pipelines handling production secrets, all contributions must adhere to strict **Zero-Dependency** and **High-Assurance Security** engineering rules.

## Core Architectural Rules

1. **Zero External Runtime Dependencies**:
   - Do **not** add any packages to `dependencies` in `package.json`.
   - All cryptographic, filesystem, and GitHub Actions runner interactions (`$GITHUB_ENV`, `$GITHUB_OUTPUT`, `::add-mask::`, `::error::`) must use native Node.js modules (`node:crypto`, `node:fs`, `node:path`).
2. **Cryptographic Compatibility (`env-vault-cli`)**:
   - Wire format compatibility with `env-vault-cli` (`v1:<salt_hex>:<iv_hex>:<tag_hex>:<ciphertext_hex>`) and RFC 7914 `scrypt` ($N=16384, r=8, p=1$) is strictly required.
3. **Memory Hygiene & Masking**:
   - All derived keys and decrypted buffers must be zeroed via `buf.fill(0)` in `finally` blocks.
   - Secret values must be masked on stdout via `::add-mask::` *before* being written to `$GITHUB_ENV` or disk.

## Local Verification Workflow

Run the verification suite via `Makefile` before submitting a pull request:

```sh
make lint
make test
make fuzz
make security-audit
```

## Commit Message Convention

All commits must follow the **Conventional Commits** specification:
- `feat(runner): ...`
- `fix(crypto): ...`
- `security(masker): ...`
- `docs(architecture): ...`
- `test(fuzz): ...`
