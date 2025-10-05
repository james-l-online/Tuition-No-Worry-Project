````markdown
# GitHub Actions workflows (this directory)

This folder contains GitHub Actions workflow files used for CI, build, and security checks. The workflows in
this repository are intentionally provided as demo/commented examples — review and enable them only after
replacing secrets and adapting steps to your environment.

Files in this directory
- `acr-admin-build-push.yml` — Example workflow to build a Docker image and push to Azure Container Registry
  using ACR admin credentials (less secure; OK for quick demos). This file is commented-out for review-only.
- `ci-deploy-acr-aks.yml` — Example build & deploy pipeline that builds an image, pushes to ACR, and deploys
  to AKS. It demonstrates using OIDC or secrets to authenticate and shows `build` and `deploy` stages. Commented-out for safety.
- `secret-scan.yml` — Enabled workflow that runs a repository secret scan (gitleaks) on every push and PR.

How to use these workflows

1. Review and adapt the workflow YAML before enabling it. Pay special attention to:
   - Secrets and credentials used (do NOT commit them in the repo).
   - The image name, tags, and Helm/`kubectl` commands — update to match chart names and deployment manifests.
   - Branch filters (`on.push.branches`) — adjust to your branch strategy.

2. Store sensitive values in repository or organization secrets (recommended):
   - `ACR_LOGIN_SERVER` (e.g. myregistry.azurecr.io)
   - `ACR_ADMIN_USERNAME`, `ACR_ADMIN_PASSWORD` (if using admin/demo flow)
   - `AZURE_CREDENTIALS` (for AKS operations via OIDC/service principal)
   - `AKS_CLUSTER_NAME`, `AKS_RESOURCE_GROUP` (for azure/aks-set-context)
   - `HELM_DEPLOY` (optional env to control whether to run Helm deploy step in demo workflows)

3. Prefer OIDC / short-lived credentials
   - For production use, prefer GitHub OIDC or short-lived service principals instead of long-lived admin credentials.
   - The demo `ci-deploy-acr-aks.yml` includes an example OIDC login step; adapt to your chosen auth method.

4. Enable a workflow
   - Remove the comment markers (#) and commit the file, or copy the example to a new workflow file and enable it.
   - Example (safe): create a new file `ci-build.yml` with only the build steps you need and configure secrets.

Quick notes on each workflow

- `secret-scan.yml` (enabled):
  - Runs `gitleaks` on pushes and PRs to protect against accidental secret commits. Requires `GITHUB_TOKEN` which
    is provided by GitHub Actions automatically.

- `acr-admin-build-push.yml` (commented demo):
  - Quick demo using ACR admin creds. Use only for short-term demos. Replace with OIDC for CI/production.

- `ci-deploy-acr-aks.yml` (commented demo):
  - Full pipeline demo: checkout, build, push, and deploy. Requires careful secret management and cluster creds.

Security checklist before enabling CI workflows
- Add repository secrets via Settings → Secrets → Actions and do not commit secrets into the repo.
- Limit the scope of credentials (AcrPull role for UAMI or ACR token instead of admin creds).
- Keep `secret-scan.yml` enabled to help detect accidental secrets.

````
