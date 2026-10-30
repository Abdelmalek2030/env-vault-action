# Threat Model (STRIDE Analysis)

This document defines the threat landscape for `env-vault-action` when decrypting secrets inside GitHub Actions CI/CD pipelines.

---

## 1. Trust Boundaries

- **Trusted**: The GitHub Actions runner kernel, Node.js runtime (`node20`), and the `vault-key` injected via encrypted GitHub Actions Secrets.
- **Untrusted / Semi-Trusted**: Repository contents (including `.env.vault` modified in pull requests), downstream workflow steps, and public CI build logs.

---

## 2. STRIDE Threat Matrix

| Threat Category | Attack Vector | Impact | Mitigation in `env-vault-action` |
| :--- | :--- | :--- | :--- |
| **Spoofing** | Forged `.env.vault` committed in a malicious PR | Unauthorized config injection | `AES-256-GCM` 128-bit `authTag` verification with `scrypt`-derived key fails immediately without valid `vault-key`. |
| **Tampering** | Modifying envelope version, salt, or IV headers | Downgrade or bit-flipping attacks | Full prefix `v1:<salt>:<iv>` bound as Additional Authenticated Data (AAD) via `decipher.setAAD()`. |
| **Repudiation** | Silent decryption failure or partial variable export | Inconsistent CI deployment state | All-or-nothing atomic verification; structured error codes and non-zero exit on any malformed key or tag failure. |
| **Information Disclosure** | Accidental printing of decrypted secrets in GitHub Actions console logs | Credential leak in public/private CI logs | Pre-export `::add-mask::` registration for every line + suppression of raw secret values in all error messages. |
| **Elevation of Privilege** | Multiline `$GITHUB_ENV` injection or `NODE_OPTIONS` / `LD_PRELOAD` hijacking | Arbitrary code execution in subsequent steps | Per-variable 128-bit CSPRNG heredoc delimiters + denylist blocking dangerous dynamic linker / runtime environment variables. |
| **Denial of Service** | Oversized `.env.vault` payload exhausting runner memory | CI runner OOM crash | Strict 1 MiB maximum vault file size enforcement prior to reading or KDF execution. |
