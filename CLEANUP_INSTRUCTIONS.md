Cleanup instructions for repository hygiene

This file collects safe, actionable steps to remove local Terraform caches, large debug logs, and accidentally committed secret files from the repository.

1) Ensure .gitignore contains the following entries (already set in this repo):

```
.terraform/
*.tfstate
*.tfstate.*
*tf-debug.log
.env
```

2) Remove tracked `.terraform` directories from the git index (non-destructive):

```powershell
# run from repo root, replace MODULE_PATH with directories like tf-acr, tf-aks, etc.
git rm -r --cached tf-acr/.terraform
git rm -r --cached tf-aks/.terraform
# Commit
git commit -m "chore: remove tracked terraform local caches"
git push
```

3) Delete or archive large debug logs (example: tf-acr/tf-debug.log). To archive in-repo (non-destructive):

```powershell
mkdir -Force sql\archive
git mv tf-acr/tf-debug.log sql\archive/
git commit -m "chore: archive tf-acr debug log"
git push
```

4) If `.env` was committed accidentally:

- Remove it from the repo index and commit (do not re-push secrets):

```powershell
git rm --cached .env
git commit -m "chore: remove committed .env"
git push
```

- Rotate any credentials that were present in the file (DB passwords, Clerk keys, Azure SP credentials).

5) Rewriting history (only if necessary and after team approval):

If sensitive data or large binaries are already in commit history, use `git filter-repo` or `bfg` to purge them. Example using git filter-repo (install first):

```powershell
# Remove a path from all history
git clone --mirror REPO_URL repo-mirror.git
cd repo-mirror.git
git filter-repo --path tf-acr/.terraform --invert-paths
# Push the rewritten history back (force)
git push --force
```

Warning: rewriting history requires coordination with all collaborators and will change commit hashes. Rotate secrets after purge.

6) Verify

- Use `git status` and `git ls-files | Select-String ".terraform"` (PowerShell) to confirm no tracked .terraform folders remain.
- Run `git rev-list --objects --all | Select-String "FILENAME"` to see if a file remains in history.

If you want, tell me which exact files you want removed from history and I will produce the tailored `git filter-repo` or `bfg` commands.
