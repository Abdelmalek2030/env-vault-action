# Changelog

All notable changes to `env-vault-action` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-10-30

### Added
- Native Node.js (`node20`) zero-dependency GitHub Action runner for `env-vault-cli` `.env.vault` envelopes.
- Authenticated `AES-256-GCM` decryption engine with 96-bit NIST SP 800-38D IVs, 128-bit authentication tags, and AAD header binding.
- RFC 7914 `scrypt` ($N=16384, r=8, p=1$) memory-hard key derivation with 128-bit salts.
- Automatic GitHub Actions log redaction (`::add-mask::`) for all decrypted values prior to environment export.
- Hardened `$GITHUB_ENV` exporter utilizing per-variable 128-bit CSPRNG random heredoc delimiters to prevent workflow command injection.
- Atomic `.env` file writer enforcing strict POSIX `0600` file permissions.
- Automated unit test suite, continuous cryptographic & injection fuzzing (`tests/fuzz.js`), and CodeQL static analysis workflows.
