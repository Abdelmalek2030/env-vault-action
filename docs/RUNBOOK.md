# Operations Runbook (`env-vault-action`)

Standard Operating Procedures (SOPs) for integrating, rotating, and troubleshooting `env-vault-action` in enterprise GitHub Actions pipelines.

---

## SOP 1: Standard CI/CD Secret Injection

1. Encrypt your `.env` locally using `env-vault-cli`:
   ```sh
   env-vault encrypt .env .env.vault -k "$ENV_VAULT_KEY"
   ```
2. Commit `.env.vault` to your repository (ensure `.env` is in `.gitignore`).
3. Store the passphrase in your GitHub repository under **Settings $\rightarrow$ Secrets and variables $\rightarrow$ Actions** as `ENV_VAULT_KEY`.
4. Add the step to `.github/workflows/deploy.yml`:
   ```yaml
   - name: Decrypt Environment Vault
     uses: Abdelmalek2030/env-vault-action@v1.0.0
     with:
       vault-file: '.env.vault'
       vault-key: ${{ secrets.ENV_VAULT_KEY }}
       export-env: 'true'
       export-file: 'false'
   ```

---

## SOP 2: Emergency Key Rotation

When rotating `ENV_VAULT_KEY` across CI/CD pipelines:
1. Run key rotation locally using `env-vault-cli`:
   ```sh
   env-vault rotate .env.vault --old-key "$OLD_KEY" --new-key "$NEW_KEY"
   ```
2. Update the `ENV_VAULT_KEY` secret in GitHub Actions Settings with `$NEW_KEY`.
3. Commit and push the updated `.env.vault` file.

---

## SOP 3: Troubleshooting Failure Codes

| Error Code | Symptom | Root Cause & Resolution |
| :--- | :--- | :--- |
| `ERR_VAULT_AUTH_FAILED` | `Unsupported state or unable to authenticate data` | Incorrect `vault-key` secret or tampered `.env.vault` file. Verify `secrets.ENV_VAULT_KEY` matches the key used to encrypt. |
| `ERR_VAULT_FORMAT` | `Invalid envelope format or corrupted hex payload` | `.env.vault` was modified manually or truncated. Re-encrypt from source `.env` using `env-vault-cli`. |
| `ERR_VAULT_UNSAFE_KEY` | `Blocked restricted environment variable key` | Vault contains `LD_PRELOAD`, `NODE_OPTIONS`, or `PATH`. Remove dangerous runtime override keys from `.env` unless explicitly allowed. |
